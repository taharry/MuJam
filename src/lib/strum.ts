import type { Genre } from "../data/songs";

// Explicit position/stroke/subdivision model — replaces the old bare
// "D"/"U"/"-" string array, which left the beat subdivision implicit in
// the array length. `beat` is the position within one pattern cycle.
export type StrumStroke = "down" | "up" | "rest";

export interface StrumStep {
  beat: number;
  stroke: StrumStroke;
}

export type StrumPatternSource = "song" | "genre" | "default";

export interface StrumPattern {
  source: StrumPatternSource;
  /** Length of one repeat, in beats (usually equal to beatsPerBar). */
  cycleBeats: number;
  /** Steps per beat, e.g. 2 = eighth notes. Informational/authoring aid; positions are read from each step's `beat`. */
  subdivision: number;
  steps: StrumStep[];
  tip: string;
}

export function makePattern(
  source: StrumPatternSource,
  cycleBeats: number,
  subdivision: number,
  strokes: StrumStroke[],
  tip: string
): StrumPattern {
  const stepBeats = 1 / subdivision;
  return {
    source,
    cycleBeats,
    subdivision,
    tip,
    steps: strokes.map((stroke, i) => ({ beat: i * stepBeats, stroke })),
  };
}

const DEFAULT_4_4 = makePattern(
  "default",
  4,
  2,
  ["down", "rest", "down", "up", "rest", "up", "down", "up"],
  "A versatile all-purpose strum. Keep your arm swinging on every eighth note — just miss the strings on the rest beats."
);

const WALTZ_3_4 = makePattern(
  "genre",
  3,
  2,
  ["down", "rest", "down", "up", "down", "up"],
  "Waltz feel: a strong down on beat 1, then a light down-up on beats 2 and 3."
);

const REGGAE = makePattern(
  "genre",
  4,
  2,
  ["rest", "up", "rest", "up", "rest", "up", "rest", "up"],
  "Reggae skank: mute the strings with your fretting hand and accent only the upstrokes, right on the off-beat."
);

const BLUES_SHUFFLE = makePattern(
  "genre",
  4,
  2,
  ["down", "rest", "down", "rest", "down", "rest", "down", "rest"],
  "Shuffle feel: swing the eighth notes (long-short) instead of playing them straight and even."
);

const FUNK = makePattern(
  "genre",
  4,
  2,
  ["down", "rest", "up", "down", "rest", "up", "down", "rest"],
  "Percussive and muted — let the chord ring only briefly after each stroke."
);

const ODD_5 = makePattern(
  "genre",
  5,
  2,
  ["down", "rest", "up", "down", "rest", "up", "down", "rest", "up", "rest"],
  "Odd meter — count it out loud first, it won't feel as even as a normal 4/4 groove."
);

function genericFallback(beatsPerBar: number): StrumPattern {
  const strokes: StrumStroke[] = [];
  for (let i = 0; i < beatsPerBar * 2; i++) strokes.push(i % 2 === 0 ? "down" : "up");
  return makePattern(
    "default",
    beatsPerBar,
    2,
    strokes,
    "Generic eighth-note strum — count it out loud first since this meter isn't a common one."
  );
}

export function getGenreStrumPattern(genre: Genre, beatsPerBar: number): StrumPattern {
  if (beatsPerBar === 3) return WALTZ_3_4;
  if (beatsPerBar === 5) return ODD_5;
  if (beatsPerBar !== 4) return genericFallback(beatsPerBar);
  if (genre === "reggae") return REGGAE;
  if (genre === "blues") return BLUES_SHUFFLE;
  if (genre === "funk") return FUNK;
  return DEFAULT_4_4;
}

// Priority: song-specific pattern, then genre pattern, then generic default.
export function resolveStrumPattern(options: {
  songPattern?: StrumPattern;
  genre: Genre;
  beatsPerBar: number;
}): StrumPattern {
  if (options.songPattern) return { ...options.songPattern, source: "song" };
  return getGenreStrumPattern(options.genre, options.beatsPerBar);
}

// Which step is "now", given a continuous beat position (not just an
// integer beat count) so it stays aligned after seeking mid-cycle.
export function activeStrumStepIndex(patternDef: StrumPattern, beatPosition: number): number {
  if (patternDef.cycleBeats <= 0 || patternDef.steps.length === 0) return -1;
  const pos = ((beatPosition % patternDef.cycleBeats) + patternDef.cycleBeats) % patternDef.cycleBeats;
  let idx = 0;
  for (let i = 0; i < patternDef.steps.length; i++) {
    if (patternDef.steps[i].beat <= pos + 1e-9) idx = i;
    else break;
  }
  return idx;
}
