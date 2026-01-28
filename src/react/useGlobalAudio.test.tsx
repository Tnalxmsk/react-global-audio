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

  it('clamps volume and playbackRate to valid ranges ', () => {
    // 볼륨과 재생속도 범위를 강제로 제한하는지 검증
    audioManager.setVolume(2);
    audioManager.setPlaybackRate(3);
    expect(audioManager.getSnapshot().volume).toBe(1);
    expect(audioManager.getSnapshot().rate).toBe(2);

    audioManager.setVolume(-1);
    audioManager.setPlaybackRate(0.1);
    expect(audioManager.getSnapshot().volume).toBe(0);
    expect(audioManager.getSnapshot().rate).toBe(0.5);
  });

  it('applies pending seek after metadata is loaded', () => {
    // 메타데이터가 준비되기 전 seek 요청이 보류되었다가 반영되는지 검증
    const audio = audioManager.getAudio();
    Object.defineProperty(audio, 'duration', {
      configurable: true,
      value: 120,
    });

    audioManager.seek(50);
    expect(audioManager.getSnapshot().currentTime).toBe(0); // 아직 적용 안 됨

    audio.dispatchEvent(new Event('loadedmetadata'));
    expect(audioManager.getSnapshot().currentTime).toBe(50); // 적용됨
  });

  it('sets error state on audio error event', () => {
    // 에러 이벤트 발생 시 상태가 갱신되는지 검증
    const audio = audioManager.getAudio();
    audio.dispatchEvent(new Event('error'));
    expect(audioManager.getSnapshot().error).toBe('audio_error');
  });

  it('stop resets currentTime and isPlaying', () => {
    // stop이 재생 상태를 종료하고 시간을 0으로 되돌리는지 검증
    const audio = audioManager.getAudio();
    Object.defineProperty(audio, 'currentTime', {
      configurable: true,
      writable: true,
      value: 42,
    });

    audioManager.play();
    audioManager.stop();

    expect(audioManager.getSnapshot().currentTime).toBe(0);
    expect(audioManager.getSnapshot().isPlaying).toBe(false);
  });

  it('calls subscribed event handlers on play/pause/timeupdate', () => {
    // 이벤트 팬아웃이 정상 동작하는지 검증
    const onPlay = vi.fn();
    const onPause = vi.fn();
    const onTimeUpdate = vi.fn();

    const unsubscribe = audioManager.subscribeEvents({ onPlay, onPause, onTimeUpdate });

    const audio = audioManager.getAudio();
    audio.dispatchEvent(new Event('playing'));
    audio.dispatchEvent(new Event('pause'));
    audio.dispatchEvent(new Event('timeupdate'));

    expect(onPlay).toHaveBeenCalled();
    expect(onPause).toHaveBeenCalled();
    expect(onTimeUpdate).toHaveBeenCalled();

    unsubscribe();
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
