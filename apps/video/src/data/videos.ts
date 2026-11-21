import type { Category, Video } from '../types';

/**
 * Demo catalog plus one accurately described real sample.
 *
 * `DEMO_ROWS` is the original 24-entry catalog. Those entries are **fictional
 * demonstration content**: titles, descriptions, durations, view counts and
 * dates are invented, and each one is flagged `demo: true` so the interface can
 * say so. They stream an openly licensed CC0 stand-in clip from MDN Web Docs in
 * rotation; the clip is not the video the invented title describes.
 *
 * `MDN_FLOWER` is the opposite case: a real, accurately described sample whose
 * playback source is known, whose duration was measured, and whose thumbnail is
 * a frame extracted from that same file.
 *
 * Only playback sources that were actually observed to decode in Chromium are
 * kept. Three earlier candidates (Wikimedia Commons `.ogv`/`.webm` files and two
 * Internet Archive home movies) never reached the playback bar here, so they
 * were removed rather than shipped as dead players. See docs/sample-media.md.
 */
const SAMPLE_CLIPS = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4',
];

type Row = [
  id: string,
  title: string,
  channelId: string,
  category: Category,
  durationSec: number,
  views: number,
  uploadedAt: string,
  seed: number,
  tags: string,
  description: string,
];

const DEMO_ROWS: Row[] = [
  ['v-harbour', 'Harbour Lights — a short film in three tides', 'northlight', 'Film & Animation', 372, 284510, '2026-11-18', 1, 'short film,16mm,coastal', 'A lighthouse keeper counts the boats that never come back. Shot on 16mm over four mornings in Northumberland, with a score performed on a harmonium.'],
  ['v-titlecards', 'How we built the title sequence with paper and a projector', 'northlight', 'Film & Animation', 512, 41208, '2026-11-02', 2, 'behind the scenes,design,title sequence', 'Every frame in the opening credits is a photographed paper cutout. Here is the rig, the light, and the eleven takes it took to get the wave right.'],
  ['v-nightbus', 'Night Bus (2009 restoration)', 'northlight', 'Film & Animation', 668, 93014, '2026-09-21', 3, 'restoration,short film,night', 'Our student film, cleaned up from a scratched digibeta master. The audio dropout at 4:12 is in the original; we left it in rather than fake a fix.'],
  ['v-synth-take', 'One synth, one take: the Friday drone', 'circuits', 'Music', 284, 156220, '2026-11-20', 4, 'synth,ambient,live take', 'A slow build on a borrowed MS-20 with a broken envelope. Patch notes: filter 40% open, no reverb, recorded straight into the interface.'],
  ['v-string-quartet', 'Quartet in a stairwell', 'circuits', 'Music', 331, 88210, '2026-11-08', 5, 'acoustic,quartet,stairwell', 'Four players, one stairwell, one microphone. The reverb is the building, not a plugin. Sheet music is linked in the pinned comment.'],
  ['v-tape-loop', 'Tape loops and why they drift', 'circuits', 'Music', 449, 34160, '2026-10-15', 6, 'tape,loops,gear', 'A measured look at wow and flutter using a loop we made in 2009, plus a practical trick for keeping two tape machines in step.'],
  ['v-lamp-repair', 'Repairing a 1962 desk lamp (and its dangerous switch)', 'workbench', 'Howto & Style', 921, 512033, '2026-11-19', 7, 'repair,lighting,restoration', 'The switch was arcing against the housing. We replace it with a modern earthed part, rewire the cord, and explain why we did not keep the original plug.'],
  ['v-plane-setup', 'Setting up a hand plane so it takes a shaving you can read through', 'workbench', 'Howto & Style', 744, 221408, '2026-11-11', 8, 'woodworking,tools,sharpening', 'Flatten the sole, sharpen the iron, set the chip breaker close. No jigs required, though we show the jig we use anyway.'],
  ['v-furnace', 'The furnace that would not stay lit: a diagnosis', 'workbench', 'Howto & Style', 1102, 176002, '2026-10-29', 9, 'heating,diagnosis,safety', 'A methodical fault-find through a stubborn pilot light, including the two checks you must never skip. We are not responsible for your boiler; call a professional if in doubt.'],
  ['v-strategy-ch1', 'Iron Vale — chapter one: the supply line problem', 'pixelpasture', 'Gaming', 1840, 68210, '2026-11-17', 10, 'strategy,playthrough,retro', 'A slow playthrough on original hardware. This episode covers the first winter and why we deliberately lose two towns to keep the road open.'],
  ['v-strategy-ch2', 'Iron Vale — chapter two: cavalry is a trap', 'pixelpasture', 'Gaming', 2104, 44209, '2026-11-06', 11, 'strategy,playthrough,retro', 'Horses look strong until the mud. We compare three openings and show the one that does not run out of food in February.'],
  ['v-dosbox', 'Running a 1994 strategy game on a modern machine without breaking it', 'pixelpasture', 'Science & Technology', 803, 132480, '2026-10-18', 12, 'emulation,dosbox,retro computing', 'Mounting, sound configuration, and the two settings that stop the cursor from drifting. No downloads are hosted here; the config file is in the description.'],
  ['v-council', 'Council meeting: the bus depot vote, explained in five minutes', 'citydesk', 'News & Politics', 312, 41209, '2026-11-21', 13, 'local news,transit,council', 'The motion passed 6–5. We summarise the amendment that changed two votes, and link the full minutes and the audio recording in the description.'],
  ['v-zoning', 'What the new zoning map actually changes', 'citydesk', 'News & Politics', 574, 28110, '2026-11-13', 14, 'zoning,housing,maps', 'Four blocks upzoned, one historic overlay kept. We walk the map with a planner and a resident who has lived on the corner since 1978.'],
  ['v-ferry', 'The 6:40 ferry to the island, in real time', 'slowcoast', 'Travel & Events', 2280, 342910, '2026-11-16', 15, 'ferry,slow travel,coast', 'No narration, no music. Wind noise is the weather that morning. Timetable and accessibility notes are in the description.'],
  ['v-cliffpath', 'A cliff path with 312 steps: route notes and a knee-friendly detour', 'slowcoast', 'Travel & Events', 981, 104320, '2026-11-04', 16, 'walking,routes,accessibility', 'The main path closes in high wind. We show the inland detour and where the benches are, plus the tide times you need before starting.'],
  ['v-lighthouse', 'Three lighthouses you can reach by bus', 'slowcoast', 'Travel & Events', 762, 218900, '2026-10-22', 17, 'lighthouses,buses,travel', 'A practical route guide: which passes to buy, which cafes are open in winter, and which tower has the 143-step climb.'],
  ['v-printer', 'The office printer sketch', 'backlot', 'Comedy', 214, 702114, '2026-11-20', 18, 'sketch,office,printer', 'It jams on page one. It has always jammed on page one. Four minutes of escalating revenge, filmed in an actual office after hours.'],
  ['v-casting', 'We held open casting for a plant', 'backlot', 'Comedy', 287, 388221, '2026-11-09', 19, 'sketch,casting,plants', 'Forty auditions. One fern. The fern is, frankly, the best actor in the group and we have told the others.'],
  ['v-blooper', 'Blooper reel: the take where the door falls over', 'backlot', 'Comedy', 402, 152009, '2026-10-27', 20, 'bloopers,behind the scenes', 'Nine minutes of us failing to open a door. Includes the second door we broke trying to fix the first one.'],
  ['v-cat', 'A cat reviews six cardboard boxes', 'backlot', 'Pets & Animals', 168, 921440, '2026-11-15', 21, 'cats,boxes,reviews', 'Independent, unbiased box testing. The cat was paid in tuna. Two boxes were destroyed during the review and are not ranked.'],
  ['v-radio', 'Building a crystal radio that actually works', 'workbench', 'Education', 694, 61209, '2026-11-01', 22, 'radio,electronics,beginner', 'Twenty metres of wire, a germanium diode and an earphone. We tune two stations and explain why the third one is a mystery.'],
  ['v-archive', 'Digitising a box of 1998 home video tapes', 'citydesk', 'Science & Technology', 1420, 74110, '2026-10-12', 23, 'archiving,video,preservation', 'Cleaning, capturing and naming a decade of family tapes. We show the capture settings and the spreadsheet we use to keep track of 63 cassettes.'],
  ['v-football', 'Sunday league: the equaliser from the halfway line', 'pixelpasture', 'Sports', 96, 402218, '2026-11-07', 24, 'football,sunday league,goal', 'Filmed on a phone from the touchline by someone shouting. No slow motion, no music. The goal is at 0:64 and yes, the camera shakes.'],
];

