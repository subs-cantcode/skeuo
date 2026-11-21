import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { Thumbnail } from '../components/Thumbnail';
import { channelTint } from '../lib/channel';
import { formatDate, formatDuration, plural } from '../lib/format';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/AppStore';

export function PlaylistsPage() {
  usePageTitle('Playlists');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const {
    playlists,
    videos,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    removeFromPlaylist,
    movePlaylistItem,
    videosInPlaylist,
    addToPlaylist,
    getChannel,
    toast,
  } = useStore();

  const selectedId = params.get('list');
  const selected = playlists.find((playlist) => playlist.id === selectedId) ?? null;
  const addTargetId = params.get('add');
  const addTarget = addTargetId
    ? videos.find((video) => video.id === addTargetId)
    : undefined;

  const [newName, setNewName] = useState('');
  const [renameValue, setRenameValue] = useState(selected?.name ?? '');

  useEffect(() => {
    setRenameValue(selected?.name ?? '');
  }, [selected?.id, selected?.name]);

  const items = selected ? videosInPlaylist(selected.id) : [];

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const created = createPlaylist(newName);
    if (!created) {
      toast('Name the playlist first.', 'error');
      return;
    }
    setNewName('');
    toast(`Created “${created.name}”.`, 'success');
    navigate(`/playlists?list=${created.id}`);
  };

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">Home</Link> <span aria-hidden="true">›</span> Playlists
      </div>
      <h1 className="page-title">Playlists</h1>
      <p className="lede">
        Ordered lists you control. Playlists are stored in this browser; nothing is
        shared with anyone else yet.
      </p>

      {addTarget ? (
        <div className="notice">
          <p>
            Adding <strong>{addTarget.title}</strong> to a playlist.
            {playlists.length === 0
              ? ' Create your first playlist on the left, then add the video from its watch page.'
              : ' Choose a playlist:'}
          </p>
          {playlists.length > 0 ? (
            <ul className="inline-choice-list">
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  <button
                    type="button"
                    className="button button--small"
                    onClick={() => {
                      addToPlaylist(playlist.id, addTarget.id);
                      toast(`Added to “${playlist.name}”.`, 'success');
                      navigate(`/playlists?list=${playlist.id}`);
                    }}
                  >
                    {playlist.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="playlist-layout">
        <aside aria-label="Your playlists">
          <section className="box">
            <div className="box__header">
              <h2 className="box__title">New playlist</h2>
            </div>
            <div className="box__body">
              <form className="stack-form" onSubmit={handleCreate}>
                <label className="sr-only" htmlFor="playlist-name">
                  Playlist name
                </label>
                <input
                  id="playlist-name"
                  type="text"
                  value={newName}
                  maxLength={80}
                  placeholder="Playlist name"
                  onChange={(event) => setNewName(event.target.value)}
                />
                <button type="submit" className="button button--primary button--small">
                  Create
                </button>
              </form>
            </div>
          </section>

          <section className="box" aria-label="Existing playlists">
            <div className="box__header">
              <h2 className="box__title">Your playlists ({playlists.length})</h2>
            </div>
            <div className="box__body">
              {playlists.length === 0 ? (
                <p className="box__note">No playlists yet. Create one above.</p>
              ) : (
                <ul className="playlist-index">
                  {playlists.map((playlist) => (
                    <li key={playlist.id}>
                      <Link
                        to={`/playlists?list=${playlist.id}`}
                        className={playlist.id === selectedId ? 'is-current' : undefined}
                        aria-current={playlist.id === selectedId ? 'true' : undefined}
                      >
                        {playlist.name}
                      </Link>{' '}
                      <span className="meta">({playlist.videoIds.length})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </aside>

        <div>
          {!selected ? (
            <EmptyState title="Select a playlist">
              <p>
                Choose a playlist on the left to rename it, reorder its videos or
                remove entries. Playlists created here are private to this browser.
              </p>
            </EmptyState>
          ) : (
            <section className="panel" aria-labelledby="playlist-heading">
              <header className="playlist-head">
                <h2 id="playlist-heading" className="playlist-head__title">
                  {selected.name}
                </h2>
                <p className="meta">
                  {items.length} {plural(items.length, 'video')} · created{' '}
                  {formatDate(selected.createdAt)}
                </p>
              </header>

              <div className="playlist-tools">
                <form
                  className="inline-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    renamePlaylist(selected.id, renameValue);
                    toast('Playlist renamed.', 'success');
                  }}
                >
                  <label className="sr-only" htmlFor="rename-playlist">
                    Rename playlist
                  </label>
                  <input
                    id="rename-playlist"
                    type="text"
                    value={renameValue}
                    maxLength={80}
                    onChange={(event) => setRenameValue(event.target.value)}
                  />
                  <button type="submit" className="button button--small">
                    Rename
                  </button>
                </form>
                {items.length > 0 ? (
                  <Link
                    className="button button--small button--primary"
                    to={`/watch/${items[0].id}?list=${selected.id}`}
                  >
                    Play all
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="button button--small button--danger"
                  onClick={() => {
                    if (!window.confirm(`Delete the playlist “${selected.name}”?`)) return;
                    deletePlaylist(selected.id);
                    toast('Playlist deleted.', 'info');
                    navigate('/playlists');
                  }}
                >
                  Delete playlist
                </button>
              </div>

              {items.length === 0 ? (
                <EmptyState title="This playlist is empty">
                  <p>
                    Open any video and use “Add to playlist”, or tick this playlist
                    from the watch page.
                  </p>
                  <p>
                    <Link to="/videos">Browse videos</Link>
                  </p>
                </EmptyState>
              ) : (
                <ol className="playlist-items">
                  {items.map((video, index) => {
                    const channel = getChannel(video.channelId);
                    return (
                      <li key={video.id} className="playlist-items__row">
                        <span className="playlist-items__index">{index + 1}.</span>
                        <Link to={`/watch/${video.id}?list=${selected.id}`} aria-label={video.title}>
                          <Thumbnail video={video} tint={channelTint(channel)} size="compact" />
                        </Link>
                        <div className="playlist-items__body">
                          <h3 className="video-card__title video-card__title--small">
                            <Link to={`/watch/${video.id}?list=${selected.id}`}>
                              {video.title}
                            </Link>
                          </h3>
                          <p className="meta">
                            {channel?.name ?? 'Unknown'} ·{' '}
                            {formatDuration(video.durationSec)}
                          </p>
                        </div>
                        <div className="playlist-items__actions">
                          <button
                            type="button"
                            className="button button--small"
                            onClick={() => movePlaylistItem(selected.id, video.id, -1)}
                            disabled={index === 0}
                          >
                            Move up<span className="sr-only"> {video.title}</span>
                          </button>
                          <button
                            type="button"
                            className="button button--small"
                            onClick={() => movePlaylistItem(selected.id, video.id, 1)}
                            disabled={index === items.length - 1}
                          >
                            Move down<span className="sr-only"> {video.title}</span>
                          </button>
                          <button
                            type="button"
                            className="button button--small"
                            onClick={() => {
                              removeFromPlaylist(selected.id, video.id);
                              toast('Removed from playlist.', 'info');
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
