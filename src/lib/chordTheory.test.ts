import { describe, expect, it } from "vitest";
import {
  canonicalizeChordSymbol,
  getScaleNoteIndices,
  inferSongKey,
  parseChord,
  transposeChordSymbol,
} from "./chordTheory";

describe("parseChord", () => {
  it("parses recognized qualities", () => {
    expect(parseChord("C")).toMatchObject({ root: "C", quality: "major" });
    expect(parseChord("Am")).toMatchObject({ root: "A", quality: "minor" });
    expect(parseChord("G7")).toMatchObject({ root: "G", quality: "7" });
    expect(parseChord("Dsus4")).toMatchObject({ root: "D", quality: "sus4" });
  });

  it("normalizes flats to their sharp equivalent", () => {
    expect(parseChord("Bb")).toMatchObject({ root: "A#" });
    expect(parseChord("Db")).toMatchObject({ root: "C#" });
  });

  it("returns null for an unrecognized extension instead of guessing", () => {
    expect(parseChord("Cadd9")).toBeNull();
    expect(parseChord("C9")).toBeNull();
    expect(parseChord("C/E")).toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(parseChord("")).toBeNull();
    expect(parseChord("H")).toBeNull();
  });
});

describe("transposeChordSymbol", () => {
  it("shifts the root while preserving quality", () => {
    expect(transposeChordSymbol("C", 2)).toBe("D");
    expect(transposeChordSymbol("Am", 2)).toBe("Bm");
    expect(transposeChordSymbol("G7", 3)).toBe("A#7");
    expect(transposeChordSymbol("Dsus4", 1)).toBe("D#sus4");
  });

  it("wraps around the octave in both directions", () => {
    expect(transposeChordSymbol("B", 1)).toBe("C");
    expect(transposeChordSymbol("C", -1)).toBe("B");
  });

  it("round-trips back to the original after transposing up then down", () => {
    for (const chord of ["C", "F#m", "Bb7", "Dmaj7", "Esus2", "Gdim"]) {
      const up = transposeChordSymbol(chord, 5)!;
      expect(transposeChordSymbol(up, -5)).toBe(canonicalizeChordSymbol(chord));
    }
  });

  it("returns null for unsupported symbols instead of a wrong chord", () => {
    expect(transposeChordSymbol("Cadd9", 2)).toBeNull();
  });
});

describe("getScaleNoteIndices", () => {
  it("produces 7 distinct pitch classes for major and minor", () => {
    const c = 0;
    expect(getScaleNoteIndices(c, "major")).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(getScaleNoteIndices(c, "minor")).toEqual([0, 2, 3, 5, 7, 8, 10]);
  });
});

describe("inferSongKey", () => {
  it("picks the chord with the most total beats as the tonic", () => {
    const key = inferSongKey([
      { chord: "C", beats: 8 },
      { chord: "G", beats: 4 },
      { chord: "Am", beats: 4 },
    ]);
    expect(key).toMatchObject({ root: "C", mode: "major" });
  });

  it("treats minor/m7/dim chords as minor-mode votes", () => {
    const key = inferSongKey([
      { chord: "Am", beats: 8 },
      { chord: "F", beats: 4 },
    ]);
    expect(key).toMatchObject({ root: "A", mode: "minor" });
  });

  it("returns null for an empty or fully-unparseable event list", () => {
    expect(inferSongKey([])).toBeNull();
    expect(inferSongKey([{ chord: "Cadd9", beats: 4 }])).toBeNull();
  });
});
