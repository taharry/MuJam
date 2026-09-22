import type { Genre } from "./songs";

// Generic strumming-technique guidance (not tied to any specific
// recording) — the same kind of pattern taught in countless beginner
// guitar/ukulele lessons. "D" = downstroke, "U" = upstroke, "-" = skip
// the string but keep your strumming arm moving on that eighth note.
export type StrumSymbol = "D" | "U" | "-";

export interface StrumPattern {
  symbols: StrumSymbol[];
  tip: string;
}

const DEFAULT_4_4: StrumPattern = {
  symbols: ["D", "-", "D", "U", "-", "U", "D", "U"],
  tip: "A versatile all-purpose strum. Keep your arm swinging on every eighth note — just miss the strings on the \"-\" beats.",
};

const WALTZ_3_4: StrumPattern = {
  symbols: ["D", "-", "D", "U", "D", "U"],
  tip: "Waltz feel: a strong down on beat 1, then a light down-up on beats 2 and 3.",
};

const REGGAE: StrumPattern = {
  symbols: ["-", "U", "-", "U", "-", "U", "-", "U"],
  tip: "Reggae skank: mute the strings with your fretting hand and accent only the upstrokes, right on the off-beat.",
};

const BLUES_SHUFFLE: StrumPattern = {
  symbols: ["D", "-", "D", "-", "D", "-", "D", "-"],
  tip: "Shuffle feel: swing the eighth notes (long-short) instead of playing them straight and even.",
};

const FUNK: StrumPattern = {
  symbols: ["D", "-", "U", "D", "-", "U", "D", "-"],
  tip: "Percussive and muted — let the chord ring only briefly after each stroke.",
};

const ODD_METER: StrumPattern = {
  symbols: ["D", "-", "U", "D", "-", "U", "D", "-", "U", "-"],
  tip: "Odd meter — count it out loud first, it won't feel as even as a normal 4/4 groove.",
};

export function getStrumPattern(genre: Genre, beatsPerBar: number): StrumPattern {
  if (beatsPerBar !== 4) {
    if (beatsPerBar === 3) return WALTZ_3_4;
    return ODD_METER;
  }
  if (genre === "reggae") return REGGAE;
  if (genre === "blues") return BLUES_SHUFFLE;
  if (genre === "funk") return FUNK;
  return DEFAULT_4_4;
}
