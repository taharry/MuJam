// Single source of truth for beat<->second conversion. Speed scales
// real time only; it must never be baked into stored beat positions.
export function beatsToSeconds(beats: number, bpm: number, speed = 1): number {
  return (beats / bpm) * 60 / speed;
}

export function secondsToBeats(seconds: number, bpm: number, speed = 1): number {
  return (seconds * speed * bpm) / 60;
}

export function secondsPerBeat(bpm: number, speed = 1): number {
  return 60 / bpm / speed;
}
