import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { SidebarBox } from '../components/SidebarBox';
import { SubscribeButton } from '../components/SubscribeButton';
import { Thumbnail } from '../components/Thumbnail';
import { VideoCard } from '../components/VideoCard';
import { channelTint } from '../lib/channel';
import {
  formatDate,
  formatDuration,
  formatSubscribers,
  formatViews,
  plural,
  relativeTime,
} from '../lib/format';
import { moreFromChannel, relatedVideos } from '../lib/related';
import { voteCounts } from '../lib/stats';
import { thumbnailDataUri } from '../lib/thumbnails';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/AppStore';
import { NotFoundPage } from './NotFoundPage';

export function WatchPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const {
    videos,
    getVideo,
    getChannel,
    commentsFor,
    votes,
    setVote,
    profile,
    playlists,
    videosInPlaylist,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    addComment,
    deleteComment,
    toggleSpam,
    toast,
  } = useStore();

  const video = getVideo(id ?? '');
  const channel = video ? getChannel(video.channelId) : undefined;
  const listId = params.get('list');
  const playlist = playlists.find((entry) => entry.id === listId) ?? null;

  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [commentSort, setCommentSort] = useState<'newest' | 'oldest'>('newest');
  const [autoplayNext, setAutoplayNext] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [revealed, setRevealed] = useState<string[]>([]);

  usePageTitle(video ? video.title : 'Video not found');

  if (!video) return <NotFoundPage />;

  const tint = channelTint(channel);
  const counts = voteCounts(video);
  const myVote = votes[video.id];
  const likes = counts.likes + (myVote === 'up' ? 1 : 0);
  const dislikes = counts.dislikes + (myVote === 'down' ? 1 : 0);
  const comments = commentsFor(video.id);
  const sortedComments = [...comments].sort((a, b) =>
    commentSort === 'newest'
      ? Date.parse(b.createdAt) - Date.parse(a.createdAt)
      : Date.parse(a.createdAt) - Date.parse(b.createdAt),
  );
  const related = relatedVideos(video, videos, 12);
  const moreFrom = channel ? moreFromChannel(channel, videos, 5) : [];
  const playlistIndex = playlist ? playlist.videoIds.indexOf(video.id) : -1;
  const playlistVideos = playlist ? videosInPlaylist(playlist.id) : [];
  const nextInPlaylist =
    playlist && playlistIndex >= 0 ? playlist.videoIds[playlistIndex + 1] : undefined;
  const shareUrl = `${window.location.origin}/watch/${video.id}`;

  const handleEnded = () => {
    if (!autoplayNext || !playlist || !nextInPlaylist) return;
    navigate(`/watch/${nextInPlaylist}?list=${playlist.id}`);
  };

  const handleComment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (addComment(video.id, commentBody)) {
      setCommentBody('');
      toast('Comment added in this browser.', 'success');
    }
  };

  const handleCreatePlaylist = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const created = createPlaylist(newPlaylistName);
    if (!created) {
      toast('Give the playlist a name first.', 'error');
      return;
    }
    addToPlaylist(created.id, video.id);
    setNewPlaylistName('');
    toast(`Added to “${created.name}”.`, 'success');
  };

  const toggleReveal = (commentId: string) => {
    setRevealed((current) =>
      current.includes(commentId)
        ? current.filter((entry) => entry !== commentId)
        : [...current, commentId],
    );
  };

  return (
    <div className="watch-layout">
      <div className="watch-main">
        <h1 className="watch-title">{video.title}</h1>

        <div className="player-frame">
          {video.src ? (
            <video
              key={video.id}
              className="player"
              controls
              preload="metadata"
              poster={thumbnailDataUri(video.thumbSeed, tint)}
              onEnded={handleEnded}
            >
              <source src={video.src} type="video/mp4" />
              Your browser cannot play this file. Try another browser or download
              the video.
            </video>
          ) : (
            <div className="player-frame__placeholder">
              <p>
                <strong>No media attached.</strong> This is a local draft whose file
                lived only in the previous tab, so the browser released it. Upload
                the file again to watch it here.
              </p>
              <p>
                <Link to="/upload">Upload again</Link>
              </p>
            </div>
          )}
        </div>

        <div className="byline">
          <div className="byline__identity">
            {channel ? (
              <>
                <Avatar name={channel.name} color={channel.themeColor} size="small" />
                <p>
                  <Link to={`/channel/${channel.id}`} className="byline__channel">
                    {channel.name}
                  </Link>
                  <span className="meta">
                    {' '}
                    · {formatSubscribers(channel.subscribers)} ·{' '}
                    {channel.videosWatched.toLocaleString('en-US')} videos watched
                  </span>
                </p>
              </>
            ) : (
              <p>Unknown channel</p>
            )}
          </div>
          <SubscribeButton channelId={video.channelId} small />
        </div>

        <div className="watch-stats">
          <p className="meta">
            Added {formatDate(video.uploadedAt)} · {formatViews(video.views)} ·{' '}
            {formatDuration(video.durationSec)}
          </p>
          <div className="action-row">
            <button
              type="button"
              className={`button button--small${myVote === 'up' ? ' is-active' : ''}`}
              aria-pressed={myVote === 'up'}
              onClick={() => {
                if (!profile) {
                  navigate(`/signin?next=${encodeURIComponent(`/watch/${video.id}`)}`);
                  return;
                }
                setVote(video.id, 'up');
              }}
            >
              <span aria-hidden="true">▲</span> {likes.toLocaleString('en-US')}
              <span className="sr-only"> likes</span>
            </button>
            <button
              type="button"
              className={`button button--small${myVote === 'down' ? ' is-active' : ''}`}
              aria-pressed={myVote === 'down'}
              onClick={() => {
                if (!profile) {
                  navigate(`/signin?next=${encodeURIComponent(`/watch/${video.id}`)}`);
                  return;
                }
                setVote(video.id, 'down');
              }}
            >
              <span aria-hidden="true">▼</span> {dislikes.toLocaleString('en-US')}
              <span className="sr-only"> dislikes</span>
            </button>
            <button
              type="button"
              className="button button--small"
              aria-expanded={shareOpen}
              onClick={() => setShareOpen((open) => !open)}
            >
              Share
            </button>
            <Link className="button button--small" to={`/playlists?add=${video.id}`}>
              Playlists
            </Link>
          </div>
        </div>

        {shareOpen ? (
          <div className="share-panel">
            <label htmlFor="share-url">Link to this video</label>
            <div className="share-panel__row">
              <input id="share-url" type="text" readOnly value={shareUrl} />
              <button
                type="button"
                className="button button--small"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    toast('Link copied to the clipboard.', 'success');
                  } catch {
                    toast('Copy was blocked. Select the link and copy it manually.', 'error');
                  }
                }}
              >
                Copy link
              </button>
            </div>
            <p className="meta">
              This build has no server, so links only resolve on this machine.
            </p>
          </div>
        ) : null}

        <section className="description" aria-labelledby="description-heading">
          <h2 id="description-heading" className="sr-only">
            Description
          </h2>
          <p className={`description__body${descriptionOpen ? '' : ' is-clamped'}`}>
            {video.description}
          </p>
          <button
            type="button"
            className="link-button"
            aria-expanded={descriptionOpen}
            onClick={() => setDescriptionOpen((open) => !open)}
          >
            {descriptionOpen ? '(less info)' : '(more info)'}
          </button>
          <dl className="description__meta">
            <div>
              <dt>Category:</dt>
              <dd>
                <Link to={`/videos/${encodeURIComponent(video.category)}`}>
                  {video.category}
                </Link>
              </dd>
            </div>
            {video.tags.length > 0 ? (
              <div>
                <dt>Tags:</dt>
                <dd className="tag-list">
                  {video.tags.map((tag) => (
                    <Link key={tag} to={`/results?q=${encodeURIComponent(tag)}`}>
                      {tag}
                    </Link>
                  ))}
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Views:</dt>
              <dd>{formatViews(video.views)}</dd>
            </div>
          </dl>
        </section>

        <details className="playlist-adder">
          <summary>Add to playlist</summary>
          <div className="playlist-adder__body">
            {playlists.length === 0 ? (
              <p className="meta">You have no playlists yet. Create one below.</p>
            ) : (
              <ul className="checklist">
                {playlists.map((entry) => {
                  const checked = entry.videoIds.includes(video.id);
                  return (
                    <li key={entry.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (checked) removeFromPlaylist(entry.id, video.id);
                            else addToPlaylist(entry.id, video.id);
                          }}
                        />{' '}
                        {entry.name}{' '}
                        <span className="meta">({entry.videoIds.length})</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <form className="inline-form" onSubmit={handleCreatePlaylist}>
              <label className="sr-only" htmlFor="new-playlist">
                New playlist name
              </label>
              <input
                id="new-playlist"
                type="text"
                placeholder="New playlist name"
                value={newPlaylistName}
                onChange={(event) => setNewPlaylistName(event.target.value)}
                maxLength={80}
              />
              <button type="submit" className="button button--small">
                Create and add
              </button>
            </form>
            <p className="meta">
              <Link to="/playlists">Manage all playlists</Link>
            </p>
          </div>
        </details>

        <section className="comments" aria-labelledby="comments-heading">
          <header className="comments__head">
            <h2 id="comments-heading" className="comments__title">
              Comments ({comments.length})
            </h2>
            <label className="comments__sort">
              Sort
              <select
                value={commentSort}
                onChange={(event) => setCommentSort(event.target.value as 'newest' | 'oldest')}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
          </header>

          {profile ? (
            <form className="comment-form" onSubmit={handleComment}>
              <label htmlFor="comment-body">
                Comment as <strong>{profile.handle}</strong>
              </label>
              <textarea
                id="comment-body"
                rows={3}
                value={commentBody}
                onChange={(event) => setCommentBody(event.target.value)}
                placeholder="Keep it about the video."
              />
              <div className="comment-form__actions">
                <button
                  type="submit"
                  className="button button--primary button--small"
                  disabled={!commentBody.trim()}
                >
                  Post comment
                </button>
                <span className="meta">Stored in this browser only.</span>
              </div>
            </form>
          ) : (
            <p className="comments__signin">
              <Link to={`/signin?next=${encodeURIComponent(`/watch/${video.id}`)}`}>
                Sign in
              </Link>{' '}
              to post a comment.
            </p>
          )}

          {sortedComments.length === 0 ? (
            <p className="comments__empty">
              No comments yet. Nothing is being ranked; comments appear in the order
              you choose.
            </p>
          ) : (
            <ol className="comment-list">
              {sortedComments.map((comment) => {
                const spam = Boolean(comment.markedSpam);
                const showBody = !spam || revealed.includes(comment.id);
                const isOwn =
                  comment.local && profile && comment.author === profile.handle;
                return (
                  <li key={comment.id} className={`comment${spam ? ' is-spam' : ''}`}>
                    <div className="comment__head">
                      <span className="comment__author">@{comment.author}</span>
                      <span className="meta"> ({relativeTime(comment.createdAt)})</span>
                    </div>
                    {spam && !showBody ? (
                      <p className="comment__spam">
                        Marked as spam.{' '}
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => toggleReveal(comment.id)}
                        >
                          Show
                        </button>
                      </p>
                    ) : (
                      <p className="comment__body">{comment.body}</p>
                    )}
                    <p className="comment__actions">
                      <span className="meta">{comment.likes} found this helpful</span>
                      {spam && showBody ? (
                        <>
                          {' · '}
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => toggleReveal(comment.id)}
                          >
                            Hide
                          </button>
                        </>
                      ) : null}
                      {isOwn ? (
                        <>
                          {' · '}
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => {
                              deleteComment(comment.id);
                              toast('Comment deleted.', 'info');
                            }}
                          >
                            Delete
                          </button>
                          {' · '}
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => toggleSpam(comment.id)}
                          >
                            {spam ? 'Unmark spam' : 'Mark as spam'}
                          </button>
                        </>
                      ) : null}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>

      <aside className="watch-rail" aria-label="Channel and related videos">
        {channel ? (
          <SidebarBox title="About this channel">
            <div className="channel-box">
              <Avatar name={channel.name} color={channel.themeColor} size="large" />
              <div>
                <h3 className="channel-box__name">
                  <Link to={`/channel/${channel.id}`}>{channel.name}</Link>
                </h3>
                <p className="meta">
                  {formatSubscribers(channel.subscribers)} ·{' '}
                  {channel.channelViews.toLocaleString('en-US')} channel views
                </p>
              </div>
            </div>
            <p className="channel-box__bio">{channel.bio.split('\n')[0]}</p>
            <p className="channel-box__actions">
              <SubscribeButton channelId={channel.id} small />
              <Link className="button button--small" to={`/channel/${channel.id}`}>
                Channel
              </Link>
            </p>
          </SidebarBox>
        ) : null}

        {playlist ? (
          <SidebarBox title={`Playlist: ${playlist.name}`} actionLabel="edit" actionTo={`/playlists?list=${playlist.id}`}>
            <p className="meta">
              {playlistVideos.length} {plural(playlistVideos.length, 'video')} · position{' '}
              {playlistIndex >= 0 ? playlistIndex + 1 : '—'}
            </p>
            <ol className="queue-list">
              {playlistVideos.map((entry, index) => (
                <li
                  key={entry.id}
                  className={entry.id === video.id ? 'is-current' : undefined}
                  aria-current={entry.id === video.id ? 'true' : undefined}
                >
                  <span className="queue-list__index">{index + 1}.</span>
                  <Link to={`/watch/${entry.id}?list=${playlist.id}`}>{entry.title}</Link>
                </li>
              ))}
            </ol>
            {nextInPlaylist ? (
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={autoplayNext}
                  onChange={(event) => setAutoplayNext(event.target.checked)}
                />{' '}
                Play the next video in this playlist automatically
              </label>
            ) : null}
          </SidebarBox>
        ) : null}

        {moreFrom.length > 0 && channel ? (
          <SidebarBox title={`More From: ${channel.name}`} actionLabel="see all" actionTo={`/channel/${channel.id}`}>
            <ul className="compact-list">
              {moreFrom.map((entry) => (
                <li key={entry.id}>
                  <VideoCard video={entry} variant="compact" />
                </li>
              ))}
            </ul>
          </SidebarBox>
        ) : null}

        <SidebarBox title="Related Videos">
          <ul className="related-list">
            {related.map((entry) => {
              const entryChannel = getChannel(entry.channelId);
              return (
                <li key={entry.id} className="related-list__item">
                  <Link to={`/watch/${entry.id}`} aria-label={entry.title}>
                    <Thumbnail
                      video={entry}
                      tint={channelTint(entryChannel)}
                      size="compact"
                    />
                  </Link>
                  <div>
                    <h3 className="related-list__title">
                      <Link to={`/watch/${entry.id}`}>{entry.title}</Link>
                    </h3>
                    <p className="meta">
                      {entryChannel?.name ?? 'Unknown'} · {relativeTime(entry.uploadedAt)}
                    </p>
                    <p className="meta">{formatViews(entry.views)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="meta box__note">
            Chosen by shared channel, category and tags — not by what you watched.
          </p>
        </SidebarBox>
      </aside>
    </div>
  );
}