const DEMO_VIDEOS: Video[] = DEMO_ROWS.map((row, index) => ({
  id: row[0],
  title: row[1],
  channelId: row[2],
  category: row[3],
  durationSec: row[4],
  views: row[5],
  uploadedAt: `${row[6]}T12:00:00.000Z`,
  thumbSeed: row[7],
  tags: row[8].split(','),
  description: row[9],
  src: SAMPLE_CLIPS[index % SAMPLE_CLIPS.length],
  demo: true,
}));

/**
 * A real sample: the description matches the footage, the duration is measured
 * from the file, and the thumbnail is a frame extracted from the same MP4 with
 * `scripts/extract-thumbnail.mjs`.
 */
const MDN_FLOWER: Video = {
  id: 'v-mdn-flower',
  title: 'Flower opening in a garden bed',
  channelId: 'slowcoast',
  category: 'Science & Technology',
  durationSec: 5,
  views: 84210,
  uploadedAt: '2026-11-20T12:00:00.000Z',
  thumbSeed: 25,
  tags: ['flower', 'timelapse', 'macro', 'nature'],
  description:
    'A short macro clip of a red flower opening among green leaves, from the CC0 sample video published with MDN Web Docs. Unlike the demonstration entries around it, this title, description and duration describe the footage that actually plays.',
  src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  attribution: 'MDN Web Docs sample media / CC0 1.0 (Mozilla)',
  thumbnail: '/thumbnails/flower.webp',
};

export const VIDEOS: Video[] = [...DEMO_VIDEOS, MDN_FLOWER];

export const videoById = (id: string): Video | undefined =>
  VIDEOS.find((video) => video.id === id);
