// Minimal chord-symbol parser + interval tables. Shared by the piano
// renderer (which needs actual pitch classes) and the guitar renderer's
// barre-chord fallback (which needs a semitone offset from a base shape).

export const NOTE_NAMES = [
  "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
] as const;

const FLAT_TO_SHARP: Record<string, string> = {
  Db: "C#", Eb: "D#", Gb: "F#", Ab: "G#", Bb: "A#", Fb: "E", Cb: "B",
};

export type ChordQuality = "major" | "minor" | "7" | "maj7" | "m7" | "sus4" | "sus2" | "dim";

const QUALITY_INTERVALS: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  sus4: [0, 5, 7],
  sus2: [0, 2, 7],
  dim: [0, 3, 6],
};

export interface ParsedChord {
  root: string; // normalized to sharp spelling, e.g. "C#"
  rootIndex: number; // 0-11
  quality: ChordQuality;
}

export function parseChord(symbol: string): ParsedChord | null {
  const match = symbol.match(/^([A-G])(#|b)?(.*)$/);
  if (!match) return null;
  const [, letter, accidental, suffix] = match;
  let root = letter + (accidental ?? "");
  if (FLAT_TO_SHARP[root]) root = FLAT_TO_SHARP[root];
  const rootIndex = NOTE_NAMES.indexOf(root as (typeof NOTE_NAMES)[number]);
  if (rootIndex === -1) return null;

  let quality: ChordQuality;
  if (suffix === "") quality = "major";
  else if (suffix === "m") quality = "minor";
  else if (suffix === "7") quality = "7";
  else if (suffix === "maj7" || suffix === "M7") quality = "maj7";
  else if (suffix === "m7") quality = "m7";
  else if (suffix === "sus4") quality = "sus4";
  else if (suffix === "sus2") quality = "sus2";
  else if (suffix === "dim") quality = "dim";
  // Unrecognized extension (add9, 6, 9, sus, slash chords, ...): report
  // as unsupported instead of silently collapsing it to a major triad.
  else return null;

  return { root, rootIndex, quality };
}

export function getChordNoteIndices(symbol: string): number[] | null {
  const parsed = parseChord(symbol);
  if (!parsed) return null;
  const intervals = QUALITY_INTERVALS[parsed.quality];
  return intervals.map((i) => (parsed.rootIndex + i) % 12);
}

const QUALITY_SUFFIX: Record<ChordQuality, string> = {
  major: "", minor: "m", "7": "7", maj7: "maj7", m7: "m7",
  sus4: "sus4", sus2: "sus2", dim: "dim",
};

// Normalizes any enharmonic spelling (Ab, G#, ...) to one canonical
// sharp-based symbol, so chord-shape dictionaries only need one key
// per pitch instead of a flat/sharp duplicate for each.
export function canonicalizeChordSymbol(symbol: string): string | null {
  const parsed = parseChord(symbol);
  if (!parsed) return null;
  return parsed.root + QUALITY_SUFFIX[parsed.quality];
}

// Shifts a chord's root by semitones while preserving quality/extension
// (minor stays minor, 7ths stay 7ths, etc). Returns null if the symbol
// isn't one parseChord recognizes, so callers can show a clear
// "unsupported" state instead of guessing.
export function transposeChordSymbol(symbol: string, semitones: number): string | null {
  const parsed = parseChord(symbol);
  if (!parsed) return null;
  const newIndex = (((parsed.rootIndex + semitones) % 12) + 12) % 12;
  return NOTE_NAMES[newIndex] + QUALITY_SUFFIX[parsed.quality];
}

export type ScaleMode = "major" | "minor";

const SCALE_INTERVALS: Record<ScaleMode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10], // natural minor
};

export function getScaleNoteIndices(rootIndex: number, mode: ScaleMode): number[] {
  return SCALE_INTERVALS[mode].map((i) => (rootIndex + i) % 12);
}

export interface InferredKey {
  root: string;
  rootIndex: number;
  mode: ScaleMode;
}

// Heuristic key detection, not full harmonic analysis: the chord a song
// spends the most total time on is almost always its tonic, and that's
// enough to suggest a practice scale without hand-tagging a key for
// every song in the library.
export function inferSongKey(events: { chord: string; beats: number }[]): InferredKey | null {
  const weight = new Map<string, { rootIndex: number; mode: ScaleMode; beats: number }>();
  for (const e of events) {
    const parsed = parseChord(e.chord);
    if (!parsed) continue;
    const mode: ScaleMode =
      parsed.quality === "minor" || parsed.quality === "m7" || parsed.quality === "dim" ? "minor" : "major";
    const key = `${parsed.rootIndex}-${mode}`;
    const prev = weight.get(key);
    weight.set(key, { rootIndex: parsed.rootIndex, mode, beats: (prev?.beats ?? 0) + e.beats });
  }
  let best: { rootIndex: number; mode: ScaleMode; beats: number } | null = null;
  for (const v of weight.values()) {
    if (!best || v.beats > best.beats) best = v;
  }
  if (!best) return null;
  return { root: NOTE_NAMES[best.rootIndex], rootIndex: best.rootIndex, mode: best.mode };
}
