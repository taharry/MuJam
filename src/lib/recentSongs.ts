// Tracks the last few songs a user opened, purely for the homepage's
// "Recently played" row. Local to this browser, like the other
// localStorage-backed stores — no account, no backend.
const STORAGE_KEY = "mujam:recent-songs";
const MAX_ENTRIES = 8;

export function recordRecentSong(songId: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const next = [songId, ...ids.filter((id) => id !== songId)].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private browsing / storage disabled — just won't remember it.
  }
}

export function getRecentSongIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}
