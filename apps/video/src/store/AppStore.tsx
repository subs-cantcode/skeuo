import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CHANNELS } from '../data/channels';
import { SEED_COMMENTS } from '../data/comments';
import { VIDEOS } from '../data/videos';
import type { Channel, Comment, Playlist, Toast, Video, Vote } from '../types';
import { loadJson, saveJson } from './persistence';
import { LIBRARY_CHANNEL_ID, libraryEntryToVideo } from '../lib/library';
import { dedupeVideosById } from '../lib/related';
import { normalizeCategory } from '../lib/categories';
import { useLibrary, type LibraryApi } from './useLibrary';

export interface Profile {
  name: string;
  handle: string;
}

interface PersistedState {
  profile: Profile | null;
  subscriptions: string[];
  votes: Record<string, Vote>;
  comments: Comment[];
  playlists: Playlist[];
  drafts: Video[];
}

const LOCAL_CHANNEL_ID = 'me';
const STORAGE_KEY = 'skeuo.video.state.v1';

/** Local channel record for the signed-in profile. */
export function localChannel(profile: Profile): Channel {
  return {
    id: LOCAL_CHANNEL_ID,
    name: profile.name,
    handle: profile.handle,
    bio: 'This is your local profile for Skeuo Video. It lives in this browser only until accounts arrive in Milestone 2.',
    joined: new Date().toISOString().slice(0, 10),
    country: 'Not set',
    website: '',
    themeColor: '#4a4f57',
    subscribers: 0,
    channelViews: 0,
    videosWatched: 0,
  };
}

/**
 * Stand-in channel for imported videos. Signed in, the profile's own channel is
 * used instead; signed out, the library still needs a channel for its cards.
 */
const LIBRARY_CHANNEL: Channel = {
  id: LIBRARY_CHANNEL_ID,
  name: 'My Library',
  handle: 'mylibrary',
  bio: 'Videos imported into this browser. They are stored on this device and are never uploaded anywhere.',
  joined: new Date().toISOString().slice(0, 10),
  country: 'Not set',
  website: '',
  themeColor: '#4a4f57',
  subscribers: 0,
  channelViews: 0,
  videosWatched: 0,
};

function readState(): PersistedState {
  const stored = loadJson<Partial<PersistedState>>(STORAGE_KEY, {});
  return {
    profile: stored.profile ?? null,
    subscriptions: Array.isArray(stored.subscriptions) ? stored.subscriptions : [],
    votes: stored.votes ?? {},
    comments: Array.isArray(stored.comments) ? stored.comments : [],
    playlists: Array.isArray(stored.playlists) ? stored.playlists : [],
    // Object URLs die with the tab; drop them so the watch page can explain
    // that the local file is no longer attached instead of showing a dead player.
    // A draft's category may have been saved under an older spelling. Normalise
    // it on read rather than rewriting the stored record, so nothing is lost if
    // the user goes back to an earlier build.
    drafts: Array.isArray(stored.drafts)
      ? stored.drafts.map((draft: Video) => ({
          ...draft,
          category: normalizeCategory(String(draft.category ?? '')) as Video['category'],
          src: draft.src.startsWith('blob:') ? '' : draft.src,
        }))
      : [],
  };
}

