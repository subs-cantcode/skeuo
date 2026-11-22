/**
 * Local video library storage.
 *
 * Imported files never leave the browser. They are kept in IndexedDB, which
 * stores `File`/`Blob` values natively on disk instead of in memory, and which
 * gives us one transaction across metadata, video bytes and poster frame.
 *
 * IndexedDB was chosen over the Origin Private File System: OPFS is newer
 * (Firefox only shipped it in 111) and has no index or metadata layer, so it
 * would still need a second store for titles, plus orphan cleanup after a crash
 * between two writes. IndexedDB covers both in one transaction and is available
 * everywhere this app runs. Both share the same storage bucket, so the quota
 * handling below applies either way.
 *
 * Nothing here is written to localStorage: the blobs would exceed its ~5 MB
 * budget and base64-encoding them would double their size.
 */
import type { Video } from '../types';
import { formatBytes, MAX_UPLOAD_BYTES } from './validate';

export const LIBRARY_DB_NAME = 'skeuo.video.library';
export const LIBRARY_DB_VERSION = 1;
const META_STORE = 'videos';
const MEDIA_STORE = 'media';

/**
 * Channel that imported videos belong to. Deliberately not the profile's `me`
 * channel: that one only exists while signed in, and the library must work
 * without any account.
 */
export const LIBRARY_CHANNEL_ID = 'library';

/** Same ceiling as the upload page, so the two features agree on "reasonable". */
export const MAX_LIBRARY_BYTES = MAX_UPLOAD_BYTES;
export const LIBRARY_ACCEPT =
  'video/mp4,video/webm,video/ogg,video/quicktime,video/x-m4v,.mp4,.m4v,.webm,.ogv,.ogg,.mov';

export const POSTER_WIDTH = 640;
export const POSTER_HEIGHT = 360;
const POSTER_QUALITY = 0.82;
const PROBE_TIMEOUT_MS = 15000;
/** Keep this much space free so the browser still has room for its own data. */
export const STORAGE_HEADROOM_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'video/x-m4v',
  'video/x-matroska',
]);
const ALLOWED_EXTENSIONS = ['.mp4', '.m4v', '.webm', '.ogv', '.ogg', '.mov', '.mkv'];

/** Stored metadata. Small enough to read for a whole library at once. */
export interface LibraryMeta {
  id: string;
  title: string;
  description: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSec: number;
  width: number;
  height: number;
  importedAt: string;
  thumbSeed: number;
  /** Why no preview frame was captured, when capture failed. */
  posterNote?: string;
}

/** A metadata row plus the bytes it points at. */
export interface LibraryRecord extends LibraryMeta {
  file: Blob;
  poster: Blob | null;
}

/** What the UI works with: metadata plus live object URLs. */
export interface LibraryEntry extends LibraryMeta {
  src: string;
  thumbnail?: string;
}

export type LibraryStage = 'checking' | 'reading' | 'poster' | 'saving';
export type LibraryStageHandler = (stage: LibraryStage) => void;

const STAGE_LABELS: Record<LibraryStage, string> = {
  checking: 'Checking file…',
  reading: 'Reading duration and dimensions…',
  poster: 'Capturing a thumbnail…',
  saving: 'Saving in this browser…',
};

export function describeLibraryStage(stage: LibraryStage): string {
  return STAGE_LABELS[stage];
}

/** An error whose message is safe to show to the user as-is. */
export class LibraryError extends Error {
  readonly hint: string;

  constructor(message: string, hint = '') {
    super(message);
    this.name = 'LibraryError';
    this.hint = hint;
  }
}

export interface LibraryFileLike {
  name: string;
  type: string;
  size: number;
}

function extensionOf(name: string): string {
  const match = /\.[^.\\/]+$/.exec(name);
  return match ? match[0].toLowerCase() : '';
}

/**
 * Cheap pre-checks before a byte is read. The browser still has the final say:
 * a file can have a video MIME type and an undecodable codec, which is why
 * `probeMediaFile` follows this.
 */
export function libraryFileProblems(file: LibraryFileLike): string[] {
  const problems: string[] = [];
  const type = (file.type || '').toLowerCase();
  const extension = extensionOf(file.name);
  const typeAccepted = type ? ALLOWED_MIME.has(type) : ALLOWED_EXTENSIONS.includes(extension);

  if (!typeAccepted && !ALLOWED_EXTENSIONS.includes(extension)) {
    problems.push(
      `“${file.name}” is not a video file this library accepts. Use MP4, WebM, Ogg or QuickTime.`,
    );
  }
  if (file.size === 0) {
    problems.push(`“${file.name}” is empty.`);
  } else if (file.size > MAX_LIBRARY_BYTES) {
    problems.push(
      `“${file.name}” is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_LIBRARY_BYTES)} per file.`,
    );
  }
  return problems;
}

