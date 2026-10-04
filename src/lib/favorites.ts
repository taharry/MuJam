// Favorited songs, keyed by stable internal song id (never title, so
// two songs sharing a name can't collide). No accounts/database exist
// in MuJam, so this — like the other local stores — lives in
// localStorage, consistent with customSongs.ts/recentSongs.ts.
const STORAGE_KEY = "mujam:favorites";

function readAll(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw);
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

function writeAll(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Private browsing / storage disabled — favorites just won't persist.
  }
}

export function isFavorite(songId: string): boolean {
  return readAll().has(songId);
}

/** Toggles the given song and returns whether it's now favorited. */
export function toggleFavorite(songId: string): boolean {
  const all = readAll();
  const wasFavorite = all.has(songId);
  if (wasFavorite) all.delete(songId);
  else all.add(songId);
  writeAll(all);
  return !wasFavorite;
}

export function getFavoriteIds(): string[] {
  return [...readAll()];
}
