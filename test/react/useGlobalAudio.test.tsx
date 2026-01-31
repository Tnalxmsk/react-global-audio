import { waitFor } from '@testing-library/dom';
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { audioManager } from '../../src';
import { useGlobalAudio } from '../../src';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  audioManager.setSource(null);
  audioManager.configure({});
  vi.clearAllMocks();
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
