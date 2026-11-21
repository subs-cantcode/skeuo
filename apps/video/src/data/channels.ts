import type { Channel } from '../types';

/**
 * Fictional channels. Names, bios and handles are original to this project;
 * no real creator or YouTube channel is represented.
 */
export const CHANNELS: Channel[] = [
  {
    id: 'northlight',
    name: 'Northlight Films',
    handle: 'northlightfilms',
    bio:
      'Short films, title sequences and behind-the-scenes notes from a small\n' +
      'collective in the north of England. New shorts most months; nothing here\n' +
      'is sponsored. If you want to use a shot, ask first and credit the crew.',
    joined: '2006-04-18',
    country: 'United Kingdom',
    website: 'http://northlight.example',
    themeColor: '#2f4858',
    subscribers: 48210,
    channelViews: 3912044,
    videosWatched: 1877,
  },
  {
    id: 'circuits',
    name: 'Circuits & Strings',
    handle: 'circuitsandstrings',
    bio:
      'Bedroom recordings made with one synth, one guitar and too many cables.\n' +
      'Every track is performed in a single take. Patch notes are in the video\n' +
      'descriptions for anyone who wants to try them.',
    joined: '2007-01-09',
    country: 'Canada',
    website: 'http://circuits.example',
    themeColor: '#4a3b5c',
    subscribers: 129480,
    channelViews: 8821100,
    videosWatched: 903,
  },
  {
    id: 'workbench',
    name: 'The Workbench',
    handle: 'theworkbench',
    bio:
      'Repairs, restorations and small builds. No sponsorship, no affiliate\n' +
      'links: if a tool is bad, we say so. Workshop safety notes are pinned in\n' +
      'the playlists so beginners start in the right place.',
    joined: '2005-11-02',
    country: 'United States',
    website: 'http://workbench.example',
    themeColor: '#5a4632',
    subscribers: 231904,
    channelViews: 14680221,
    videosWatched: 3401,
  },
  {
    id: 'pixelpasture',
    name: 'Pixel Pasture',
    handle: 'pixelpasture',
    bio:
      'Long-form playthroughs of old strategy games, one chapter per video.\n' +
      'We play on original hardware where we can. Corrections go in the\n' +
      'comments and get pinned; no commentary tracks over the ending.',
    joined: '2008-02-14',
    country: 'Australia',
    website: 'http://pixelpasture.example',
    themeColor: '#33502f',
    subscribers: 71330,
    channelViews: 5120330,
    videosWatched: 2210,
  },
  {
    id: 'citydesk',
    name: 'City Desk',
    handle: 'citydesk',
    bio:
      'A two-person newsroom covering local council meetings, transit and the\n' +
      'occasional zoning argument. We publish the documents we cite. If we get\n' +
      'something wrong, the correction appears in the same video description.',
    joined: '2006-09-27',
    country: 'United States',
    website: 'http://citydesk.example',
    themeColor: '#3d4f6c',
    subscribers: 38940,
    channelViews: 2740011,
    videosWatched: 512,
  },
  {
    id: 'slowcoast',
    name: 'Slow Coast',
    handle: 'slowcoast',
    bio:
      'Walking routes, ferry timetables and quiet places. Filmed on a decade-old\n' +
      'camera. Route maps and accessibility notes are in each description; we\n' +
      'welcome corrections from people who live there.',
    joined: '2007-06-05',
    country: 'Norway',
    website: 'http://slowcoast.example',
    themeColor: '#315a5a',
    subscribers: 96520,
    channelViews: 6210340,
    videosWatched: 1420,
  },
  {
    id: 'backlot',
    name: 'Backlot Comedy',
    handle: 'backlotcomedy',
    bio:
      'Sketches written by four people in one room. We post the blooper reel at\n' +
      'the end of every third video, because it is cheaper than a second take.\n' +
      'No laugh track. Ever.',
    joined: '2008-03-21',
    country: 'Ireland',
    website: 'http://backlot.example',
    themeColor: '#6a3340',
    subscribers: 166870,
    channelViews: 9904452,
    videosWatched: 2603,
  },
];

export const channelById = (id: string): Channel | undefined =>
  CHANNELS.find((channel) => channel.id === id);