interface StoreValue extends PersistedState {
  videos: Video[];
  channels: Channel[];
  library: LibraryApi;
  ownChannel: Channel | null;
  /** True for the profile's own channel and for this browser's library channel. */
  isOwnChannel: (channelId: string) => boolean;
  getChannel: (id: string) => Channel | undefined;
  getVideo: (id: string) => Video | undefined;
  commentsFor: (videoId: string) => Comment[];
  isSubscribed: (channelId: string) => boolean;
  signIn: (profile: Profile) => void;
  signOut: () => void;
  toggleSubscribe: (channelId: string) => void;
  setVote: (videoId: string, vote: Vote) => void;
  addComment: (videoId: string, body: string) => boolean;
  deleteComment: (commentId: string) => void;
  toggleSpam: (commentId: string) => void;
  createPlaylist: (name: string) => Playlist | null;
  renamePlaylist: (playlistId: string, name: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addToPlaylist: (playlistId: string, videoId: string) => boolean;
  removeFromPlaylist: (playlistId: string, videoId: string) => void;
  movePlaylistItem: (playlistId: string, videoId: string, direction: -1 | 1) => void;
  videosInPlaylist: (playlistId: string) => Video[];
  addDraft: (video: Video) => void;
  toasts: Toast[];
  toast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(readState);
  const library = useLibrary();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    saveJson(STORAGE_KEY, state);
  }, [state]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, tone: Toast['tone'] = 'info') => {
      toastId.current += 1;
      const id = toastId.current;
      setToasts((current) => [...current.slice(-3), { id, message, tone }]);
      const timer = window.setTimeout(() => dismissToast(id), 4500);
      timers.current.push(timer);
    },
    [dismissToast],
  );

  const ownChannel = useMemo(
    () => (state.profile ? localChannel(state.profile) : null),
    [state.profile],
  );

  const libraryVideos = useMemo(
    () => library.items.map(libraryEntryToVideo),
    [library.items],
  );

  const channels = useMemo(() => {
    const list = ownChannel ? [ownChannel, ...CHANNELS] : [...CHANNELS];
    return libraryVideos.length > 0 ? [LIBRARY_CHANNEL, ...list] : list;
  }, [ownChannel, libraryVideos.length]);

  const videos = useMemo(
    // Drafts, the library and the catalog are concatenated here, so dedupe by id:
    // every list in the app reads from this array.
    () => dedupeVideosById([...state.drafts, ...libraryVideos, ...VIDEOS]),
    [state.drafts, libraryVideos],
  );

  const isOwnChannel = useCallback(
    (channelId: string) =>
      channelId === LIBRARY_CHANNEL_ID || (ownChannel !== null && channelId === ownChannel.id),
    [ownChannel],
  );

  const getChannel = useCallback(
    (id: string) => channels.find((channel) => channel.id === id),
    [channels],
  );

  const getVideo = useCallback(
    (id: string) => videos.find((video) => video.id === id),
    [videos],
  );

  const commentsFor = useCallback(
    (videoId: string) =>
      [...SEED_COMMENTS, ...state.comments]
        .filter((comment) => comment.videoId === videoId)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [state.comments],
  );

  const isSubscribed = useCallback(
    (channelId: string) => state.subscriptions.includes(channelId),
    [state.subscriptions],
  );

  const signIn = useCallback((profile: Profile) => {
    setState((current) => ({ ...current, profile }));
  }, []);

  const signOut = useCallback(() => {
    setState((current) => ({ ...current, profile: null }));
  }, []);

  const toggleSubscribe = useCallback(
    (channelId: string) => {
      // Nobody subscribes to their own channel: the button is replaced by a
      // label, and this guard keeps the stored list clean too.
      if (channelId === LOCAL_CHANNEL_ID || channelId === LIBRARY_CHANNEL_ID) return;
      setState((current) => {
        const subscribed = current.subscriptions.includes(channelId);
        return {
          ...current,
          subscriptions: subscribed
            ? current.subscriptions.filter((id) => id !== channelId)
            : [...current.subscriptions, channelId],
        };
      });
    },
    [],
  );

  const setVote = useCallback((videoId: string, vote: Vote) => {
    setState((current) => {
      const next = { ...current.votes };
      if (next[videoId] === vote) {
        delete next[videoId];
      } else {
        next[videoId] = vote;
      }
      return { ...current, votes: next };
    });
  }, []);

  const addComment = useCallback(
    (videoId: string, body: string) => {
      const trimmed = body.trim();
      if (!state.profile || !trimmed) return false;
      const comment: Comment = {
        id: `local-${Date.now()}`,
        videoId,
        author: state.profile.handle,
        body: trimmed.slice(0, 4000),
        createdAt: new Date().toISOString(),
        likes: 0,
        local: true,
      };
      setState((current) => ({ ...current, comments: [comment, ...current.comments] }));
      return true;
    },
    [state.profile],
  );

  const deleteComment = useCallback((commentId: string) => {
    setState((current) => ({
      ...current,
      comments: current.comments.filter((comment) => comment.id !== commentId),
    }));
  }, []);

  const toggleSpam = useCallback(
    (commentId: string) => {
      const seeded = SEED_COMMENTS.find((comment) => comment.id === commentId);
      if (seeded) {
        // Seeded rows are constants; their spam mark is session-local.
        toast('Sample comments cannot be permanently marked; your local ones can.', 'info');
        return;
      }
      setState((current) => ({
        ...current,
        comments: current.comments.map((comment) =>
          comment.id === commentId ? { ...comment, markedSpam: !comment.markedSpam } : comment,
        ),
      }));
    },
    [toast],
  );

  const createPlaylist = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const playlist: Playlist = {
        id: `pl-${Date.now()}`,
        name: trimmed.slice(0, 80),
        videoIds: [],
        createdAt: new Date().toISOString(),
      };
      setState((current) => ({ ...current, playlists: [...current.playlists, playlist] }));
      return playlist;
    },
    [],
  );

  const renamePlaylist = useCallback((playlistId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setState((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) =>
        playlist.id === playlistId ? { ...playlist, name: trimmed.slice(0, 80) } : playlist,
      ),
    }));
  }, []);

  const deletePlaylist = useCallback((playlistId: string) => {
    setState((current) => ({
      ...current,
      playlists: current.playlists.filter((playlist) => playlist.id !== playlistId),
    }));
  }, []);

  const addToPlaylist = useCallback((playlistId: string, videoId: string) => {
    let added = false;
    setState((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) => {
        if (playlist.id !== playlistId) return playlist;
        if (playlist.videoIds.includes(videoId)) return playlist;
        added = true;
        return { ...playlist, videoIds: [...playlist.videoIds, videoId] };
      }),
    }));
    return added;
  }, []);

  const removeFromPlaylist = useCallback((playlistId: string, videoId: string) => {
    setState((current) => ({
      ...current,
      playlists: current.playlists.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, videoIds: playlist.videoIds.filter((id) => id !== videoId) }
          : playlist,
      ),
    }));
  }, []);

  const movePlaylistItem = useCallback(
    (playlistId: string, videoId: string, direction: -1 | 1) => {
      setState((current) => ({
        ...current,
        playlists: current.playlists.map((playlist) => {
          if (playlist.id !== playlistId) return playlist;
          const index = playlist.videoIds.indexOf(videoId);
          const target = index + direction;
          if (index < 0 || target < 0 || target >= playlist.videoIds.length) return playlist;
          const videoIds = [...playlist.videoIds];
          [videoIds[index], videoIds[target]] = [videoIds[target], videoIds[index]];
          return { ...playlist, videoIds };
        }),
      }));
    },
    [],
  );

  const videosInPlaylist = useCallback(
    (playlistId: string) => {
      const playlist = state.playlists.find((entry) => entry.id === playlistId);
      if (!playlist) return [];
      return playlist.videoIds
        .map((id) => videos.find((video) => video.id === id))
        .filter((video): video is Video => Boolean(video));
    },
    [state.playlists, videos],
  );

  const addDraft = useCallback((video: Video) => {
    const normalized: Video = {
      ...video,
      category: normalizeCategory(video.category) as Video['category'],
    };
    setState((current) => ({ ...current, drafts: [normalized, ...current.drafts] }));
  }, []);

  // Plain object: the provider only renders when state or toasts change, so a
  // memo here would add a dependency list without preventing any re-render.
  const value: StoreValue = {
    ...state,
    videos,
    channels,
    library,
    ownChannel,
    isOwnChannel,
    getChannel,
    getVideo,
    commentsFor,
    isSubscribed,
    signIn,
    signOut,
    toggleSubscribe,
    setVote,
    addComment,
    deleteComment,
    toggleSpam,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    movePlaylistItem,
    videosInPlaylist,
    addDraft,
    toasts,
    toast,
    dismissToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside <AppStoreProvider>');
  return store;
}
