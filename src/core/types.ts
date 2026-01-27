// 진행률 저장에 사용할 스토리지 선택지. false면 저장을 비활성화
export type StorageMode = 'localStorage' | 'sessionStorage' | false;

// 오디오 매니저가 전역으로 유지하는 단일 상태 스냅샷
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

// 훅/매니저 동작을 제어하는 옵션
// 호출부는 선언적으로 옵션만 넘기고, 실제 동작은 매니저가 책임
export type UseGlobalAudioOptions = {
  src?: string | null;
  autoPlay?: boolean;
  rememberProgress?: boolean;
  storage?: StorageMode;
  throttleMs?: number;
  keyBuilder?: (src: string) => string;
};

// 오디오 엘리먼트 이벤트를 외부로 전달하기 위한 핸들러 모음
// 분석/로깅/부수효과를 재생 로직과 분리
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

// UI가 호출하는 재생 제어 API
// 전역 매니저를 직접 만지지 않고, 안전한 표면만 노출
export type AudioControls = {
  play: (src?: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setSource: (src: string | null) => void;
};
