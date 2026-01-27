import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { audioManager } from '../core/manager';
import type { AudioControls, UseGlobalAudioOptions } from '../core/types';

export const useGlobalAudio = (options: UseGlobalAudioOptions = {}) => {
  const { src, autoPlay = false } = options;

  useEffect(() => {
    audioManager.configure(options);
  }, [options.rememberProgress, options.storage, options.throttleMs, options.keyBuilder]);

  useEffect(() => {
    if (src !== undefined) {
      audioManager.setSource(src);
      if (autoPlay && src) {
        void audioManager.play(src);
      }
    }
  }, [src, autoPlay]);

  const state = useSyncExternalStore(
    audioManager.subscribe,
    audioManager.getSnapshot,
    audioManager.getSnapshot
  );

  const controls = useMemo<AudioControls>(() => audioManager.getControls(), []);

  return { state, controls };
};
