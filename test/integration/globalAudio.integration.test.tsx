import { waitFor } from '@testing-library/dom';
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { audioManager, useGlobalAudio } from '../../src';

const getAudioOrThrow = () => {
  const audio = audioManager.getAudio();
  if (!audio) {
    throw new Error('Audio is not available in this environment.');
  }
  return audio;
};

beforeEach(() => {
  cleanup();
  audioManager.setSource(null);
  audioManager.configure({});
  vi.clearAllMocks();
  audioManager.dispose();
});

afterEach(() => {
  cleanup();
  audioManager.dispose();
});

describe('global audio integration', () => {
  it('switching tracks stops A and plays B, updating shared state', async () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play');
    const pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause');

    const first = renderHook(({ src }) => useGlobalAudio({ src, autoPlay: true }), {
      initialProps: { src: 'https://example.com/a.mp3' },
    });

    await waitFor(() => {
      expect(first.result.current.state.src).toBe('https://example.com/a.mp3');
    });

    expect(playSpy).toHaveBeenCalled();
    getAudioOrThrow().dispatchEvent(new Event('playing'));

    first.rerender({ src: 'https://example.com/b.mp3' });

    await waitFor(() => {
      expect(first.result.current.state.src).toBe('https://example.com/b.mp3');
    });

    expect(playSpy).toHaveBeenCalledTimes(2);
    expect(pauseSpy).toHaveBeenCalled();
    getAudioOrThrow().dispatchEvent(new Event('playing'));

    await waitFor(() => {
      expect(first.result.current.state.isPlaying).toBe(true);
    });
  });

  it('restores progress from storage after loadedmetadata', async () => {
    localStorage.setItem('audio:progress:https://example.com/a.mp3', '42');

    const hook = renderHook(() => useGlobalAudio({ src: 'https://example.com/a.mp3' }));

    await waitFor(() => {
      expect(hook.result.current.state.src).toBe('https://example.com/a.mp3');
    });

    const audio = audioManager.getAudio();
    if (!audio) {
      throw new Error('Audio is not available in this environment.');
    }

    audio.dispatchEvent(new Event('loadedmetadata'));

    await waitFor(() => {
      expect(hook.result.current.state.currentTime).toBe(42);
    });
  });

  it('keeps singleton state after unmount/remount', async () => {
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play');

    const first = renderHook(() =>
      useGlobalAudio({ src: 'https://example.com/a.mp3', autoPlay: true }),
    );

    await waitFor(() => {
      expect(first.result.current.state.src).toBe('https://example.com/a.mp3');
    });

    expect(playSpy).toHaveBeenCalled();
    getAudioOrThrow().dispatchEvent(new Event('playing'));

    await waitFor(() => {
      expect(first.result.current.state.isPlaying).toBe(true);
    });

    first.unmount();

    const second = renderHook(() => useGlobalAudio());

    await waitFor(() => {
      expect(second.result.current.state.src).toBe('https://example.com/a.mp3');
    });

    expect(second.result.current.state.isPlaying).toBe(true);
  });
});
