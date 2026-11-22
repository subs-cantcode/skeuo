import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignInPrompt } from '../components/SignInPrompt';
import { suggestedTagsFor } from '../lib/categories';
import { thumbnailDataUri } from '../lib/thumbnails';
import { usePageTitle } from '../lib/usePageTitle';
import {
  formatBytes,
  MAX_DESCRIPTION_LENGTH,
  MAX_TAGS,
  MAX_TITLE_LENGTH,
  MAX_UPLOAD_BYTES,
  parseTags,
  validateMetadata,
  validateVideoFile,
  type MetadataErrors,
} from '../lib/validate';
import { useStore } from '../store/AppStore';
import { CATEGORIES, type Category, type Video } from '../types';

type Phase = 'idle' | 'uploading' | 'processing';

/**
 * Frontend-only upload. The file never leaves the browser: it is previewed
 * through an object URL, the progress bar is simulated, and the finished item
 * is stored as a clearly-labelled local draft. Server-side validation,
 * transcoding and thumbnail extraction arrive in Milestone 3.
 */
export function UploadPage() {
  usePageTitle('Upload');
  const { profile, addDraft, toast } = useStore();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [thumbVariant, setThumbVariant] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errors, setErrors] = useState<MetadataErrors>({});
  const [phase, setPhase] = useState<Phase>('idle');
  const [progress, setProgress] = useState(0);
  const timer = useRef<number | null>(null);
  const completionTimer = useRef<number | null>(null);
  const progressValue = useRef(0);
  const running = useRef(false);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearInterval(timer.current);
      if (completionTimer.current !== null) window.clearTimeout(completionTimer.current);
    },
    [],
  );

  if (!profile) {
    return (
      <>
        <h1 className="page-title">Upload a video</h1>
        <SignInPrompt next="/upload">
          <p>
            Uploading required an account in 2009, and it still does here. Sign in
            with a local profile to continue.
          </p>
        </SignInPrompt>
      </>
    );
  }

  const seed = 1000 + (file ? Math.floor(file.size % 900) : 0);
  // Suggestions only: tags stay optional and are never added automatically.
  const suggestedTags = suggestedTagsFor(category);

  const acceptFile = (candidate: File | null) => {
    if (running.current) return;
    if (!candidate) return;
    const problems = validateVideoFile(candidate);
    setFileErrors(problems);
    if (problems.length > 0) {
      setFile(null);
      setPreviewUrl('');
      return;
    }
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
    setPhase('idle');
    setProgress(0);
    if (!title) {
      setTitle(candidate.name.replace(/\.[^.]+$/, '').slice(0, MAX_TITLE_LENGTH));
    }
  };

  const startUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (running.current) return;
    const metadataErrors = validateMetadata({ title, description, category, tags });
    setErrors(metadataErrors);
    const missingFile = !file;
    if (missingFile) setFileErrors(['Choose a video file before uploading.']);
    if (!file || Object.keys(metadataErrors).length > 0) return;

    running.current = true;
    progressValue.current = 0;
    if (timer.current !== null) window.clearInterval(timer.current);
    setPhase('uploading');
    setProgress(0);

    timer.current = window.setInterval(() => {
        // Timer side effects must stay outside state updaters: React may replay
        // an updater, which used to schedule two drafts from a single upload.
        const next = progressValue.current + 6 + Math.random() * 7;
        progressValue.current = Math.min(100, next);
        setProgress(progressValue.current);
        if (next < 100) return;
        if (timer.current !== null) {
          window.clearInterval(timer.current);
          timer.current = null;
        }
        setPhase('processing');
        completionTimer.current = window.setTimeout(() => {
          completionTimer.current = null;
          const draft: Video = {
            id: `local-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`,
            title: title.trim(),
            description: description.trim() || 'No description was provided.',
            channelId: 'me',
            category: category as Category,
            tags: parseTags(tags),
            durationSec: Math.round(duration),
            views: 0,
            uploadedAt: new Date().toISOString(),
            src: previewUrl,
            thumbSeed: seed + thumbVariant * 101,
            localDraft: true,
          };
          addDraft(draft);
          toast(
            'Local draft created. It exists in this browser only and is not published.',
            'success',
          );
          navigate(`/watch/${draft.id}`);
        }, 900);
    }, 150);
  };

  const busy = phase !== 'idle';

  return (
    <>
      <div className="breadcrumb">
        <Link to="/">Home</Link> <span aria-hidden="true">›</span> Upload
      </div>
      <h1 className="page-title">Upload a video</h1>

      <div className="notice notice--static">
        <p>
          <strong>No server yet.</strong> The file stays in this tab, is never
          uploaded anywhere, and its progress bar is simulated. On this page the
          checks mirror the server rules that Milestone 3 will enforce: MP4, WebM,
          Ogg or QuickTime, up to {formatBytes(MAX_UPLOAD_BYTES)}.
        </p>
      </div>

      <form className="upload-layout" onSubmit={startUpload} noValidate>
        <div className="upload-main">
          <section className="panel" aria-labelledby="file-heading">
            <h2 id="file-heading" className="box__title">
              1. Choose a file
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
                acceptFile(event.dataTransfer.files?.[0] ?? null);
              }}
            >
              <p>Drag a video here, or</p>
              <label className="button button--primary" htmlFor="video-file">
                Choose a file
              </label>
              <input
                id="video-file"
                className="sr-only"
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                onChange={(event) => acceptFile(event.target.files?.[0] ?? null)}
                disabled={busy}
              />
              <p className="meta">Accepted: MP4, WebM, Ogg, QuickTime · max {formatBytes(MAX_UPLOAD_BYTES)}</p>
            </div>

            {fileErrors.length > 0 ? (
              <div className="field__error" role="alert">
                {fileErrors.map((message) => (
                  <p key={message}>Error: {message}</p>
                ))}
              </div>
            ) : null}

            {file ? (
              <div className="upload-preview">
                <p className="meta">
                  {file.name} · {formatBytes(file.size)}
                </p>
                <video
                  className="upload-preview__player"
                  src={previewUrl}
                  controls
                  preload="metadata"
                  onLoadedMetadata={(event) => {
                    const value = event.currentTarget.duration;
                    if (Number.isFinite(value)) setDuration(value);
                  }}
                />
              </div>
            ) : null}

            {phase !== 'idle' ? (
              <div className="upload-status">
                <p role="status">
                  {phase === 'uploading'
                    ? `Uploading… ${Math.round(progress)}%`
                    : 'Processing — checking container and preparing the poster (simulated).'}
                </p>
                <div
                  className="progress"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                  aria-label="Upload progress"
                >
                  <span
                    className="progress__bar"
                    style={{ width: `${phase === 'processing' ? 100 : progress}%` }}
                  />
                </div>
              </div>
            ) : null}
          </section>

          <section className="panel" aria-labelledby="details-heading">
            <h2 id="details-heading" className="box__title">
              2. Describe the video
            </h2>

            <div className="field">
              <label htmlFor="upload-title">Title</label>
              <input
                id="upload-title"
                type="text"
                value={title}
                maxLength={MAX_TITLE_LENGTH}
                onChange={(event) => setTitle(event.target.value)}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'upload-title-error' : undefined}
                disabled={busy}
              />
              {errors.title ? (
                <p className="field__error" id="upload-title-error" role="alert">
                  Error: {errors.title}
                </p>
              ) : null}
            </div>

            <div className="field">
              <label htmlFor="upload-description">Description</label>
              <textarea
                id="upload-description"
                rows={6}
                value={description}
                maxLength={MAX_DESCRIPTION_LENGTH}
                onChange={(event) => setDescription(event.target.value)}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? 'upload-description-error' : 'upload-description-hint'
                }
                disabled={busy}
              />
              <p className="field__hint" id="upload-description-hint">
                {description.length}/{MAX_DESCRIPTION_LENGTH} characters. Plain text
                only; no HTML.
              </p>
              {errors.description ? (
                <p className="field__error" id="upload-description-error" role="alert">
                  Error: {errors.description}
                </p>
              ) : null}
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="upload-category">Category</label>
                <select
                  id="upload-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby={errors.category ? 'upload-category-error' : undefined}
                  disabled={busy}
                >
                  <option value="">Choose a category</option>
                  {CATEGORIES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
                {errors.category ? (
                  <p className="field__error" id="upload-category-error" role="alert">
                    Error: {errors.category}
                  </p>
                ) : null}
              </div>

              <div className="field">
                <label htmlFor="upload-tags">Tags</label>
                <input
                  id="upload-tags"
                  type="text"
                  value={tags}
                  placeholder="repair, lighting, workshop"
                  onChange={(event) => setTags(event.target.value)}
                  aria-invalid={Boolean(errors.tags)}
                  aria-describedby={errors.tags ? 'upload-tags-error' : 'upload-tags-hint'}
                  disabled={busy}
                />
                <p className="field__hint" id="upload-tags-hint">
                  Comma separated, up to {MAX_TAGS}. Tags help search, nothing else.
                  {suggestedTags.length > 0 ? (
                    <> Suggested for {category}: {suggestedTags.join(', ')}. All optional.</>
                  ) : null}
                </p>
                {errors.tags ? (
                  <p className="field__error" id="upload-tags-error" role="alert">
                    Error: {errors.tags}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="panel" aria-labelledby="thumb-heading">
            <h2 id="thumb-heading" className="box__title">
              3. Choose a poster
            </h2>
            <p className="meta">
              Thumbnails are generated locally from the video's seed; the real build
              will extract frames with FFmpeg and let you upload one.
            </p>
            <fieldset className="thumb-choices">
              <legend className="sr-only">Poster style</legend>
              {[0, 1, 2].map((variant) => (
                <label key={variant} className="thumb-choices__option">
                  <input
                    type="radio"
                    name="poster"
                    value={variant}
                    checked={thumbVariant === variant}
                    onChange={() => setThumbVariant(variant)}
                    disabled={busy}
                  />
                  <img
                    src={thumbnailDataUri(seed, '#3d4f6c', variant)}
                    alt={`Poster style ${variant + 1}`}
                    width={160}
                    height={90}
                  />
                </label>
              ))}
            </fieldset>
          </section>
        </div>

        <aside className="upload-side">
          <section className="box">
            <div className="box__header">
              <h2 className="box__title">Publish</h2>
            </div>
            <div className="box__body">
              <p className="meta">
                Uploading as <strong>@{profile.handle}</strong>. Your draft will appear
                on your channel page and in this browser's library.
              </p>
              <button
                type="submit"
                className="button button--primary"
                disabled={busy}
                aria-describedby="upload-caveat"
              >
                {busy ? 'Working…' : 'Upload video'}
              </button>
              <p className="meta" id="upload-caveat">
                Processing is simulated. Nothing is published to the internet, and no
                file leaves your device.
              </p>
            </div>
          </section>

          <section className="box">
            <div className="box__header">
              <h2 className="box__title">Upload checklist</h2>
            </div>
            <div className="box__body">
              <ul className="checklist checklist--plain">
                <li>One file, under {formatBytes(MAX_UPLOAD_BYTES)}</li>
                <li>A title of 100 characters or fewer</li>
                <li>A category</li>
                <li>At most {MAX_TAGS} tags</li>
                <li>No HTML in the description</li>
              </ul>
            </div>
          </section>
        </aside>
      </form>
    </>
  );
}
