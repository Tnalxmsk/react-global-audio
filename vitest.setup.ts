import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

const patchMediaElement = () => {
  if (typeof HTMLMediaElement === 'undefined') return;

  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'load', {
    configurable: true,
    value: vi.fn(),
  });
};

const ensureAudioConstructor = () => {
  if (typeof document === 'undefined') return;

  globalThis.Audio =
    globalThis.Audio ??
    (function Audio() {
      return document.createElement('audio');
    } as unknown as typeof Audio);
};

patchMediaElement();
ensureAudioConstructor();
