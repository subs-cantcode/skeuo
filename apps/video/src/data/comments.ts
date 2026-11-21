import type { Comment } from '../types';

/** Seeded comments. All handles and text are original to this project. */
export const SEED_COMMENTS: Comment[] = [
  {
    id: 'c1',
    videoId: 'v-harbour',
    author: 'mossandmortar',
    body:
      'The sound of the harmonium at 2:40 is doing a lot of quiet work. Did you record it in the room or add it later?',
    createdAt: '2026-11-19T09:12:00.000Z',
    likes: 24,
  },
  {
    id: 'c2',
    videoId: 'v-harbour',
    author: 'northlight',
    body: 'In the room, one take, microphone about a metre back. The creak is the floorboard.',
    createdAt: '2026-11-19T14:02:00.000Z',
    likes: 41,
  },
  {
    id: 'c3',
    videoId: 'v-harbour',
    author: 'frame_by_frame',
    body: 'Watched this twice. The second time I noticed the boat count changes between tides. Very good.',
    createdAt: '2026-11-20T07:45:00.000Z',
    likes: 12,
  },
  {
    id: 'c4',
    videoId: 'v-lamp-repair',
    author: 'soldering_iron',
    body:
      'Replacing the switch is the right call. I have the same lamp and the original switch was cracked at the terminal.',
    createdAt: '2026-11-20T11:20:00.000Z',
    likes: 63,
  },
  {
    id: 'c5',
    videoId: 'v-lamp-repair',
    author: 'oldtoolsnewtricks',
    body: 'Chapter list in the description would help, but the diagnosis section is excellent.',
    createdAt: '2026-11-20T16:08:00.000Z',
    likes: 9,
  },
  {
    id: 'c6',
    videoId: 'v-synth-take',
    author: 'patchbay',
    body: 'That envelope is exactly why people keep broken MS-20s. Lovely drone.',
    createdAt: '2026-11-21T06:30:00.000Z',
    likes: 18,
  },
  {
    id: 'c7',
    videoId: 'v-council',
    author: 'depotwatch',
    body:
      'Thank you for linking the minutes. The amendment text is on page 14 for anyone looking for the two-vote change.',
    createdAt: '2026-11-21T10:04:00.000Z',
    likes: 31,
  },
  {
    id: 'c8',
    videoId: 'v-printer',
    author: 'thirdfloor',
    body: 'I sent this to my office. The office did not laugh. The office knows.',
    createdAt: '2026-11-20T20:22:00.000Z',
    likes: 220,
  },
  {
    id: 'c9',
    videoId: 'v-ferry',
    author: 'islandbound',
    body: 'Real time was the correct choice. Watched it with breakfast. The gull at 12:10 is a menace.',
    createdAt: '2026-11-17T08:11:00.000Z',
    likes: 55,
  },
  {
    id: 'c10',
    videoId: 'v-cat',
    author: 'boxinspector',
    body: 'Box 4 was clearly the winner. Your cat is being generous with box 2.',
    createdAt: '2026-11-16T19:40:00.000Z',
    likes: 88,
  },
];