/** A filename is the only title we have until the user edits it. */
export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^.\\/]+$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return (base || 'Untitled video').slice(0, 100);
}

/** One second in, or a quarter of the way through very short clips. */
export function pickPosterTime(durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
  const target = Math.min(1, durationSec * 0.25);
  return Math.max(0, Math.min(target, durationSec - 0.1));
}

/** Source rectangle that fills a 16:9 poster without stretching the frame. */
export function coverRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): { sx: number; sy: number; sw: number; sh: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    return { sx: 0, sy: 0, sw: 0, sh: 0 };
  }
  const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
  const sw = targetWidth / scale;
  const sh = targetHeight / scale;
  return { sx: (sourceWidth - sw) / 2, sy: (sourceHeight - sh) / 2, sw, sh };
}

export function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const name = (error as { name?: string }).name ?? '';
  const message = String((error as { message?: string }).message ?? '');
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    /quota/i.test(message)
  );
}

export function storageFailureMessage(error: unknown): string {
  if (isQuotaError(error)) {
    return 'This browser is out of storage for the site. Delete a video from My Videos and try again.';
  }
  if (error instanceof LibraryError) {
    return error.hint ? `${error.message} ${error.hint}` : error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'That video could not be saved in this browser.';
}

export interface StorageSummary {
  supported: boolean;
  usage: number;
  quota: number;
  persisted: boolean;
}

export const UNKNOWN_STORAGE: StorageSummary = {
  supported: false,
  usage: 0,
  quota: 0,
  persisted: false,
};

export function librarySupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

/**
 * Firefox can leave `storage.persist()` pending while it waits on a permission
 * prompt, which would hang anything awaiting it. Nothing here is important
 * enough to block on, so every storage query settles within a few seconds.
 */
const STORAGE_QUERY_TIMEOUT_MS = 4000;

function settle<T>(work: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    work.catch(() => fallback),
    new Promise<T>((resolve) => {
      window.setTimeout(() => resolve(fallback), STORAGE_QUERY_TIMEOUT_MS);
    }),
  ]);
}

export async function readStorageSummary(): Promise<StorageSummary> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return UNKNOWN_STORAGE;
    const estimate = await settle<StorageEstimate | null>(navigator.storage.estimate(), null);
    if (!estimate) return UNKNOWN_STORAGE;
    const persisted = navigator.storage.persisted
      ? await settle(navigator.storage.persisted(), false)
      : false;
    return {
      supported: true,
      usage: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
      persisted,
    };
  } catch {
    return UNKNOWN_STORAGE;
  }
}

/** Ask the browser not to evict the library when the device runs low. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false;
    if (navigator.storage.persisted && (await settle(navigator.storage.persisted(), false))) {
      return true;
    }
    return await settle(navigator.storage.persist(), false);
  } catch {
    return false;
  }
}

/** `true` when the estimate says there is room, or when there is no estimate. */
export function hasRoomFor(sizeBytes: number, summary: StorageSummary | null): boolean {
  if (!summary || !summary.supported || summary.quota <= 0) return true;
  return summary.quota - summary.usage > sizeBytes + STORAGE_HEADROOM_BYTES;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!librarySupported()) {
      reject(
        new LibraryError(
          'This browser does not offer IndexedDB, so a local library cannot be opened.',
          'Private windows in some browsers disable site storage.',
        ),
      );
      return;
    }
    const request = indexedDB.open(LIBRARY_DB_NAME, LIBRARY_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new LibraryError(
          'The local library database could not be opened.',
          'Site data may be blocked for this page.',
        ),
      );
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted'));
  });
}

/** Every stored video, newest import first. Skips half-written rows. */
export async function readLibrary(): Promise<LibraryRecord[]> {
  const db = await openDb();
  try {
    const transaction = db.transaction([META_STORE, MEDIA_STORE], 'readonly');
    const metaRequest = transaction.objectStore(META_STORE).getAll() as IDBRequest<LibraryMeta[]>;
    const mediaRequest = transaction
      .objectStore(MEDIA_STORE)
      .getAll() as IDBRequest<Array<{ id: string; file: Blob; poster: Blob | null }>>;
    const [metas, media] = await Promise.all([
      requestToPromise(metaRequest),
      requestToPromise(mediaRequest),
    ]);
    const mediaById = new Map(media.map((entry) => [entry.id, entry]));
    const records: LibraryRecord[] = [];
    for (const meta of metas) {
      const stored = mediaById.get(meta.id);
      if (!stored?.file) continue;
      records.push({ ...meta, file: stored.file, poster: stored.poster ?? null });
    }
    return records.sort((a, b) => Date.parse(b.importedAt) - Date.parse(a.importedAt));
  } catch (error) {
    if (isQuotaError(error)) throw error;
    throw new LibraryError(
      'The videos stored in this browser could not be read.',
      'Reloading the page usually fixes this.',
    );
  } finally {
    db.close();
  }
}

