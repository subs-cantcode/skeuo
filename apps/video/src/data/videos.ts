import type { Category, Video } from '../types';

/**
 * Sample playback and thumbnail media for the demo catalog.
 *
 * Playback sources are external openly licensed media where the provider permits the
 * intended use. This catalog does not claim a real frame thumbnail for any video unless a
 * frame was actually extracted from a reachable derivative file in this environment; otherwise
 * the thumbnail is a clearly labeled generated fallback produced by src/lib/thumbnails.ts.
 * One entry (`v-mdn-flower`) carries a real frame extracted here with
 * `scripts/extract-thumbnail.mjs`; every other entry uses the generated fallback.
 *
 * Licensing and attribution are documented per video in docs/sample-media.md. Fictional
 * channels remain demonstration profiles; they do not represent the actual creators of the
 * underlying footage.
 */

const SAMPLE_CLIPS = [
  'https://upload.wikimedia.org/wikipedia/commons/5/5c/Baking_cookies.ogv',
  'https://upload.wikimedia.org/wikipedia/commons/a/ae/Music_in_the_street%2C_Barcelona_01.webm',
  'https://upload.wikimedia.org/wikipedia/commons/1/1b/EIDAN_500_-_Buenos_Aires_Subway_-_B_line.webm',
  'https://archive.org/download/castaoca_000159/castaoca_000159_access.HD.mp4',
  'https://archive.org/download/castaoca_000126/castaoca_000126_access.HD.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
];

type Row = [
  id: string,
  title: string,
  channelId: string,
  category: Category,
  durationSec: number,
  views: number,
  uploadedAt: string,
  tags: string,
  description: string,
  srcIndex: number,
  attribution: string,
  thumbnail?: string,
];

const ROWS: Row[] = [
  [
    'v-baking-cookies',
    'Cookies baking in the oven',
    'workbench',
    'Howto & Style',
    20,
    284510,
    '2026-11-18',
    'baking,cookies,kitchen',
    'A quiet short clip of cookies baking in the oven. Used here as a simple everyday Howto & Style demo clip.',
    0,
    'Robert Cole / CC0 1.0 (Wikimedia Commons)',
  ],
  [
    'v-music-street-barcelona',
    'Music in the street, Barcelona',
    'circuits',
    'Music',
    172,
    41208,
    '2026-11-02',
    'street music,live performance,barcelona',
    'A short street-performance clip from Barcelona. Used here as a Music demo clip for the catalog.',
    1,
    'Nicolas Vigier / CC0 1.0 (Wikimedia Commons)',
  ],
  [
    'v-eidan-subte',
    'EIDAN 500 on the B line, Buenos Aires Subway',
    'slowcoast',
    'Travel & Events',
    27,
    93014,
    '2026-09-21',
    'subway,train,public transport,buenos aires',
    'A short clip aboard the EIDAN 500 on the B line of the Buenos Aires Subway at Alem station. Used here as a Travel & Events demo clip.',
    2,
    'Mauricio V. Genta / CC0 1.0 (Wikimedia Commons)',
  ],
  [
    'v-clark-family-159',
    'Clark family home movie',
    'backlot',
    'Entertainment',
    172,
    512033,
    '2026-11-19',
    'home movie,family,film,archival',
    'A short home-movie clip from the Clark Family collection. Used here as an Entertainment demo clip.',
    3,
    'Clark Family / Public Domain Mark 1.0 (Internet Archive)',
  ],
  [
    'v-clark-family-126',
    'Kids on bikes in floodwater, home movie',
    'backlot',
    'Sports',
    261,
    176002,
    '2026-10-29',
    'home movie,family,outdoors,archival',
    'A short home-movie clip of kids on bikes in floodwater from the Clark Family collection. Used here as a Sports demo clip.',
    4,
    'Clark Family / Public Domain Mark 1.0 (Internet Archive)',
  ],
  [
    'v-mdn-flower',
    'Flower opening in a garden bed',
    'slowcoast',
    'Science & Technology',
    5,
    84210,
    '2026-11-20',
    'flower,timelapse,macro,nature',
    'A short macro clip of a red flower opening among green leaves, from the CC0 sample video published with MDN Web Docs. Used here as a Science & Technology demo clip. Its thumbnail is a real frame extracted from this clip.',
    5,
    'MDN Web Docs sample media / CC0 1.0 (Mozilla)',
    'thumbnails/flower.webp',
  ],
];

export const VIDEOS: Video[] = ROWS.map((row, index) => ({
  id: row[0],
  title: row[1],
  channelId: row[2],
  category: row[3],
  durationSec: row[4],
  views: row[5],
  uploadedAt: `${row[6]}T12:00:00.000Z`,
  tags: row[7].split(','),
  description: row[8],
  src: SAMPLE_CLIPS[row[9] % SAMPLE_CLIPS.length],
  thumbSeed: index,
  localDraft: false,
  attribution: row[10],
  thumbnail: row[11],
}));

export const videoById = (id: string): Video | undefined =>
  VIDEOS.find((video) => video.id === id);
