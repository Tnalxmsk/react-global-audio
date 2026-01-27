import { DEFAULT_AUDIO_STATE, DEFAULT_THROTTLE_MS } from './constants';
import { buildProgressKey, getStorage, loadProgressValue, saveProgressValue } from './storage';
import type {
  AudioControls,
  AudioEventHandlers,
  AudioState,
  StorageMode,
  UseGlobalAudioOptions,
} from './types';

let audio: HTMLAudioElement | null = null;
let state: AudioState = { ...DEFAULT_AUDIO_STATE };
const listeners = new Set<(next: AudioState) => void>();
const eventHandlers = new Set<AudioEventHandlers>();

let rememberProgress = true;
let storageMode: StorageMode = 'localStorage';
let throttleMs = DEFAULT_THROTTLE_MS;
let keyBuilder: ((src: string) => string) | undefined;

let lastSavedAt = 0;
let pendingSeekTime: number | null = null;

const notify = () => {
  listeners.forEach((listener) => listener(state));
};

const emitEvent = <K extends keyof AudioEventHandlers>(
  key: K,
  ...args: NonNullable<AudioEventHandlers[K]> extends (...params: infer P) => void ? P : []
) => {
  eventHandlers.forEach((handler) => {
    const fn = handler[key];
    if (fn) {
      const callable = fn as (...params: unknown[]) => void;
      callable(...(args as unknown[]));
    }
  });
};

const setState = (partial: Partial<AudioState>) => {
  state = { ...state, ...partial };
  notify();
};

const saveProgress = (force = false) => {
  if (!rememberProgress || !state.src) return;
  const storage = getStorage(storageMode);
  if (!storage) return;

  const now = Date.now();
  if (!force && now - lastSavedAt < throttleMs) return;
  lastSavedAt = now;

  saveProgressValue(storage, buildProgressKey(keyBuilder, state.src), state.currentTime);
};

const loadProgress = (src: string) => {
  if (!rememberProgress) return null;
  const storage = getStorage(storageMode);
  if (!storage) return null;
  return loadProgressValue(storage, buildProgressKey(keyBuilder, src));
};

const ensureAudio = () => {
  if (audio) return audio;

  audio = new Audio();

  audio.addEventListener('timeupdate', () => {
    setState({ currentTime: audio?.currentTime ?? 0 });
    saveProgress();
    emitEvent('onTimeUpdate', audio?.currentTime ?? 0);
  });

  audio.addEventListener('loadedmetadata', () => {
    if (!audio) return;
    setState({ duration: audio.duration || 0, isReady: true });
    emitEvent('onLoadedMetadata', audio.duration || 0);
    if (pendingSeekTime !== null) {
      audio.currentTime = Math.max(0, pendingSeekTime);
      setState({ currentTime: audio.currentTime });
      pendingSeekTime = null;
    }
  });

  audio.addEventListener('playing', () => {
    setState({ isPlaying: true, isReady: true });
    emitEvent('onPlay');
  });

  audio.addEventListener('pause', () => {
    setState({ isPlaying: false });
    saveProgress(true);
    emitEvent('onPause');
  });

  audio.addEventListener('ended', () => {
    setState({ isPlaying: false });
    saveProgress(true);
    emitEvent('onEnded');
  });

  audio.addEventListener('waiting', () => {
    emitEvent('onWaiting');
  });

  audio.addEventListener('canplay', () => {
    emitEvent('onCanPlay');
  });

  audio.addEventListener('error', () => {
    setState({ error: 'audio_error' });
    emitEvent('onError', 'audio_error');
  });

  return audio;
};

const getAudio = () => ensureAudio();

const setSource = (src: string | null) => {
  const instance = ensureAudio();

  if (!src) {
    instance.pause();
    instance.removeAttribute('src');
    instance.load();
    pendingSeekTime = null;
    setState({ ...DEFAULT_AUDIO_STATE });
    return;
  }

  if (state.src !== src) {
    instance.pause();
    instance.src = src;
    instance.load();
    pendingSeekTime = loadProgress(src);
    setState({
      src,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isReady: false,
      error: undefined,
      volume: instance.volume,
      rate: instance.playbackRate,
    });
  }
};

const setPendingSeek = (time: number | null) => {
  pendingSeekTime = time;
};

const play = async (src?: string) => {
  const instance = ensureAudio();
  if (src) {
    setSource(src);
  }
  try {
    await instance.play();
  } catch {
    // autoplay or decode errors are handled by the browser
  }
};

const pause = () => {
  const instance = ensureAudio();
  instance.pause();
};

const stop = () => {
  const instance = ensureAudio();
  instance.pause();
  instance.currentTime = 0;
  setState({ currentTime: 0, isPlaying: false });
  saveProgress(true);
};

const seek = (time: number) => {
  const instance = ensureAudio();
  const nextTime = Math.max(0, Math.min(state.duration || time, time));
  if (!state.duration) {
    pendingSeekTime = nextTime;
    return;
  }
  instance.currentTime = nextTime;
  setState({ currentTime: nextTime });
};

const setVolume = (volume: number) => {
  const instance = ensureAudio();
  const next = Math.max(0, Math.min(1, volume));
  instance.volume = next;
  setState({ volume: next });
};

const setPlaybackRate = (rate: number) => {
  const instance = ensureAudio();
  const next = Math.max(0.5, Math.min(2, rate));
  instance.playbackRate = next;
  setState({ rate: next });
};

const subscribe = (listener: (next: AudioState) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => state;

const configure = (options: UseGlobalAudioOptions) => {
  rememberProgress = options.rememberProgress ?? true;
  storageMode = options.storage ?? 'localStorage';
  throttleMs = options.throttleMs ?? DEFAULT_THROTTLE_MS;
  keyBuilder = options.keyBuilder;
};

const getControls = (): AudioControls => ({
  play,
  pause,
  stop,
  seek,
  setVolume,
  setPlaybackRate,
  setSource,
});

const subscribeEvents = (handlers: AudioEventHandlers) => {
  eventHandlers.add(handlers);
  return () => {
    eventHandlers.delete(handlers);
  };
};

export const audioManager = {
  configure,
  setSource,
  setPendingSeek,
  play,
  pause,
  stop,
  seek,
  setVolume,
  setPlaybackRate,
  getAudio,
  getSnapshot,
  subscribe,
  getControls,
  subscribeEvents,
};
