import type { AudioState } from './types';

// 오디오 매니저의 초기 상태. 소스를 비우고 안전한 기본값으로 시작
export const DEFAULT_AUDIO_STATE: AudioState = {
  src: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  rate: 1,
  isReady: false,
};

// 진행률 저장 쓰기 간격(ms). 너무 자주 저장하지 않도록 기본 throttling 값 지정
export const DEFAULT_THROTTLE_MS = 2000;

// SSR 환경 감지를 위한 플래그
export const IS_BROWSER = typeof window !== 'undefined' && typeof window.document !== 'undefined';