export async function putLibraryRecord(record: LibraryRecord): Promise<void> {
  const db = await openDb();
  try {
    const transaction = db.transaction([META_STORE, MEDIA_STORE], 'readwrite');
    const { file, poster, ...meta } = record;
    transaction.objectStore(META_STORE).put(meta);
    transaction.objectStore(MEDIA_STORE).put({ id: record.id, file, poster });
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

/** Title and description only, so editing never rewrites the video bytes. */
export async function updateLibraryMeta(
  id: string,
  patch: Pick<LibraryMeta, 'title' | 'description'>,
): Promise<void> {
  const db = await openDb();
  try {
    const transaction = db.transaction(META_STORE, 'readwrite');
    const store = transaction.objectStore(META_STORE);
    // Read and write inside the same transaction, so an edit can never replace
    // the whole row with just these two fields.
    const read = store.get(id) as IDBRequest<LibraryMeta | undefined>;
    read.onsuccess = () => {
      if (read.result) store.put({ ...read.result, ...patch });
    };
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

export async function deleteLibraryRecord(id: string): Promise<void> {
  const db = await openDb();
  try {
    const transaction = db.transaction([META_STORE, MEDIA_STORE], 'readwrite');
    transaction.objectStore(META_STORE).delete(id);
    transaction.objectStore(MEDIA_STORE).delete(id);
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}

export interface MediaInfo {
  durationSec: number;
  width: number;
  height: number;
}

function mediaEvent(
  target: HTMLVideoElement,
  event: string,
  timeoutMs: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let timer = 0;
    const cleanup = () => {
      window.clearTimeout(timer);
      target.removeEventListener(event, onEvent);
      target.removeEventListener('error', onError);
    };
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(
        new LibraryError(
          'This browser could not decode that video file.',
          'MP4 (H.264/AAC) and WebM play almost everywhere; QuickTime and Ogg do not.',
        ),
      );
    };
    timer = window.setTimeout(() => {
      cleanup();
      reject(
        new LibraryError(
          'Reading that video took too long.',
          'The file may be damaged or use a codec this browser cannot play.',
        ),
      );
    }, timeoutMs);
    target.addEventListener(event, onEvent, { once: true });
    target.addEventListener('error', onError, { once: true });
  });
}

function releaseMedia(video: HTMLVideoElement, url: string) {
  video.removeAttribute('src');
  video.load();
  URL.revokeObjectURL(url);
}

/** Read duration and pixel dimensions, rejecting files the browser cannot play. */
export async function probeMediaFile(file: Blob): Promise<MediaInfo> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;
  try {
    const ready = mediaEvent(video, 'loadedmetadata', PROBE_TIMEOUT_MS);
    video.src = url;
    await ready;
    const width = video.videoWidth;
    const height = video.videoHeight;
    const durationSec = Number.isFinite(video.duration) ? video.duration : 0;
    if (width <= 0 || height <= 0) {
      throw new LibraryError(
        'That file has no video track this browser can read.',
        'Audio-only files cannot be added to the video library.',
      );
    }
    if (durationSec <= 0) {
      throw new LibraryError(
        'The length of that video could not be read.',
        'The file may still be copying; try again in a moment.',
      );
    }
    return { durationSec, width, height };
  } finally {
    releaseMedia(video, url);
  }
}

export type PosterFailure = 'decode' | 'canvas' | 'empty';

export interface PosterResult {
  poster: Blob | null;
  failure: PosterFailure | null;
}

/** Shown on the card and the watch page when a frame could not be captured. */
export const POSTER_FAILURE_NOTE: Record<PosterFailure, string> = {
  decode:
    'This browser could not decode a frame from the file, so the generic artwork is shown instead. Playback is unaffected.',
  canvas:
    'The browser would not let the frame be copied to a canvas, so the generic artwork is shown instead. Playback is unaffected.',
  empty:
    'The captured frame was empty, so the generic artwork is shown instead. Playback is unaffected.',
};

/**
 * Give the decoder a frame to draw. iOS Safari will not hand pixels to
 * `drawImage` for a video that has never played, even after `loadeddata`.
 * Muted inline playback is allowed without a user gesture, so this is safe.
 */
async function primeFrame(video: HTMLVideoElement): Promise<void> {
  const play = video.play();
  if (!play || typeof play.then !== 'function') return;
  try {
    await Promise.race([
      play,
      new Promise<void>((resolve) => window.setTimeout(resolve, 2000)),
    ]);
  } catch {
    // Autoplay refused: seeking below still produces a frame in most browsers.
    return;
  }
  await new Promise<void>((resolve) => {
    const withCallback = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (callback: () => void) => number;
    };
    if (typeof withCallback.requestVideoFrameCallback === 'function') {
      withCallback.requestVideoFrameCallback(() => resolve());
      window.setTimeout(resolve, 500);
      return;
    }
    window.setTimeout(resolve, 120);
  });
  video.pause();
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), type, POSTER_QUALITY);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Grab one frame as a 640×360 poster.
 *
 * The video is mounted in the document while it works: Safari (desktop and
 * iOS) will not always decode a frame for a detached element, which is the
 * most likely reason an iPhone import ends up with the generated artwork.
 * Every failure is reported so the interface can explain the fallback instead
 * of silently showing different art.
 */
