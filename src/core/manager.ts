import { DEFAULT_AUDIO_STATE, DEFAULT_THROTTLE_MS } from './constants';
import { buildProgressKey, getStorage, loadProgressValue, saveProgressValue } from './storage';
import type {
  AudioControls,
  AudioEventHandlers,
  AudioState,
  StorageMode,
  UseGlobalAudioOptions,
} from './types';

// 모듈 스코프 싱글톤 상태
// 오디오 엘리먼트와 스토어를 모듈 레벨에 1개로 유지하면
// 라우트 전환에도 끊기지 않고, 훅을 어디서 쓰든 동일 상태를 공유
let audio: HTMLAudioElement | null = null;
let state: AudioState = { ...DEFAULT_AUDIO_STATE };
const listeners = new Set<(next: AudioState) => void>();
const eventHandlers = new Set<AudioEventHandlers>();

// 런타임 설정(`configure`로 덮어씀)
let rememberProgress = true;
let storageMode: StorageMode = 'localStorage';
let throttleMs = DEFAULT_THROTTLE_MS;
let keyBuilder: ((src: string) => string) | undefined;

// 진행률 저장 관련 상태
let lastSavedAt = 0;
// 메타데이터가 준비되기 전에 seek가 오면 보류했다가 준비되면 적용하기 위한 변수
let pendingSeekTime: number | null = null;

const notify = () => {
  listeners.forEach((listener) => listener(state));
};

// 등록된 이벤트 핸들러들에게 이벤트를 팬아웃(부수효과/분석 용도)
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

// 상태 업데이트 단일 경로. 모든 구독자가 항상 동기화 되도록 보장
const setState = (partial: Partial<AudioState>) => {
  state = { ...state, ...partial };
  notify();
};

// currentTime을 쓰기 폭주 없이 저장하기 위해 throttling을 적용
const saveProgress = (force = false) => {
  if (!rememberProgress || !state.src) return;
  const storage = getStorage(storageMode);
  if (!storage) return;

  const now = Date.now();
  if (!force && now - lastSavedAt < throttleMs) return;
  lastSavedAt = now;

  saveProgressValue(storage, buildProgressKey(keyBuilder, state.src), state.currentTime);
};

// 특정 소스에 대해 저장된 진행률을 불러옴
const loadProgress = (src: string) => {
  if (!rememberProgress) return null;
  const storage = getStorage(storageMode);
  if (!storage) return null;
  return loadProgressValue(storage, buildProgressKey(keyBuilder, src));
};

// 단일 HTMLAudioElement를 지연 생성하고, DOM 이벤트를 스토어 업데이트로 연결
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
    // duration/메타데이터가 준비되면 보류된 seek를 적용한다.
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

// 활성 소스를 설정하거나 해제
// src 변경을 중앙화해 여러 컴포넌트가 엘리먼트를 서로 덮어쓰지 않게 함
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

  // src가 실제로 바뀐 경우에만 다시 로드
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

// 현재 소스를 재생하거나, 먼저 새 소스로 교체한 뒤 재생
const play = async (src?: string) => {
  const instance = ensureAudio();
  if (src) {
    setSource(src);
  }
  try {
    await instance.play();
  } catch {
    // 자동재생/디코드 오류는 브라우저가 처리
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

// 메타데이터가 준비되기 전에도 안전하게 seek하기 위해 지연 적용 지원
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

// `useSyncExternalStore`에서 사용하는 외부 스토어 구독 API
const subscribe = (listener: (next: AudioState) => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = () => state;

// 진행률 저장 동작을 설정. React 밖에서도 전역으로 공유
const configure = (options: UseGlobalAudioOptions) => {
  rememberProgress = options.rememberProgress ?? true;
  storageMode = options.storage ?? 'localStorage';
  throttleMs = options.throttleMs ?? DEFAULT_THROTTLE_MS;
  keyBuilder = options.keyBuilder;
};

// 컨트롤은 안정적인 참조를 제공해 컴포넌트 메모이제이션에 유리
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
