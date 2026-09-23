// Per-song manual sync offset (seconds into the video where the
// arrangement's beat 0 actually falls), persisted locally since MuJam
// has no backend. Hand-entered arrangements rarely line up perfectly
// with a given upload, so this lets a user nudge it into place once.
const KEY_PREFIX = "mujam:yt-offset:";

export function getStoredSyncOffset(songId: string): number {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + songId);
    if (raw === null) return 0;
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export function setStoredSyncOffset(songId: string, offsetSeconds: number): void {
  try {
    localStorage.setItem(KEY_PREFIX + songId, String(offsetSeconds));
  } catch {
    // Private browsing / storage disabled — the offset just won't persist across visits.
  }
}
