/**
 * Deterministic, locally generated thumbnail artwork.
 *
 * No frames are scraped or copied: every image is an SVG built from the
 * video's numeric seed and its channel tint, so the same video always renders
 * the same picture and the repository ships no binary assets.
 *
 * This generator is the clearly labeled fallback used when the catalog does not
 * yet have a verified real frame thumbnail. A real frame thumbnail, if one is ever
 * extracted here, must come only from a reachable derivative file and replace the
 * fallback only where that actually happened; the catalog must not claim a real
 * frame where none was produced.
 */

export const THUMBNAIL_RULE = 'fallback';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean;
  const value = Number.parseInt(full, 16);
  if (!Number.isFinite(value)) return [60, 70, 80];
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Mix a colour toward white (amount > 0) or black (amount < 0). */
export function mix(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = amount >= 0 ? 255 : 0;
  const ratio = Math.min(1, Math.abs(amount));
  const channel = (value: number) => Math.round(value + (target - value) * ratio);
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(channel(r))}${toHex(channel(g))}${toHex(channel(b))}`;
}

/** Small deterministic PRNG so generated art is stable across renders. */
function prng(seed: number): () => number {
  let state = (Math.abs(Math.floor(seed)) * 2654435761) % 4294967296;
  if (state <= 0) state += 4294967231;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function bands(random: () => number, tint: string): string {
  const parts: string[] = [];
  const count = 3 + Math.floor(random() * 3);
  const height = 180 / count;
  for (let index = 0; index < count; index += 1) {
    const tone = mix(tint, 0.25 + index * 0.16);
    parts.push(
      `<rect x="0" y="${Math.round(index * height)}" width="320" height="${Math.ceil(height) + 1}" fill="${tone}"/>`,
    );
  }
  const cx = 80 + Math.round(random() * 160);
  const cy = 50 + Math.round(random() * 80);
  parts.push(`<circle cx="${cx}" cy="${cy}" r="${24 + Math.round(random() * 34)}" fill="${mix(tint, -0.15)}" opacity="0.55"/>`);
  const horizon = 60 + Math.round(random() * 60);
  parts.push(`<rect x="0" y="${horizon}" width="320" height="2" fill="${mix(tint, 0.75)}"/>`);
  return parts.join('');
}

function arcs(random: () => number, tint: string): string {
  const parts: string[] = [];
  const cx = 120 + Math.round(random() * 90);
  const cy = 60 + Math.round(random() * 60);
  for (let index = 0; index < 7; index += 1) {
    parts.push(
      `<circle cx="${cx}" cy="${cy}" r="${16 + index * 21}" fill="none" stroke="${mix(tint, 0.2 + index * 0.1)}" stroke-width="${index % 2 === 0 ? 5 : 2}"/>`,
    );
  }
  parts.push(`<rect x="0" y="150" width="320" height="30" fill="${mix(tint, 0.35)}"/>`);
  return parts.join('');
}

function stripes(random: () => number, tint: string): string {
  const parts: string[] = [];
  const angle = Math.round(random() * 60) - 30;
  const step = 16 + Math.round(random() * 14);
  for (let x = -240; x < 340; x += step) {
    const width = 4 + Math.round(random() * 8);
    parts.push(
      `<rect x="${x}" y="-80" width="${width}" height="340" fill="${mix(tint, 0.1 + random() * 0.5)}" transform="rotate(${angle} 160 90)"/>`,
    );
  }
  parts.push(`<rect x="18" y="18" width="96" height="96" fill="none" stroke="${mix(tint, -0.25)}" stroke-width="3"/>`);
  return parts.join('');
}

function dots(random: () => number, tint: string): string {
  const parts: string[] = [];
  const cols = 9;
  const rows = 5;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const radius = 3 + Math.round(random() * 7);
      parts.push(
        `<circle cx="${18 + col * 35}" cy="${20 + row * 34}" r="${radius}" fill="${mix(tint, 0.05 + random() * 0.6)}"/>`,
      );
    }
  }
  return parts.join('');
}

function frames(random: () => number, tint: string): string {
  const parts: string[] = [];
  const offset = 12 + Math.round(random() * 26);
  parts.push(`<rect x="${offset}" y="${offset}" width="210" height="120" fill="${mix(tint, 0.55)}" stroke="${mix(tint, -0.1)}" stroke-width="2"/>`);
  parts.push(`<rect x="${offset + 26}" y="${offset + 22}" width="150" height="76" fill="${mix(tint, -0.05)}" opacity="0.7"/>`);
  for (let index = 0; index < 6; index += 1) {
    const y = 20 + index * 26;
    parts.push(`<rect x="256" y="${y}" width="44" height="16" fill="${mix(tint, 0.8)}" opacity="0.9"/>`);
  }
  return parts.join('');
}

function horizon(random: () => number, tint: string): string {
  const parts: string[] = [];
  const sunX = 70 + Math.round(random() * 180);
  const sunY = 46 + Math.round(random() * 30);
  parts.push(`<circle cx="${sunX}" cy="${sunY}" r="${22 + Math.round(random() * 12)}" fill="${mix(tint, -0.2)}"/>`);
  for (let index = 0; index < 6; index += 1) {
    const y = 112 + index * 11;
    const width = 200 - index * 18;
    parts.push(
      `<path d="M${40 + index * 6} ${y} q ${width / 4} -8 ${width / 2} 0 t ${width / 2} 0" fill="none" stroke="${mix(tint, 0.3 + index * 0.09)}" stroke-width="3"/>`,
    );
  }
  return parts.join('');
}

const MOTIFS = [bands, arcs, stripes, dots, frames, horizon];

/**
 * Build a `data:` URI for one thumbnail. `variant` (0–2) shifts the seed so the
 * upload page can offer three distinct poster choices per video.
 */
export function thumbnailDataUri(seed: number, tint: string, variant = 0): string {
  const stableSeed = Math.abs(Math.floor(seed)) + variant * 101;
  const random = prng(stableSeed);
  const background = mix(tint, 0.86);
  const motif = MOTIFS[stableSeed % MOTIFS.length](random, tint);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180" role="presentation">` +
    `<rect width="320" height="180" fill="${background}"/>` +
    motif +
    `<rect width="320" height="180" fill="${mix(tint, 0.9)}" opacity="0.08"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
