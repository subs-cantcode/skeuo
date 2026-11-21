import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteLibraryRecord,
  hasRoomFor,
  importLibraryFile,
  LibraryError,
  librarySupported,
  readLibrary,
  readStorageSummary,
  requestPersistentStorage,
  storageFailureMessage,
  UNKNOWN_STORAGE,
  updateLibraryMeta,
  type LibraryEntry,
  type LibraryRecord,
  type LibraryStage,
  type StorageSummary,
} from '../lib/library';
import { formatBytes } from '../lib/validate';

export type LibraryStatus = 'loading' | 'ready' | 'unavailable';

export interface ImportProgress {
  id: string;
  name: string;
  size: number;
  stage: LibraryStage | 'done' | 'error';
  message?: string;
}

export interface ImportOutcome {
  imported: number;
  failed: Array<{ name: string; message: string }>;
}

export interface LibraryApi {
  status: LibraryStatus;
  error: string;
  items: LibraryEntry[];
  estimate: StorageSummary;
  progress: ImportProgress[];
  importFiles: (files: File[]) => Promise<ImportOutcome>;
  updateMeta: (id: string, patch: { title: string; description: string }) => Promise<void>;
  remove: (id: string) => Promise<void>;
  requestPersistence: () => Promise<boolean>;
  refreshEstimate: () => Promise<void>;
  dismissProgress: () => void;
}

function unavailableReason(): string {
  if (!librarySupported()) {
    return 'This browser does not expose IndexedDB, so imported videos cannot be stored. Private or restricted browsing modes often disable site storage.';
  }
  return 'The local library could not be opened. Site data may be blocked for this page.';
}

/**
 * Owns the imported-video library. Blobs live in IndexedDB; this hook keeps only
 * metadata in React state plus one object URL per file and poster, which are
 * revoked when an item is deleted or the provider unmounts.
 */
export function useLibrary(): LibraryApi {
  const [items, setItems] = useState<LibraryEntry[]>([]);
  const [status, setStatus] = useState<LibraryStatus>('loading');
  const [error, setError] = useState('');
  const [estimate, setEstimate] = useState<StorageSummary>(UNKNOWN_STORAGE);
  const [progress, setProgress] = useState<ImportProgress[]>([]);
  const urlsById = useRef(new Map<string, string[]>());

  const release = useCallback((id: string) => {
    const urls = urlsById.current.get(id);
    if (!urls) return;
    urls.forEach((url) => URL.revokeObjectURL(url));
    urlsById.current.delete(id);
  }, []);

  const toEntry = useCallback((record: LibraryRecord): LibraryEntry => {
    const src = URL.createObjectURL(record.file);
    const thumbnail = record.poster ? URL.createObjectURL(record.poster) : undefined;
    urlsById.current.set(record.id, thumbnail ? [src, thumbnail] : [src]);
    const { file: _file, poster: _poster, ...meta } = record;
    return { ...meta, src, thumbnail };
  }, []);

  const refreshEstimate = useCallback(async () => {
    const summary = await readStorageSummary();
    setEstimate(summary);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!librarySupported()) {
        setStatus('unavailable');
        setError(unavailableReason());
        return;
      }
      try {
        const records = await readLibrary();
        if (cancelled) return;
        setItems(records.map(toEntry));
        setStatus('ready');
        void refreshEstimate();
      } catch (cause) {
        if (cancelled) return;
        setStatus('unavailable');
        setError(
          cause instanceof LibraryError ? storageFailureMessage(cause) : unavailableReason(),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshEstimate, toEntry]);

  useEffect(
    () => () => {
      urlsById.current.forEach((urls) => urls.forEach((url) => URL.revokeObjectURL(url)));
      urlsById.current.clear();
    },
    [],
  );

  const requestPersistence = useCallback(async () => {
    const granted = await requestPersistentStorage();
    await refreshEstimate();
    return granted;
  }, [refreshEstimate]);

  const importFiles = useCallback(
    async (files: File[]): Promise<ImportOutcome> => {
      const failed: ImportOutcome['failed'] = [];
      if (files.length === 0) return { imported: 0, failed };

      if (!librarySupported()) {
        return {
          imported: 0,
          failed: files.map((file) => ({ name: file.name, message: unavailableReason() })),
        };
      }

      const summary = await readStorageSummary();
      setEstimate(summary);
      setProgress([]);

      let imported = 0;
      for (const file of files) {
        const progressId = `import-${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const update = (stage: LibraryStage) =>
          setProgress((current) =>
            current.map((entry) => (entry.id === progressId ? { ...entry, stage } : entry)),
          );

        setProgress((current) => [
          ...current,
          { id: progressId, name: file.name, size: file.size, stage: 'checking' },
        ]);

        try {
          if (!hasRoomFor(file.size, summary)) {
            throw new LibraryError(
              `“${file.name}” is ${formatBytes(file.size)}, but this browser only has about ${formatBytes(
                Math.max(0, summary.quota - summary.usage),
              )} free for this site.`,
              'Delete a video from My Videos, or import a smaller file.',
            );
          }
          const record = await importLibraryFile(file, update);
          const entry = toEntry(record);
          setItems((current) => [entry, ...current]);
          imported += 1;
          setProgress((current) =>
            current.map((item) => (item.id === progressId ? { ...item, stage: 'done' } : item)),
          );
        } catch (cause) {
          const message = storageFailureMessage(cause);
          failed.push({ name: file.name, message });
          setProgress((current) =>
            current.map((item) =>
              item.id === progressId ? { ...item, stage: 'error', message } : item,
            ),
          );
        }
      }

      await refreshEstimate();
      return { imported, failed };
    },
    [refreshEstimate, toEntry],
  );

  const updateMeta = useCallback(async (id: string, patch: { title: string; description: string }) => {
    await updateLibraryMeta(id, patch);
    setItems((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  }, []);

  const remove = useCallback(
    async (id: string) => {
      await deleteLibraryRecord(id);
      release(id);
      setItems((current) => current.filter((entry) => entry.id !== id));
      await refreshEstimate();
    },
    [refreshEstimate, release],
  );

  const dismissProgress = useCallback(() => setProgress([]), []);

  return {
    status,
    error,
    items,
    estimate,
    progress,
    importFiles,
    updateMeta,
    remove,
    requestPersistence,
    refreshEstimate,
    dismissProgress,
  };
}
