import type { Channel } from '../types';

export const DEFAULT_CHANNEL_TINT = '#5c6670';

export const channelName = (channel?: Channel) => channel?.name ?? 'Unknown channel';

export const channelTint = (channel?: Channel) => channel?.themeColor ?? DEFAULT_CHANNEL_TINT;
