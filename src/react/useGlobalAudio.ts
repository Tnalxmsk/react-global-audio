import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { audioManager } from '../core/manager';
import type { AudioControls, UseGlobalAudioOptions } from '../core/types';

// 모듈 스코프 싱글톤 오디오 매니저를 React에서 쓰기 위한 훅.
// - 외부 스토어 하나를 구독하면 라우트 전환에도 재생 유지
// - 여러 곳에서 훅을 써도 항상 같은 상태 공유
export const useGlobalAudio = (options: UseGlobalAudioOptions = {}) => {
  const { src, autoPlay = false } = options;

  // 전역 매니저 설정을 최신 옵션과 동기화
  // 런타임 동작에 영향을 주는 필드만 의존성에 포함
  useEffect(() => {
    audioManager.configure(options);
  }, [options.rememberProgress, options.storage, options.throttleMs, options.keyBuilder]);

  // `src`가 제공/변경되면 싱글톤 소스를 갱신
  // 자동재생 옵션도 여기서 처리해 호출부를 단순하게 유지
  useEffect(() => {
    if (src !== undefined) {
      audioManager.setSource(src);
      if (autoPlay && src) {
        void audioManager.play(src);
      }
    }
  }, [src, autoPlay]);

  // React 18에서 안전한 방식으로 외부 스토어를 구독
  const state = useSyncExternalStore(
    audioManager.subscribe,
    audioManager.getSnapshot,
    audioManager.getSnapshot
  );

  // 컨트롤은 공유/안정 참조이므로 메모로 불필요한 렌더링 방지
  const controls = useMemo<AudioControls>(() => audioManager.getControls(), []);

  return { state, controls };
};
