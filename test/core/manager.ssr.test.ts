import { describe, expect, it, vi } from 'vitest';

describe('audioManager (SSR)', () => {
  it('no-ops safely when Audio is unavailable', async () => {
    vi.resetModules();
    vi.doMock('../../src/core/constants', async () => {
      const actual = await vi.importActual<typeof import('../../src/core/constants')>(
        '../../src/core/constants',
      );
      return { ...actual, IS_BROWSER: false };
    });

    const { audioManager } = await import('../../src/core/manager');
    const { DEFAULT_AUDIO_STATE } = await import('../../src/core/constants');

    expect(() => audioManager.play()).not.toThrow();
    expect(() => audioManager.pause()).not.toThrow();
    expect(() => audioManager.stop()).not.toThrow();
    expect(() => audioManager.seek(10)).not.toThrow();
    expect(() => audioManager.setVolume(0.5)).not.toThrow();
    expect(() => audioManager.setPlaybackRate(1.2)).not.toThrow();
    expect(() => audioManager.setSource('https://example.com/a.mp3')).not.toThrow();

    expect(audioManager.getAudio()).toBeNull();
    expect(audioManager.getSnapshot()).toEqual(DEFAULT_AUDIO_STATE);
  });
});