export async function capturePoster(file: Blob, durationSec: number): Promise<PosterResult> {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  const holder = document.createElement('div');
  holder.setAttribute('aria-hidden', 'true');
  holder.style.cssText =
    'position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;';
  holder.appendChild(video);
  document.body.appendChild(holder);

  try {
    const ready = mediaEvent(video, 'loadeddata', PROBE_TIMEOUT_MS);
    video.src = url;
    video.load();
    try {
      await ready;
    } catch {
      return { poster: null, failure: 'decode' };
    }

    await primeFrame(video);

    const target = pickPosterTime(durationSec);
    if (target > 0) {
      try {
        const seeked = mediaEvent(video, 'seeked', PROBE_TIMEOUT_MS);
        video.currentTime = target;
        await seeked;
      } catch {
        // Keep the frame already decoded rather than losing the poster.
      }
    }

    if (!video.videoWidth || !video.videoHeight) {
      return { poster: null, failure: 'decode' };
    }

    const canvas = document.createElement('canvas');
    canvas.width = POSTER_WIDTH;
    canvas.height = POSTER_HEIGHT;
    const context = canvas.getContext('2d');
    if (!context) return { poster: null, failure: 'canvas' };

    const rect = coverRect(video.videoWidth, video.videoHeight, POSTER_WIDTH, POSTER_HEIGHT);
    if (rect.sw <= 0 || rect.sh <= 0) return { poster: null, failure: 'empty' };

    try {
      context.drawImage(
        video,
        rect.sx,
        rect.sy,
        rect.sw,
        rect.sh,
        0,
        0,
        POSTER_WIDTH,
        POSTER_HEIGHT,
      );
    } catch {
      return { poster: null, failure: 'canvas' };
    }

    const poster =
      (await canvasToBlob(canvas, 'image/webp')) ?? (await canvasToBlob(canvas, 'image/jpeg'));
    return poster ? { poster, failure: null } : { poster: null, failure: 'canvas' };
  } catch {
    return { poster: null, failure: 'decode' };
  } finally {
    holder.remove();
    releaseMedia(video, url);
  }
}

function newId(): string {
  const cryptoApi = typeof crypto !== 'undefined' ? crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `local-${cryptoApi.randomUUID()}`;
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Validate, probe, capture a poster and store one file. The caller handles quota
 * preflight and turns thrown errors into user-facing text.
 */
export async function importLibraryFile(
  file: File,
  onStage: LibraryStageHandler = () => {},
): Promise<LibraryRecord> {
  onStage('checking');
  const problems = libraryFileProblems(file);
  if (problems.length > 0) throw new LibraryError(problems[0]);

  onStage('reading');
  const info = await probeMediaFile(file);

  onStage('poster');
  const { poster, failure } = await capturePoster(file, info.durationSec);

  onStage('saving');
  const record: LibraryRecord = {
    id: newId(),
    title: titleFromFileName(file.name),
    description: '',
    fileName: file.name,
    mimeType: file.type || 'video/mp4',
    sizeBytes: file.size,
    durationSec: info.durationSec,
    width: info.width,
    height: info.height,
    importedAt: new Date().toISOString(),
    thumbSeed: 2000 + (file.size % 900),
    posterNote: failure ? POSTER_FAILURE_NOTE[failure] : undefined,
    file,
    poster,
  };
  await putLibraryRecord(record);
  return record;
}

/** Map a stored entry onto the app's existing `Video` shape. */
export function libraryEntryToVideo(entry: LibraryEntry): Video {
  return {
    id: entry.id,
    title: entry.title,
    description: entry.description || 'No description yet.',
    channelId: LIBRARY_CHANNEL_ID,
    category: 'People & Blogs',
    tags: [],
    durationSec: Math.max(0, Math.round(entry.durationSec)),
    views: 0,
    uploadedAt: entry.importedAt,
    src: entry.src,
    thumbSeed: entry.thumbSeed,
    thumbnail: entry.thumbnail,
    local: true,
    width: entry.width,
    height: entry.height,
    sizeBytes: entry.sizeBytes,
    fileName: entry.fileName,
    thumbnailNote: entry.posterNote,
  };
}
