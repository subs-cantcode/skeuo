import { CATEGORIES, type Category } from '../types';

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
] as const;

export const MAX_UPLOAD_BYTES = 200 * 1024 * 1024; // 200 MB
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_TAGS = 15;

export interface FileLike {
  name: string;
  type: string;
  size: number;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Client-side pre-checks only. A real deployment must repeat every check on
 * the server; see docs/architecture.md.
 */
export function validateVideoFile(file: FileLike): string[] {
  const errors: string[] = [];
  const allowed = ALLOWED_VIDEO_TYPES as readonly string[];
  if (!allowed.includes(file.type)) {
    errors.push(
      `“${file.name}” is not a supported video type. Use MP4, WebM, Ogg or QuickTime.`,
    );
  }
  if (file.size === 0) {
    errors.push('That file is empty.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    errors.push(`That file is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`);
  }
  return errors;
}

export interface VideoMetadataInput {
  title: string;
  description: string;
  category: string;
  tags: string;
}

export type MetadataErrors = Partial<Record<keyof VideoMetadataInput, string>>;

export function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((tag) => tag.trim().replace(/^#/, ''))
    .filter(Boolean);
}

export function validateMetadata(input: VideoMetadataInput): MetadataErrors {
  const errors: MetadataErrors = {};
  const title = input.title.trim();
  if (!title) {
    errors.title = 'A title is required.';
  } else if (title.length > MAX_TITLE_LENGTH) {
    errors.title = `Titles are limited to ${MAX_TITLE_LENGTH} characters.`;
  }
  if (input.description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Descriptions are limited to ${MAX_DESCRIPTION_LENGTH} characters.`;
  }
  if (!CATEGORIES.includes(input.category as Category)) {
    errors.category = 'Choose a category.';
  }
  if (parseTags(input.tags).length > MAX_TAGS) {
    errors.tags = `Use at most ${MAX_TAGS} tags.`;
  }
  return errors;
}
