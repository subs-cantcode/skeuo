export const CATEGORIES = [
  'Autos & Vehicles',
  'Comedy',
  'Education',
  'Entertainment',
  'Film & Animation',
  'Gaming',
  'How to & Style',
  'Music',
  'News & Politics',
  'Nonprofits & Activism',
  'People & Blogs',
  'Pets & Animals',
  'Science & Technology',
  'Sports',
  'Travel & Events',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Channel {
  id: string;
  name: string;
  handle: string;
  bio: string;
  joined: string;
  country: string;
  website: string;
  themeColor: string;
  subscribers: number;
  channelViews: number;
  videosWatched: number;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  channelId: string;
  category: Category;
  tags: string[];
  durationSec: number;
  views: number;
  uploadedAt: string;
  /** Sample media URL. Empty for local drafts whose file is no longer attached. */
  src: string;
  /** Deterministic seed for the locally generated thumbnail artwork. */
  thumbSeed: number;
  /**
   * Real frame thumbnail extracted from this video's own source file, when one
   * exists. When absent, the generated SVG artwork from `thumbSeed` is used.
   */
  thumbnail?: string;
  /** True when the item is a local (frontend-only) draft. */
  localDraft?: boolean;
  /**
   * True for fictional demonstration entries. Their title, description,
   * duration and view count are invented, and playback uses a stand-in clip.
   * The interface labels these so nothing is presented as a real video.
   */
  demo?: boolean;
  /** Attribution for externally sourced sample media, when applicable. */
  attribution?: string;
}

export interface Comment {
  id: string;
  videoId: string;
  author: string;
  body: string;
  createdAt: string;
  likes: number;
  markedSpam?: boolean;
  local?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  videoIds: string[];
  createdAt: string;
}

export type Vote = 'up' | 'down';

export interface User {
  name: string;
  handle: string;
}

export interface Toast {
  id: number;
  message: string;
  tone: 'info' | 'error' | 'success';
}
