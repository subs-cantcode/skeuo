import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { VideoCard } from '../components/VideoCard';
import { formatDuration, plural, relativeTime } from '../lib/format';
import {
  describeLibraryStage,
  libraryEntryToVideo,
  LIBRARY_ACCEPT,
  MAX_LIBRARY_BYTES,
  type LibraryEntry,
} from '../lib/library';
import { formatBytes, MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from '../lib/validate';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/AppStore';

/**
 * The personal library. Files are imported straight from the disk into
 * IndexedDB and are never sent anywhere; every card here is a real local file
 * with a frame captured from it.
 */
export function MyVideosPage() {
  usePageTitle('My Videos');
  const { library, toast } = useStore();

  const [dragging, setDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const startEdit = (entry: LibraryEntry) => {
    setEditingId(entry.id);
    setConfirmingId(null);
    setFormError('');
    setDraftTitle(entry.title);
    setDraftDescription(entry.description);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormError('');
  };

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault();
    const title = draftTitle.trim();
    if (!title) {
      setFormError('A title is required.');
      return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
      setFormError(`Titles are limited to ${MAX_TITLE_LENGTH} characters.`);
      return;
    }
    if (draftDescription.length > MAX_DESCRIPTION_LENGTH) {
      setFormError(`Descriptions are limited to ${MAX_DESCRIPTION_LENGTH} characters.`);
      return;
    }
    try {
      await library.updateMeta(id, { title, description: draftDescription.trim() });
      setEditingId(null);
      setFormError('');
      toast('Details saved in this browser.', 'success');
    } catch {
      setFormError('Those changes could not be saved. Try again.');
    }
  };

  const confirmDelete = async (id: string) => {
    setBusy(true);
    try {
      await library.remove(id);
      setConfirmingId(null);
      toast('Video deleted from this browser.', 'info');
    } catch {
      toast('That video could not be deleted.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const runImport = async (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (files.length === 0) return;
    // Ask in the background: a browser that queues a permission prompt must
    // never delay the import itself.
    void library.requestPersistence();
    const outcome = await library.importFiles(files);
    if (outcome.imported > 0) {
      toast(
        `${outcome.imported} ${plural(outcome.imported, 'video')} added to My Videos.`,
        'success',
      );
    }
    outcome.failed.forEach((failure) => toast(`${failure.name}: ${failure.message}`, 'error'));
  };

  const quotaPercent =
    library.estimate.supported && library.estimate.quota > 0
      ? Math.min(100, Math.round((library.estimate.usage / library.estimate.quota) * 100))
      : 0;

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">Home</Link> <span aria-hidden="true">›</span> My Videos
      </div>

      <div className="library-head">
        <h1 className="page-title">My Videos</h1>
        {library.status === 'ready' ? (
          <p className="meta">
            {library.items.length} {plural(library.items.length, 'video')} in this browser
          </p>
        ) : null}
      </div>

      <div className="notice notice--static">
        <p>
          <strong>Stored in this browser, and only in this browser.</strong> Every video you
          import is written to this browser's own storage on this computer (IndexedDB) and is
          marked <strong>Local — Only you</strong> everywhere it appears. Nothing is uploaded
          to Skeuo — this build has no server — and no file is sent to any other service,
          analytics included. A different browser or browser profile will not show these
          videos, and clearing site data removes them for good.
        </p>
      </div>

      {library.status === 'unavailable' ? (
        <section className="panel" aria-labelledby="library-unavailable">
          <h2 className="box__title" id="library-unavailable">
            Local storage is not available
          </h2>
          <p>{library.error}</p>
          <p className="meta">
            Imported videos need IndexedDB. The demonstration catalog still works without it.
          </p>
        </section>
      ) : (
        <section className="panel" aria-labelledby="import-heading">
          <h2 className="box__title" id="import-heading">
            Import videos
          </h2>

          <div
            className={`dropzone${dragging ? ' is-dragging' : ''}`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              void runImport(event.dataTransfer.files);
            }}
          >
            <p>Drag video files here, or</p>
            <label className="button button--primary" htmlFor="library-files">
              Choose files
            </label>
            <input
              id="library-files"
              className="sr-only"
              type="file"
              accept={LIBRARY_ACCEPT}
              multiple
              onChange={(event) => {
                const files = event.currentTarget.files;
                void runImport(files);
                event.currentTarget.value = '';
              }}
              disabled={library.status === 'loading'}
            />
            <p className="meta">
              MP4, WebM, Ogg or QuickTime · up to {formatBytes(MAX_LIBRARY_BYTES)} each ·
              several files at once
            </p>
          </div>

          {library.progress.length > 0 ? (
            <div className="library-progress-wrap">
              <ul className="library-progress">
                {library.progress.map((entry) => (
                  <li
                    key={entry.id}
                    className={entry.stage === 'error' ? 'is-error' : undefined}
                  >
                    <span className="library-progress__name">{entry.name}</span>
                    <span className="library-progress__stage">
                      {entry.stage === 'done'
                        ? 'Added'
                        : entry.stage === 'error'
                          ? (entry.message ?? 'Failed')
                          : describeLibraryStage(entry.stage)}
                    </span>
                  </li>
                ))}
              </ul>
              <button type="button" className="link-button" onClick={library.dismissProgress}>
                Clear list
              </button>
            </div>
          ) : null}

          {library.estimate.supported ? (
            <div className="library-storage">
              <p className="meta">
                {formatBytes(library.estimate.usage)} used of{' '}
                {formatBytes(library.estimate.quota)} available to this site.{' '}
                {library.estimate.persisted
                  ? 'Storage is persistent, so the browser will not clear it automatically.'
                  : 'Storage is not yet persistent; the browser may clear it if the device runs low on space.'}
              </p>
              <div
                className="progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={quotaPercent}
                aria-label="Browser storage used by this site"
              >
                <span className="progress__bar" style={{ width: `${quotaPercent}%` }} />
              </div>
              {!library.estimate.persisted ? (
                <p className="meta">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => {
                      void library.requestPersistence().then((granted) => {
                        toast(
                          granted
                            ? 'Storage marked persistent for this site.'
                            : 'The browser declined persistent storage. Your videos stay until you clear site data.',
                          granted ? 'success' : 'info',
                        );
                      });
                    }}
                  >
                    Ask the browser to keep this library
                  </button>
                </p>
              ) : null}
            </div>
          ) : null}
        </section>
      )}

      <section aria-labelledby="library-heading">
        <header className="section-head">
          <h2 id="library-heading" className="section-head__title">
            Imported Videos
          </h2>
          <Link className="section-head__action" to="/">
            browse the catalog
          </Link>
        </header>

        {library.items.length === 0 ? (
          <EmptyState title="No imported videos yet">
            <p>
              Choose one or more video files above. A short clip of thirty to forty seconds
              is plenty to try it: it will be playable straight away and still here after you
              reload the page.
            </p>
          </EmptyState>
        ) : (
          <ul className="video-grid library-grid">
            {library.items.map((entry) => {
              const video = libraryEntryToVideo(entry);
              return (
                <li key={entry.id} className="library-card">
                  <VideoCard video={video} />
                  <p className="library-card__facts">
                    {entry.width}×{entry.height} · {formatDuration(entry.durationSec)} ·{' '}
                    {formatBytes(entry.sizeBytes)} · added {relativeTime(entry.importedAt)}
                  </p>

                  {editingId === entry.id ? (
                    <form
                      className="library-form"
                      onSubmit={(event) => void saveEdit(event, entry.id)}
                    >
                      <div className="field">
                        <label htmlFor={`title-${entry.id}`}>Title</label>
                        <input
                          id={`title-${entry.id}`}
                          type="text"
                          value={draftTitle}
                          maxLength={MAX_TITLE_LENGTH}
                          onChange={(event) => setDraftTitle(event.target.value)}
                        />
                      </div>
                      <div className="field">
                        <label htmlFor={`description-${entry.id}`}>Description</label>
                        <textarea
                          id={`description-${entry.id}`}
                          rows={4}
                          value={draftDescription}
                          maxLength={MAX_DESCRIPTION_LENGTH}
                          placeholder="What is this video?"
                          onChange={(event) => setDraftDescription(event.target.value)}
                        />
                        <p className="field__hint">
                          {draftDescription.length}/{MAX_DESCRIPTION_LENGTH} characters. Plain
                          text only.
                        </p>
                      </div>
                      {formError ? (
                        <p className="field__error" role="alert">
                          Error: {formError}
                        </p>
                      ) : null}
                      <div className="library-form__actions">
                        <button type="submit" className="button button--primary button--small">
                          Save details
                        </button>
                        <button
                          type="button"
                          className="button button--small"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="library-card__actions">
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => startEdit(entry)}
                      >
                        Edit details
                      </button>
                      <span aria-hidden="true">·</span>
                      <Link className="link-button" to={`/watch/${entry.id}`}>
                        Watch
                      </Link>
                      <span aria-hidden="true">·</span>
                      {confirmingId === entry.id ? (
                        <>
                          <span className="library-confirm">Delete this video?</span>
                          <button
                            type="button"
                            className="button button--small"
                            disabled={busy}
                            onClick={() => void confirmDelete(entry.id)}
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            className="button button--small"
                            onClick={() => setConfirmingId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="link-button"
                          onClick={() => {
                            setConfirmingId(entry.id);
                            setEditingId(null);
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
