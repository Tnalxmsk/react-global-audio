# react-global-audio

Route-safe global audio manager and hook for React apps.

## Install

```bash
npm i react-global-audio
```

Peer dependency:

```bash
npm i react
```

## Quick Start

```tsx
import { useGlobalAudio } from 'react-global-audio';

export function Player() {
  const { state, controls } = useGlobalAudio({
    src: '/audio/track.mp3',
    rememberProgress: true,
    storage: 'localStorage',
  });

  return (
    <div>
      <button onClick={() => controls.play()}>Play</button>
      <button onClick={controls.pause}>Pause</button>
      <button onClick={controls.stop}>Stop</button>

      <div>
        {Math.floor(state.currentTime)} / {Math.floor(state.duration)}
      </div>

      <input
        type='range'
        min={0}
        max={state.duration || 0}
        value={state.currentTime}
        onChange={(e) => controls.seek(Number(e.target.value))}
      />
    </div>
  );
}
```

## Manager API (Optional)

```ts
import { audioManager } from 'react-global-audio';

audioManager.configure({ rememberProgress: true, storage: 'localStorage' });
await audioManager.play('/audio/track.mp3');
audioManager.pause();
```

Subscribe to state:

```ts
const unsubscribe = audioManager.subscribe((next) => {
  console.log(next.currentTime);
});

unsubscribe();
```

Subscribe to audio events:

```ts
const off = audioManager.subscribeEvents({
  onPlay: () => console.log('play'),
  onPause: () => console.log('pause'),
  onEnded: () => console.log('ended'),
  onTimeUpdate: (time) => console.log(time),
  onError: (err) => console.error(err),
});

off();
```

## Options

`useGlobalAudio(options)` and `audioManager.configure(options)` accept:

- `src?: string | null`
- `autoPlay?: boolean`
- `rememberProgress?: boolean` (default: `true`)
- `storage?: 'localStorage' | 'sessionStorage' | false` (default: `'localStorage'`)
- `throttleMs?: number` (default: `2000`)
- `keyBuilder?: (src: string) => string`

## Controls

Available from the hook (`controls`) and `audioManager.getControls()`:

- `play(src?)`
- `pause()`
- `stop()`
- `seek(time)`
- `setVolume(volume)` (0 to 1)
- `setPlaybackRate(rate)` (0.5 to 2)
- `setSource(src)`

## Notes

- Progress is saved in whole seconds.
- A single shared `HTMLAudioElement` instance is used.
- Set `storage: false` to disable persistence.
