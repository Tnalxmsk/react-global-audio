import type { StorageMode } from './types';

export const getStorage = (mode: StorageMode) => {
  if (mode === 'localStorage') return localStorage;
  if (mode === 'sessionStorage') return sessionStorage;
  return null;
};

export const buildProgressKey = (keyBuilder: ((src: string) => string) | undefined, src: string) =>
  keyBuilder ? keyBuilder(src) : `audio:progress:${src}`;

export const saveProgressValue = (storage: Storage | null, key: string, value: number) => {
  if (!storage) return;
  try {
    storage.setItem(key, String(Math.floor(value)));
  } catch {
    // ignore storage errors
  }
};

export const loadProgressValue = (storage: Storage | null, key: string) => {
  if (!storage) return null;
  try {
    const value = storage.getItem(key);
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
