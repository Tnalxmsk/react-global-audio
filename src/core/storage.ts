import type { StorageMode } from './types';

// 선택한 저장소 백엔드를 반환하고, 비활성화면 null을 반환
export const getStorage = (mode: StorageMode) => {
  if (mode === 'localStorage') return localStorage;
  if (mode === 'sessionStorage') return sessionStorage;
  return null;
};

// 나중에 진행률을 복원할 수 있도록 소스별 안정적인 키 생성
export const buildProgressKey = (keyBuilder: ((src: string) => string) | undefined, src: string) =>
  keyBuilder ? keyBuilder(src) : `audio:progress:${src}`;

// 프라이빗 모드/쿼터 등으로 storage가 throw할 수 있어 방어적으로 기록
export const saveProgressValue = (storage: Storage | null, key: string, value: number) => {
  if (!storage) return;
  try {
    storage.setItem(key, String(Math.floor(value)));
  } catch {
    // 저장 실패가 재생 자체를 깨지 않도록 무시
  }
};

// 방어적으로 읽고, 파싱된 값이 유효한 숫자인지 검증
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
