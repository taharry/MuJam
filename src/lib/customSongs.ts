import { getSongById, type Song } from "../data/songs";

// User-imported songs (from the audio-import workflow) live entirely
// in localStorage — MuJam has no backend. A CustomSong is a regular
// Song with an `importedArrangement`, so it flows through every
// existing page/component (SongDetail, Player, Timeline, ...) unchanged.
const STORAGE_KEY = "mujam:custom-songs";

function readAll(): Song[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(songs: Song[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  } catch {
    // Private browsing / storage full — the import just won't persist.
  }
}

export function listCustomSongs(): Song[] {
  return readAll();
}

export function getCustomSongById(id: string): Song | undefined {
  return readAll().find((s) => s.id === id);
}

export function saveCustomSong(song: Song): void {
  const all = readAll();
  const existingIndex = all.findIndex((s) => s.id === song.id);
  if (existingIndex >= 0) all[existingIndex] = song;
  else all.push(song);
  writeAll(all);
}

export function deleteCustomSong(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function makeCustomSongId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Resolves a song id against the built-in catalog first, then the user's saved imports. */
export function resolveSong(id: string): Song | undefined {
  return getSongById(id) ?? getCustomSongById(id);
}
