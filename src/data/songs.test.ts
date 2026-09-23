import { describe, expect, it } from "vitest";
import { SONGS, getArrangement } from "./songs";

describe("getArrangement compatibility adapter", () => {
  it("builds a valid arrangement for every catalog song, simplified unless a verified one was entered", () => {
    for (const song of SONGS) {
      const arr = getArrangement(song);
      expect(arr.source).toBe(song.verifiedArrangement ? "verified" : "simplified");
      expect(arr.events.length).toBeGreaterThan(0);
      expect(arr.totalBeats).toBeGreaterThan(0);
    }
  });

  it("has at least two showcase songs with a verified full arrangement", () => {
    const verified = SONGS.filter((s) => s.verifiedArrangement);
    expect(verified.length).toBeGreaterThanOrEqual(2);
    for (const song of verified) {
      const arr = getArrangement(song);
      // A real showcase, not a one-section loop dressed up as "verified".
      expect(arr.sections.length).toBeGreaterThan(2);
      const uniqueNames = new Set(arr.sections.map((s) => s.name.replace(/ \d+$/, "")));
      expect(uniqueNames.size).toBeGreaterThanOrEqual(3); // e.g. intro/verse/chorus at minimum
    }
  });

  it("marks a song with a verifiedArrangement as verified and flattens it", () => {
    const song = {
      ...SONGS[0],
      sections: [{ name: "Verse", chords: [{ chord: "C", beats: 4 }] }],
      verifiedArrangement: {
        sections: [
          { name: "Intro", chords: [{ chord: "C", beats: 4 }] },
          { name: "Verse", chords: [{ chord: "G", beats: 4 }] },
        ],
      },
    };
    const arr = getArrangement(song);
    expect(arr.source).toBe("verified");
    expect(arr.sections.map((s) => s.name)).toEqual(["Intro", "Verse"]);
  });
});
