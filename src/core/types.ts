export type StorageMode = 'localStorage' | 'sessionStorage' | false;

export type AudioState = {
  src: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  rate: number;
  isReady: boolean;
  error?: string;
};

export type UseGlobalAudioOptions = {
  src?: string | null;
  autoPlay?: boolean;
  rememberProgress?: boolean;
  storage?: StorageMode;
  throttleMs?: number;
  keyBuilder?: (src: string) => string;
};

export type AudioEventHandlers = {
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  onWaiting?: () => void;
  onCanPlay?: () => void;
  onError?: (error: string) => void;
};

export type AudioControls = {
  play: (src?: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setSource: (src: string | null) => void;
};
