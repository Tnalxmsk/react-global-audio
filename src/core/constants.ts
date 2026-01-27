import type { AudioState } from './types';

export const DEFAULT_AUDIO_STATE: AudioState = {
  src: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  rate: 1,
  isReady: false,
};

export const DEFAULT_THROTTLE_MS = 2000;
