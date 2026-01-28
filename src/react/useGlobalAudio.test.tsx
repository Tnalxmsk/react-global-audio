import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_AUDIO_STATE } from '../core/constants';
import { audioManager } from '../core/manager';
import { useGlobalAudio } from './useGlobalAudio';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  audioManager.setSource(null);
  audioManager.configure({});
  vi.clearAllMocks();
});

describe('audioManager', () => {
  it('sets source and resets to default state', () => {
    // 소스 지정 후 null로 초기화하면 기본 상태로 돌아가는지 검증
    audioManager.setSource('https://example.com/audio.mp3');
    expect(audioManager.getSnapshot().src).toBe('https://example.com/audio.mp3');

    audioManager.setSource(null);
    expect(audioManager.getSnapshot()).toEqual(DEFAULT_AUDIO_STATE);
  });
});

describe('useGlobalAudio', () => {
  it('shares state across hook instances', async () => {
    // 훅이 여러 번 사용되어도 동일한 전역 상태를 공유하는지 검증
    const first = renderHook(() => useGlobalAudio({ src: 'https://example.com/a.mp3' }));
    const second = renderHook(() => useGlobalAudio());

    await waitFor(() => {
      expect(first.result.current.state.src).toBe('https://example.com/a.mp3');
    });

    expect(second.result.current.state.src).toBe('https://example.com/a.mp3');
  });

  it('autoPlay triggers audio play', async () => {
    // autoPlay 옵션이 재생 호출로 이어지는지 검증
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play');

    renderHook(() => useGlobalAudio({ src: 'https://example.com/b.mp3', autoPlay: true }));

    await waitFor(() => {
      expect(playSpy).toHaveBeenCalled();
    });
  });
});
