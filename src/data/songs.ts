import { buildArrangement, type Arrangement, type SectionBlueprint } from "../lib/arrangement";
import { makePattern, type StrumPattern } from "../lib/strum";

export type Genre =
  | "pop"
  | "rock"
  | "folk"
  | "reggae"
  | "soul"
  | "funk"
  | "jazz"
  | "country"
  | "traditional"
  | "blues"
  | "latin"
  | "kpop"
  | "bollywood"
  | "anime";

export type Difficulty = "easy" | "medium" | "hard";

export interface ChordEvent {
  chord: string;
  beats: number; // duration in beats at the song's bpm
}

export interface Section {
  name: string;
  chords: ChordEvent[];
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  beatsPerBar: number;
  genre: Genre;
  difficulty: Difficulty;
  /** Simplified progression: every song has this. Used unless `verifiedArrangement` is present. */
  sections: Section[];
  /**
   * A carefully entered, section-accurate arrangement for a small set of
   * showcase songs. When present, this is what plays instead of the
   * simplified `sections` above — see getArrangement().
   */
  verifiedArrangement?: { sections: SectionBlueprint[]; expectedTotalBeats?: number };
  /**
   * A user's own corrected draft from the audio-import estimator (see
   * pages/ImportAudio.tsx). Already flattened — unlike the other two
   * arrangement forms, this one skips section authoring entirely since
   * it comes from a saved review/edit pass, not hand-entered structure.
   */
  importedArrangement?: { events: { chord: string; startBeat: number; durationBeats: number }[] };
  /** Recommended strum pattern specific to this song/recording, if one has been entered. */
  strumPattern?: StrumPattern;
  /** YouTube video id for in-app synced playback (not a claim that chords were auto-detected from it). */
  youtubeId?: string;
}

// Builds the shared, flattened playback timeline for a song: an
// imported draft or verified arrangement if either has been entered,
// otherwise the simplified progression. Every consumer (player,
// diagrams, strum guide, timeline, seek controls) should read this
// instead of walking `song.sections` directly, so they can never
// disagree about beat positions.
export function getArrangement(song: Song): Arrangement {
  if (song.importedArrangement) {
    const events = song.importedArrangement.events;
    const totalBeats = events.reduce((max, e) => Math.max(max, e.startBeat + e.durationBeats), 0);
    return {
      source: "imported",
      bpm: song.bpm,
      beatsPerBar: song.beatsPerBar,
      totalBeats,
      events: events.map((e) => ({ ...e, sectionIndex: 0 })),
      sections: [],
    };
  }
  if (song.verifiedArrangement) {
    return buildArrangement({
      source: "verified",
      bpm: song.bpm,
      beatsPerBar: song.beatsPerBar,
      sections: song.verifiedArrangement.sections,
      expectedTotalBeats: song.verifiedArrangement.expectedTotalBeats,
    });
  }
  return buildArrangement({
    source: "simplified",
    bpm: song.bpm,
    beatsPerBar: song.beatsPerBar,
    sections: song.sections.map((s) => ({ name: s.name, chords: s.chords })),
  });
}

// Chord progressions below are commonly published, factual chord
// sequences (no lyrics reproduced) — the same kind of information any
// chord-chart site publishes. Picked for genre/era variety, not tied
// to any one instrument's repertoire.
export const SONGS: Song[] = [
  {
    id: "riptide",
    title: "Riptide",
    artist: "Vance Joy",
    bpm: 100,
    beatsPerBar: 4,
    genre: "folk",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "Am", beats: 4 }, { chord: "G", beats: 4 },
        { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
      ] },
      { name: "Chorus", chords: [
        { chord: "F", beats: 4 }, { chord: "C", beats: 4 },
        { chord: "G", beats: 4 }, { chord: "Am", beats: 4 },
      ] },
    ],
  },
  {
    id: "im-yours",
    title: "I'm Yours",
    artist: "Jason Mraz",
    bpm: 76,
    beatsPerBar: 4,
    genre: "pop",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
        { chord: "Am", beats: 4 }, { chord: "F", beats: 4 },
      ] },
    ],
  },
  {
    id: "somewhere-over-the-rainbow",
    title: "Somewhere Over the Rainbow / What a Wonderful World",
    artist: "Israel Kamakawiwoʻole",
    bpm: 84,
    beatsPerBar: 4,
    genre: "traditional",
    difficulty: "medium",
    sections: [
      { name: "Part 1", chords: [
        { chord: "C", beats: 4 }, { chord: "Em", beats: 4 },
        { chord: "F", beats: 4 }, { chord: "C", beats: 4 },
      ] },
      { name: "Part 2", chords: [
        { chord: "F", beats: 4 }, { chord: "C", beats: 4 },
        { chord: "Am", beats: 4 }, { chord: "F", beats: 2 }, { chord: "G", beats: 2 },
      ] },
    ],
  },
  {
    id: "let-it-be",
    title: "Let It Be",
    artist: "The Beatles",
    bpm: 72,
    beatsPerBar: 4,
    genre: "rock",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
        { chord: "Am", beats: 4 }, { chord: "F", beats: 4 },
      ] },
      { name: "Chorus", chords: [
        { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
        { chord: "F", beats: 4 }, { chord: "C", beats: 4 },
      ] },
    ],
    // Cross-checked against multiple published chord charts (see
    // README's "verified arrangements" note). Condensed to one
    // representative pass through each section rather than the full
    // 6-verse album cut, and omits the bridge/guitar-solo section
    // (whose exact bar count varies across sources) to avoid guessing.
    verifiedArrangement: {
      sections: [
        { id: "lib-verse", name: "Intro", chords: [
          { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
          { chord: "Am", beats: 4 }, { chord: "F", beats: 4 },
          { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
          { chord: "F", beats: 4 }, { chord: "C", beats: 4 },
        ] },
        { name: "Verse 1", ref: "lib-verse" },
        { id: "lib-chorus", name: "Chorus", chords: [
          { chord: "Am", beats: 4 }, { chord: "G", beats: 4 },
          { chord: "F", beats: 4 }, { chord: "C", beats: 4 },
          { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
          { chord: "F", beats: 4 }, { chord: "C", beats: 4 },
        ] },
        { name: "Verse 2", ref: "lib-verse" },
        { name: "Chorus", ref: "lib-chorus" },
        { name: "Verse 3", ref: "lib-verse" },
        { name: "Chorus", ref: "lib-chorus" },
        { name: "Outro", chords: [
          { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
          { chord: "F", beats: 4 }, { chord: "C", beats: 8 },
        ] },
      ],
    },
    strumPattern: makePattern(
      "song",
      4,
      2,
      ["down", "rest", "rest", "up", "down", "rest", "rest", "up"],
      "A gentle, spacious ballad strum — let each chord ring out; the up-strokes are soft pickups into the next downbeat."
    ),
    // The Beatles' official "Let It Be" video — for in-app synced
    // playback only, not a claim that its chords were detected from it.
    youtubeId: "CGj85pVzRJs",
  },
  {
    id: "stand-by-me",
    title: "Stand By Me",
    artist: "Ben E. King",
    bpm: 118,
    beatsPerBar: 4,
    genre: "soul",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "A", beats: 4 }, { chord: "F#m", beats: 4 },
        { chord: "D", beats: 4 }, { chord: "E", beats: 4 },
      ] },
    ],
  },
  {
    id: "perfect",
    title: "Perfect",
    artist: "Ed Sheeran",
    bpm: 63,
    beatsPerBar: 4,
    genre: "pop",
    difficulty: "medium",
    sections: [
      { name: "Verse", chords: [
        { chord: "G", beats: 4 }, { chord: "Em", beats: 4 },
        { chord: "C", beats: 4 }, { chord: "D", beats: 4 },
      ] },
    ],
  },
  {
    id: "count-on-me",
    title: "Count On Me",
    artist: "Bruno Mars",
    bpm: 121,
    beatsPerBar: 4,
    genre: "pop",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "C", beats: 4 }, { chord: "Em", beats: 4 },
        { chord: "F", beats: 4 }, { chord: "C", beats: 4 },
      ] },
      { name: "Chorus", chords: [
        { chord: "F", beats: 4 }, { chord: "G", beats: 4 },
        { chord: "Em", beats: 4 }, { chord: "Am", beats: 4 },
      ] },
    ],
  },
  {
    id: "happy-birthday",
    title: "Happy Birthday",
    artist: "Traditional",
    bpm: 100,
    beatsPerBar: 3,
    genre: "traditional",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "C", beats: 3 }, { chord: "G7", beats: 3 }, { chord: "C", beats: 3 },
        { chord: "F", beats: 3 }, { chord: "C", beats: 3 }, { chord: "G7", beats: 3 }, { chord: "C", beats: 3 },
      ] },
    ],
  },
  {
    id: "wonderwall",
    title: "Wonderwall",
    artist: "Oasis",
    bpm: 87,
    beatsPerBar: 4,
    genre: "rock",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "Em", beats: 4 }, { chord: "G", beats: 4 },
        { chord: "D", beats: 4 }, { chord: "A", beats: 4 },
      ] },
      { name: "Chorus", chords: [
        { chord: "C", beats: 4 }, { chord: "D", beats: 4 },
        { chord: "Em", beats: 4 }, { chord: "Em", beats: 4 },
      ] },
    ],
    // Cross-checked against multiple published chord charts. Uses the
    // recording's actual chords (Em7/Dsus4/A7sus4/Cadd9), not the
    // simplified Em/D/A/C above — including Cadd9, which this app's
    // chord vocabulary doesn't support yet, so it deliberately renders
    // as "Unsupported chord" rather than being silently swapped for a
    // plain C. Pre-chorus is condensed to one representative pass
    // rather than the full repeat count, and a low-confidence passing
    // chord (a slash chord noted on some charts) is omitted.
    verifiedArrangement: {
      sections: [
        { id: "ww-vamp", name: "Intro", chords: [
          { chord: "Em7", beats: 4 }, { chord: "G", beats: 4 },
          { chord: "Dsus4", beats: 4 }, { chord: "A7sus4", beats: 4 },
        ], repeat: 4 },
        { name: "Verse 1", ref: "ww-vamp", repeat: 2 },
        { id: "ww-prechorus", name: "Pre-Chorus", chords: [
          { chord: "Cadd9", beats: 4 }, { chord: "Dsus4", beats: 4 },
          { chord: "Em7", beats: 4 }, { chord: "Em7", beats: 4 },
        ], repeat: 2 },
        { id: "ww-chorus", name: "Chorus", chords: [
          { chord: "Cadd9", beats: 4 }, { chord: "Em7", beats: 4 },
          { chord: "G", beats: 4 }, { chord: "Em", beats: 4 },
        ], repeat: 3 },
        { name: "Verse 2", ref: "ww-vamp", repeat: 2 },
        { name: "Pre-Chorus", ref: "ww-prechorus", repeat: 2 },
        { name: "Chorus", ref: "ww-chorus", repeat: 4 },
        { name: "Outro", chords: [
          { chord: "Cadd9", beats: 4 }, { chord: "Em7", beats: 4 },
          { chord: "G", beats: 4 }, { chord: "Em", beats: 4 },
        ], repeat: 2 },
      ],
    },
    strumPattern: makePattern(
      "song",
      4,
      2,
      ["down", "rest", "down", "up", "up", "down", "up", "rest"],
      "The famous \"D D U U D U\" Wonderwall strum — a syncopated six-stroke pattern taught identically in most tutorials."
    ),
    // Oasis's official "Wonderwall" video — for in-app synced playback
    // only, not a claim that its chords were detected from it.
    youtubeId: "bx1Bh8ZvH84",
  },
  {
    id: "someone-like-you",
    title: "Someone Like You",
    artist: "Adele",
    bpm: 67,
    beatsPerBar: 4,
    genre: "soul",
    difficulty: "medium",
    sections: [
      { name: "Verse", chords: [
        { chord: "A", beats: 4 }, { chord: "E", beats: 4 },
        { chord: "F#m", beats: 4 }, { chord: "D", beats: 4 },
      ] },
    ],
  },
  {
    id: "hey-soul-sister",
    title: "Hey, Soul Sister",
    artist: "Train",
    bpm: 97,
    beatsPerBar: 4,
    genre: "pop",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "D", beats: 4 }, { chord: "A", beats: 4 },
        { chord: "Bm", beats: 4 }, { chord: "G", beats: 4 },
      ] },
    ],
  },
  {
    id: "sweet-home-alabama",
    title: "Sweet Home Alabama",
    artist: "Lynyrd Skynyrd",
    bpm: 98,
    beatsPerBar: 4,
    genre: "rock",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "D", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
      ] },
    ],
  },
  {
    id: "brown-eyed-girl",
    title: "Brown Eyed Girl",
    artist: "Van Morrison",
    bpm: 148,
    beatsPerBar: 4,
    genre: "rock",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "G", beats: 4 }, { chord: "C", beats: 4 },
        { chord: "G", beats: 4 }, { chord: "D", beats: 4 },
      ] },
    ],
  },
  {
    id: "three-little-birds",
    title: "Three Little Birds",
    artist: "Bob Marley",
    bpm: 76,
    beatsPerBar: 4,
    genre: "reggae",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "A", beats: 4 }, { chord: "D", beats: 4 }, { chord: "E", beats: 4 },
      ] },
    ],
  },
  {
    id: "knockin-on-heavens-door",
    title: "Knockin' on Heaven's Door",
    artist: "Bob Dylan",
    bpm: 72,
    beatsPerBar: 4,
    genre: "folk",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "G", beats: 4 }, { chord: "D", beats: 4 },
        { chord: "Am", beats: 4 }, { chord: "C", beats: 4 },
      ] },
    ],
  },
  {
    id: "no-woman-no-cry",
    title: "No Woman, No Cry",
    artist: "Bob Marley",
    bpm: 74,
    beatsPerBar: 4,
    genre: "reggae",
    difficulty: "medium",
    sections: [
      { name: "Verse", chords: [
        { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
        { chord: "Am", beats: 4 }, { chord: "F", beats: 4 },
      ] },
      { name: "Chorus", chords: [
        { chord: "C", beats: 4 }, { chord: "F", beats: 4 },
        { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
      ] },
    ],
  },
  {
    id: "wagon-wheel",
    title: "Wagon Wheel",
    artist: "Old Crow Medicine Show",
    bpm: 78,
    beatsPerBar: 4,
    genre: "country",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "G", beats: 4 }, { chord: "D", beats: 4 },
        { chord: "Em", beats: 4 }, { chord: "C", beats: 4 },
      ] },
    ],
  },
  {
    id: "horse-with-no-name",
    title: "A Horse with No Name",
    artist: "America",
    bpm: 122,
    beatsPerBar: 4,
    genre: "folk",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "Em", beats: 4 }, { chord: "D", beats: 4 },
      ] },
    ],
  },
  {
    id: "ho-hey",
    title: "Ho Hey",
    artist: "The Lumineers",
    bpm: 74,
    beatsPerBar: 4,
    genre: "folk",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "C", beats: 4 }, { chord: "Am", beats: 4 },
        { chord: "F", beats: 4 }, { chord: "G", beats: 4 },
      ] },
    ],
  },
  {
    id: "budapest",
    title: "Budapest",
    artist: "George Ezra",
    bpm: 132,
    beatsPerBar: 4,
    genre: "folk",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
        { chord: "Am", beats: 4 }, { chord: "F", beats: 4 },
      ] },
    ],
  },
  {
    id: "chasing-cars",
    title: "Chasing Cars",
    artist: "Snow Patrol",
    bpm: 104,
    beatsPerBar: 4,
    genre: "rock",
    difficulty: "medium",
    sections: [
      { name: "Verse", chords: [
        { chord: "A", beats: 4 }, { chord: "E", beats: 4 },
        { chord: "F#m", beats: 4 }, { chord: "D", beats: 4 },
      ] },
    ],
  },
  {
    id: "hallelujah",
    title: "Hallelujah",
    artist: "Leonard Cohen",
    bpm: 60,
    beatsPerBar: 4,
    genre: "folk",
    difficulty: "medium",
    sections: [
      { name: "Verse", chords: [
        { chord: "C", beats: 4 }, { chord: "Am", beats: 4 },
        { chord: "C", beats: 4 }, { chord: "Am", beats: 4 },
      ] },
      { name: "Turn", chords: [
        { chord: "F", beats: 4 }, { chord: "G", beats: 4 },
        { chord: "Em", beats: 4 }, { chord: "Am", beats: 4 },
      ] },
    ],
  },
  {
    id: "i-will-survive",
    title: "I Will Survive",
    artist: "Gloria Gaynor",
    bpm: 116,
    beatsPerBar: 4,
    genre: "soul",
    difficulty: "hard",
    sections: [
      { name: "Verse", chords: [
        { chord: "Am", beats: 4 }, { chord: "Dm", beats: 4 },
        { chord: "G", beats: 4 }, { chord: "C", beats: 4 },
      ] },
      { name: "Turnaround", chords: [
        { chord: "F", beats: 4 }, { chord: "Dm", beats: 4 },
        { chord: "E7", beats: 4 }, { chord: "Am", beats: 4 },
      ] },
    ],
  },
  {
    id: "stay-with-me",
    title: "Stay with Me",
    artist: "Sam Smith",
    bpm: 84,
    beatsPerBar: 4,
    genre: "soul",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 },
      ] },
    ],
  },
  {
    id: "all-of-me",
    title: "All of Me",
    artist: "John Legend",
    bpm: 63,
    beatsPerBar: 4,
    genre: "soul",
    difficulty: "medium",
    sections: [
      { name: "Verse", chords: [
        { chord: "Fm", beats: 4 }, { chord: "Ab", beats: 4 },
        { chord: "Eb", beats: 4 }, { chord: "Bb", beats: 4 },
      ] },
    ],
  },
  {
    id: "just-the-way-you-are",
    title: "Just the Way You Are",
    artist: "Bruno Mars",
    bpm: 109,
    beatsPerBar: 4,
    genre: "pop",
    difficulty: "medium",
    sections: [
      { name: "Verse", chords: [
        { chord: "Eb", beats: 4 }, { chord: "Cm", beats: 4 },
        { chord: "Ab", beats: 4 }, { chord: "Bb", beats: 4 },
      ] },
    ],
  },
  {
    id: "halo",
    title: "Halo",
    artist: "Beyoncé",
    bpm: 80,
    beatsPerBar: 4,
    genre: "pop",
    difficulty: "medium",
    sections: [
      { name: "Verse", chords: [
        { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
        { chord: "Am", beats: 4 }, { chord: "F", beats: 4 },
      ] },
    ],
  },
  {
    id: "someone-you-loved",
    title: "Someone You Loved",
    artist: "Lewis Capaldi",
    bpm: 110,
    beatsPerBar: 4,
    genre: "pop",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "Am", beats: 4 }, { chord: "F", beats: 4 },
        { chord: "C", beats: 4 }, { chord: "G", beats: 4 },
      ] },
    ],
  },
  {
    id: "photograph",
    title: "Photograph",
    artist: "Ed Sheeran",
    bpm: 108,
    beatsPerBar: 4,
    genre: "pop",
    difficulty: "medium",
    sections: [
      { name: "Verse", chords: [
        { chord: "G", beats: 4 }, { chord: "D", beats: 4 },
        { chord: "Em", beats: 4 }, { chord: "C", beats: 4 },
      ] },
    ],
  },
  {
    id: "africa",
    title: "Africa",
    artist: "Toto",
    bpm: 92,
    beatsPerBar: 4,
    genre: "rock",
    difficulty: "hard",
    sections: [
      { name: "Chorus", chords: [
        { chord: "F", beats: 4 }, { chord: "Gm", beats: 4 },
        { chord: "Bb", beats: 4 }, { chord: "C", beats: 4 },
      ] },
    ],
  },
  {
    id: "piano-man",
    title: "Piano Man",
    artist: "Billy Joel",
    bpm: 88,
    beatsPerBar: 3,
    genre: "folk",
    difficulty: "medium",
    sections: [
      { name: "Verse", chords: [
        { chord: "C", beats: 3 }, { chord: "Am", beats: 3 },
        { chord: "F", beats: 3 }, { chord: "C", beats: 3 },
      ] },
      { name: "Turn", chords: [
        { chord: "F", beats: 3 }, { chord: "G", beats: 3 }, { chord: "C", beats: 3 },
      ] },
    ],
  },
  {
    id: "redbone",
    title: "Redbone",
    artist: "Childish Gambino",
    bpm: 76,
    beatsPerBar: 4,
    genre: "funk",
    difficulty: "medium",
    sections: [
      { name: "Groove", chords: [
        { chord: "Dm", beats: 4 }, { chord: "Gm", beats: 4 },
        { chord: "C", beats: 4 }, { chord: "F", beats: 4 },
      ] },
    ],
  },
  {
    id: "havana",
    title: "Havana",
    artist: "Camila Cabello",
    bpm: 105,
    beatsPerBar: 4,
    genre: "pop",
    difficulty: "easy",
    sections: [
      { name: "Verse", chords: [
        { chord: "Em", beats: 4 }, { chord: "C", beats: 4 },
        { chord: "G", beats: 4 }, { chord: "D", beats: 4 },
      ] },
    ],
  },
  {
    id: "thinking-out-loud",
    title: "Thinking Out Loud",
    artist: "Ed Sheeran",
    bpm: 79,
    beatsPerBar: 4,
    genre: "soul",
    difficulty: "medium",
    sections: [
      { name: "Verse", chords: [
        { chord: "D", beats: 4 }, { chord: "F#m", beats: 4 },
        { chord: "G", beats: 4 }, { chord: "A", beats: 4 },
      ] },
    ],
  },
  {
    id: "fly-me-to-the-moon",
    title: "Fly Me to the Moon",
    artist: "Bart Howard (jazz standard)",
    bpm: 120,
    beatsPerBar: 4,
    genre: "jazz",
    difficulty: "hard",
    sections: [
      { name: "A", chords: [
        { chord: "Am", beats: 4 }, { chord: "Dm", beats: 4 },
        { chord: "G7", beats: 4 }, { chord: "Cmaj7", beats: 4 },
      ] },
      { name: "B", chords: [
        { chord: "Fmaj7", beats: 4 }, { chord: "Dm", beats: 4 },
        { chord: "E7", beats: 4 }, { chord: "Am", beats: 4 },
      ] },
    ],
  },

  // --- Pop ---
  { id: "shape-of-you", title: "Shape of You", artist: "Ed Sheeran", bpm: 96, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "blinding-lights", title: "Blinding Lights", artist: "The Weeknd", bpm: 171, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Fm", beats: 4 }, { chord: "Ab", beats: 4 }, { chord: "Eb", beats: 4 }, { chord: "Bb", beats: 4 }] },
  ] },
  { id: "bad-guy", title: "Bad Guy", artist: "Billie Eilish", bpm: 135, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "Bb", beats: 4 }] },
  ] },
  { id: "levitating", title: "Levitating", artist: "Dua Lipa", bpm: 103, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "A", beats: 4 }] },
  ] },
  { id: "watermelon-sugar", title: "Watermelon Sugar", artist: "Harry Styles", bpm: 95, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "cant-stop-the-feeling", title: "Can't Stop the Feeling!", artist: "Justin Timberlake", bpm: 113, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "firework", title: "Firework", artist: "Katy Perry", bpm: 124, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "rolling-in-the-deep", title: "Rolling in the Deep", artist: "Adele", bpm: 105, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Cm", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "Ab", beats: 4 }, { chord: "Bb", beats: 4 }] },
  ] },
  { id: "shake-it-off", title: "Shake It Off", artist: "Taylor Swift", bpm: 160, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "sunflower", title: "Sunflower", artist: "Post Malone & Swae Lee", bpm: 90, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "A", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "old-town-road", title: "Old Town Road", artist: "Lil Nas X", bpm: 136, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "drivers-license", title: "drivers license", artist: "Olivia Rodrigo", bpm: 144, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },

  // --- Rock ---
  { id: "smoke-on-the-water", title: "Smoke on the Water", artist: "Deep Purple", bpm: 112, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Riff", chords: [{ chord: "G", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "sweet-child-o-mine", title: "Sweet Child O' Mine", artist: "Guns N' Roses", bpm: 125, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Intro", chords: [{ chord: "D", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "livin-on-a-prayer", title: "Livin' on a Prayer", artist: "Bon Jovi", bpm: 122, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
    { name: "Chorus", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "hotel-california", title: "Hotel California", artist: "Eagles", bpm: 74, beatsPerBar: 4, genre: "rock", difficulty: "hard", sections: [
    { name: "Verse", chords: [
      { chord: "Bm", beats: 4 }, { chord: "F#", beats: 4 }, { chord: "A", beats: 4 }, { chord: "E", beats: 4 },
      { chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "F#", beats: 4 },
    ] },
  ] },
  { id: "take-it-easy", title: "Take It Easy", artist: "Eagles", bpm: 136, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "every-breath-you-take", title: "Every Breath You Take", artist: "The Police", bpm: 117, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "A", beats: 4 }, { chord: "F#m", beats: 4 }, { chord: "D", beats: 4 }, { chord: "E", beats: 4 }] },
  ] },
  { id: "zombie", title: "Zombie", artist: "The Cranberries", bpm: 84, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "boulevard-of-broken-dreams", title: "Boulevard of Broken Dreams", artist: "Green Day", bpm: 84, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "A", beats: 4 }] },
  ] },
  { id: "under-the-bridge", title: "Under the Bridge", artist: "Red Hot Chili Peppers", bpm: 86, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "E", beats: 4 }, { chord: "B", beats: 4 }, { chord: "C#m", beats: 4 }, { chord: "A", beats: 4 }] },
  ] },
  { id: "creep", title: "Creep", artist: "Radiohead", bpm: 92, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "B", beats: 4 }, { chord: "C", beats: 4 }, { chord: "Cm", beats: 4 }] },
  ] },
  { id: "blackbird", title: "Blackbird", artist: "The Beatles", bpm: 96, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "here-comes-the-sun", title: "Here Comes the Sun", artist: "The Beatles", bpm: 129, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "A", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "free-fallin", title: "Free Fallin'", artist: "Tom Petty", bpm: 97, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "D", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "good-riddance", title: "Good Riddance (Time of Your Life)", artist: "Green Day", bpm: 132, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }] },
  ] },

  // --- Folk ---
  { id: "sound-of-silence", title: "The Sound of Silence", artist: "Simon & Garfunkel", bpm: 106, beatsPerBar: 4, genre: "folk", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "blowin-in-the-wind", title: "Blowin' in the Wind", artist: "Bob Dylan", bpm: 105, beatsPerBar: 4, genre: "folk", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }] },
  ] },
  { id: "leaving-on-a-jet-plane", title: "Leaving on a Jet Plane", artist: "John Denver", bpm: 92, beatsPerBar: 4, genre: "folk", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "the-boxer", title: "The Boxer", artist: "Simon & Garfunkel", bpm: 105, beatsPerBar: 4, genre: "folk", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "G", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "fast-car", title: "Fast Car", artist: "Tracy Chapman", bpm: 103, beatsPerBar: 4, genre: "folk", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "D", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "landslide", title: "Landslide", artist: "Fleetwood Mac", bpm: 82, beatsPerBar: 4, genre: "folk", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "ripple", title: "Ripple", artist: "Grateful Dead", bpm: 100, beatsPerBar: 4, genre: "folk", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "norwegian-wood", title: "Norwegian Wood", artist: "The Beatles", bpm: 105, beatsPerBar: 4, genre: "folk", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "E", beats: 4 }, { chord: "D", beats: 4 }, { chord: "A", beats: 4 }] },
  ] },

  // --- Reggae ---
  { id: "one-love", title: "One Love", artist: "Bob Marley", bpm: 79, beatsPerBar: 4, genre: "reggae", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Am", beats: 4 }] },
  ] },
  { id: "is-this-love", title: "Is This Love", artist: "Bob Marley", bpm: 79, beatsPerBar: 4, genre: "reggae", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "A", beats: 4 }, { chord: "D", beats: 4 }, { chord: "E", beats: 4 }] },
  ] },
  { id: "buffalo-soldier", title: "Buffalo Soldier", artist: "Bob Marley", bpm: 85, beatsPerBar: 4, genre: "reggae", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "G", beats: 4 }, { chord: "F", beats: 4 }, { chord: "E", beats: 4 }] },
  ] },
  { id: "jamming", title: "Jamming", artist: "Bob Marley", bpm: 111, beatsPerBar: 4, genre: "reggae", difficulty: "easy", sections: [
    { name: "Groove", chords: [{ chord: "Am", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "red-red-wine", title: "Red Red Wine", artist: "UB40", bpm: 84, beatsPerBar: 4, genre: "reggae", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "waiting-in-vain", title: "Waiting in Vain", artist: "Bob Marley", bpm: 92, beatsPerBar: 4, genre: "reggae", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Am", beats: 4 }] },
  ] },
  { id: "could-you-be-loved", title: "Could You Be Loved", artist: "Bob Marley", bpm: 100, beatsPerBar: 4, genre: "reggae", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Bm", beats: 4 }] },
  ] },
  { id: "stir-it-up", title: "Stir It Up", artist: "Bob Marley", bpm: 82, beatsPerBar: 4, genre: "reggae", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "A", beats: 4 }, { chord: "D", beats: 4 }, { chord: "E", beats: 4 }] },
  ] },

  // --- Soul / R&B ---
  { id: "aint-no-sunshine", title: "Ain't No Sunshine", artist: "Bill Withers", bpm: 79, beatsPerBar: 4, genre: "soul", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "lean-on-me", title: "Lean on Me", artist: "Bill Withers", bpm: 78, beatsPerBar: 4, genre: "soul", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Am", beats: 4 }] },
  ] },
  { id: "lets-stay-together", title: "Let's Stay Together", artist: "Al Green", bpm: 108, beatsPerBar: 4, genre: "soul", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "my-girl", title: "My Girl", artist: "The Temptations", bpm: 104, beatsPerBar: 4, genre: "soul", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "killing-me-softly", title: "Killing Me Softly with His Song", artist: "Roberta Flack", bpm: 82, beatsPerBar: 4, genre: "soul", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "G", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "at-last", title: "At Last", artist: "Etta James", bpm: 63, beatsPerBar: 4, genre: "soul", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "Gm", beats: 4 }, { chord: "C7", beats: 4 }] },
  ] },
  { id: "i-want-you-back", title: "I Want You Back", artist: "The Jackson 5", bpm: 121, beatsPerBar: 4, genre: "soul", difficulty: "medium", sections: [
    { name: "Groove", chords: [{ chord: "Fm", beats: 4 }, { chord: "Ab", beats: 4 }, { chord: "Eb", beats: 4 }, { chord: "Bb", beats: 4 }] },
  ] },
  { id: "signed-sealed-delivered", title: "Signed, Sealed, Delivered I'm Yours", artist: "Stevie Wonder", bpm: 105, beatsPerBar: 4, genre: "soul", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Eb", beats: 4 }, { chord: "Ab", beats: 4 }, { chord: "Bb", beats: 4 }] },
  ] },

  // --- Funk ---
  { id: "superstition", title: "Superstition", artist: "Stevie Wonder", bpm: 100, beatsPerBar: 4, genre: "funk", difficulty: "medium", sections: [
    { name: "Groove", chords: [{ chord: "Em", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "september", title: "September", artist: "Earth, Wind & Fire", bpm: 126, beatsPerBar: 4, genre: "funk", difficulty: "medium", sections: [
    { name: "Groove", chords: [{ chord: "F#m", beats: 4 }, { chord: "B", beats: 4 }, { chord: "E", beats: 4 }, { chord: "A", beats: 4 }] },
  ] },
  { id: "play-that-funky-music", title: "Play That Funky Music", artist: "Wild Cherry", bpm: 106, beatsPerBar: 4, genre: "funk", difficulty: "easy", sections: [
    { name: "Groove", chords: [{ chord: "Em", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "D", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "give-up-the-funk", title: "Give Up the Funk (Tear the Roof off the Sucker)", artist: "Parliament", bpm: 104, beatsPerBar: 4, genre: "funk", difficulty: "medium", sections: [
    { name: "Groove", chords: [{ chord: "Bm", beats: 4 }, { chord: "Em", beats: 4 }] },
  ] },
  { id: "le-freak", title: "Le Freak", artist: "Chic", bpm: 120, beatsPerBar: 4, genre: "funk", difficulty: "medium", sections: [
    { name: "Groove", chords: [{ chord: "Fm", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "Eb", beats: 4 }] },
  ] },
  { id: "good-times", title: "Good Times", artist: "Chic", bpm: 111, beatsPerBar: 4, genre: "funk", difficulty: "medium", sections: [
    { name: "Groove", chords: [{ chord: "Bm", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "F#m", beats: 4 }] },
  ] },
  { id: "kiss", title: "Kiss", artist: "Prince", bpm: 111, beatsPerBar: 4, genre: "funk", difficulty: "easy", sections: [
    { name: "Groove", chords: [{ chord: "A", beats: 4 }, { chord: "D", beats: 4 }, { chord: "E", beats: 4 }] },
  ] },

  // --- Jazz ---
  { id: "summertime", title: "Summertime", artist: "George Gershwin (jazz standard)", bpm: 90, beatsPerBar: 4, genre: "jazz", difficulty: "medium", sections: [
    { name: "A", chords: [{ chord: "Am", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "E7", beats: 4 }] },
  ] },
  { id: "take-five", title: "Take Five", artist: "Dave Brubeck (jazz standard)", bpm: 176, beatsPerBar: 5, genre: "jazz", difficulty: "hard", sections: [
    { name: "A", chords: [{ chord: "Ebm", beats: 5 }, { chord: "Bbm", beats: 5 }, { chord: "Ebm", beats: 5 }, { chord: "Bbm", beats: 5 }] },
  ] },
  { id: "georgia-on-my-mind", title: "Georgia on My Mind", artist: "Hoagy Carmichael (jazz standard)", bpm: 88, beatsPerBar: 4, genre: "jazz", difficulty: "medium", sections: [
    { name: "A", chords: [{ chord: "C", beats: 4 }, { chord: "E7", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "blue-bossa", title: "Blue Bossa", artist: "Kenny Dorham (jazz standard)", bpm: 130, beatsPerBar: 4, genre: "jazz", difficulty: "hard", sections: [
    { name: "A", chords: [{ chord: "Cm", beats: 4 }, { chord: "Fm", beats: 4 }, { chord: "G7", beats: 4 }, { chord: "Eb", beats: 4 } ] },
    { name: "B", chords: [{ chord: "Ab", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "G7", beats: 4 }, { chord: "Cm", beats: 4 }] },
  ] },
  { id: "autumn-leaves", title: "Autumn Leaves", artist: "Joseph Kosma (jazz standard)", bpm: 110, beatsPerBar: 4, genre: "jazz", difficulty: "hard", sections: [
    { name: "A", chords: [{ chord: "Cm", beats: 4 }, { chord: "F", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "Eb", beats: 4 }] },
    { name: "B", chords: [{ chord: "Am", beats: 4 }, { chord: "D7", beats: 4 }, { chord: "Gm", beats: 4 }] },
  ] },
  { id: "my-funny-valentine", title: "My Funny Valentine", artist: "Rodgers & Hart (jazz standard)", bpm: 66, beatsPerBar: 4, genre: "jazz", difficulty: "hard", sections: [
    { name: "A", chords: [{ chord: "Cm", beats: 4 }, { chord: "Ab", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "G7", beats: 4 }] },
  ] },

  // --- Country ---
  { id: "country-roads", title: "Take Me Home, Country Roads", artist: "John Denver", bpm: 94, beatsPerBar: 4, genre: "country", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "jolene", title: "Jolene", artist: "Dolly Parton", bpm: 78, beatsPerBar: 4, genre: "country", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "ring-of-fire", title: "Ring of Fire", artist: "Johnny Cash", bpm: 156, beatsPerBar: 4, genre: "country", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "friends-in-low-places", title: "Friends in Low Places", artist: "Garth Brooks", bpm: 132, beatsPerBar: 4, genre: "country", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }] },
  ] },
  { id: "the-gambler", title: "The Gambler", artist: "Kenny Rogers", bpm: 96, beatsPerBar: 4, genre: "country", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }] },
  ] },
  { id: "should-have-been-a-cowboy", title: "Should've Been a Cowboy", artist: "Toby Keith", bpm: 122, beatsPerBar: 4, genre: "country", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "i-walk-the-line", title: "I Walk the Line", artist: "Johnny Cash", bpm: 120, beatsPerBar: 4, genre: "country", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "E", beats: 4 }, { chord: "A", beats: 4 }, { chord: "B7", beats: 4 }] },
  ] },
  { id: "chicken-fried", title: "Chicken Fried", artist: "Zac Brown Band", bpm: 100, beatsPerBar: 4, genre: "country", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "tennessee-whiskey", title: "Tennessee Whiskey", artist: "Chris Stapleton", bpm: 53, beatsPerBar: 4, genre: "country", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "before-he-cheats", title: "Before He Cheats", artist: "Carrie Underwood", bpm: 118, beatsPerBar: 4, genre: "country", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },

  // --- Traditional ---
  { id: "twinkle-twinkle", title: "Twinkle, Twinkle, Little Star", artist: "Traditional", bpm: 100, beatsPerBar: 4, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "amazing-grace", title: "Amazing Grace", artist: "Traditional", bpm: 78, beatsPerBar: 3, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 3 }, { chord: "C", beats: 3 }, { chord: "G", beats: 3 }, { chord: "D", beats: 3 }] },
  ] },
  { id: "auld-lang-syne", title: "Auld Lang Syne", artist: "Traditional", bpm: 84, beatsPerBar: 4, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }] },
  ] },
  { id: "you-are-my-sunshine", title: "You Are My Sunshine", artist: "Traditional", bpm: 104, beatsPerBar: 4, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "oh-susanna", title: "Oh! Susanna", artist: "Traditional", bpm: 112, beatsPerBar: 4, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "this-land-is-your-land", title: "This Land Is Your Land", artist: "Traditional", bpm: 100, beatsPerBar: 4, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "kumbaya", title: "Kumbaya", artist: "Traditional", bpm: 88, beatsPerBar: 4, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "silent-night", title: "Silent Night", artist: "Traditional", bpm: 88, beatsPerBar: 3, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 3 }, { chord: "F", beats: 3 }, { chord: "G", beats: 3 }, { chord: "C", beats: 3 }] },
  ] },
  { id: "jingle-bells", title: "Jingle Bells", artist: "Traditional", bpm: 120, beatsPerBar: 4, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G7", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "we-wish-you-a-merry-christmas", title: "We Wish You a Merry Christmas", artist: "Traditional", bpm: 116, beatsPerBar: 3, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 3 }, { chord: "Bb", beats: 3 }, { chord: "C", beats: 3 }, { chord: "F", beats: 3 }] },
  ] },

  // --- Blues ---
  { id: "sweet-home-chicago", title: "Sweet Home Chicago", artist: "Robert Johnson (blues standard)", bpm: 120, beatsPerBar: 4, genre: "blues", difficulty: "medium", sections: [
    { name: "12-Bar", chords: [{ chord: "E7", beats: 4 }, { chord: "A7", beats: 4 }, { chord: "E7", beats: 4 }, { chord: "B7", beats: 4 }] },
  ] },
  { id: "crossroads", title: "Crossroads", artist: "Robert Johnson (blues standard)", bpm: 96, beatsPerBar: 4, genre: "blues", difficulty: "medium", sections: [
    { name: "12-Bar", chords: [{ chord: "A7", beats: 4 }, { chord: "D7", beats: 4 }, { chord: "A7", beats: 4 }, { chord: "E7", beats: 4 }] },
  ] },
  { id: "pride-and-joy", title: "Pride and Joy", artist: "Stevie Ray Vaughan", bpm: 138, beatsPerBar: 4, genre: "blues", difficulty: "medium", sections: [
    { name: "12-Bar", chords: [{ chord: "E7", beats: 4 }, { chord: "A7", beats: 4 }, { chord: "E7", beats: 4 }, { chord: "B7", beats: 4 }] },
  ] },
  { id: "the-thrill-is-gone", title: "The Thrill Is Gone", artist: "B.B. King", bpm: 100, beatsPerBar: 4, genre: "blues", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "F#m", beats: 4 }] },
  ] },
  { id: "hoochie-coochie-man", title: "Hoochie Coochie Man", artist: "Muddy Waters", bpm: 92, beatsPerBar: 4, genre: "blues", difficulty: "easy", sections: [
    { name: "Groove", chords: [{ chord: "E7", beats: 4 }, { chord: "A7", beats: 4 }] },
  ] },
  { id: "stormy-monday", title: "Stormy Monday", artist: "T-Bone Walker", bpm: 66, beatsPerBar: 4, genre: "blues", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },

  // --- Latin ---
  { id: "girl-from-ipanema", title: "The Girl from Ipanema", artist: "Antônio Carlos Jobim", bpm: 128, beatsPerBar: 4, genre: "latin", difficulty: "medium", sections: [
    { name: "A", chords: [{ chord: "F", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Gm", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "oye-como-va", title: "Oye Como Va", artist: "Tito Puente / Santana", bpm: 95, beatsPerBar: 4, genre: "latin", difficulty: "easy", sections: [
    { name: "Groove", chords: [{ chord: "Am", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "despacito", title: "Despacito", artist: "Luis Fonsi", bpm: 89, beatsPerBar: 4, genre: "latin", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "A", beats: 4 }] },
  ] },
  { id: "la-bamba", title: "La Bamba", artist: "Ritchie Valens", bpm: 148, beatsPerBar: 4, genre: "latin", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "livin-la-vida-loca", title: "Livin' la Vida Loca", artist: "Ricky Martin", bpm: 180, beatsPerBar: 4, genre: "latin", difficulty: "easy", sections: [
    { name: "Groove", chords: [{ chord: "Am", beats: 4 }, { chord: "E7", beats: 4 }] },
  ] },
  { id: "corazon-espinado", title: "Corazón Espinado", artist: "Santana ft. Maná", bpm: 96, beatsPerBar: 4, genre: "latin", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "G", beats: 4 }, { chord: "F", beats: 4 }, { chord: "E", beats: 4 }] },
  ] },
  { id: "waka-waka", title: "Waka Waka (This Time for Africa)", artist: "Shakira", bpm: 98, beatsPerBar: 4, genre: "latin", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "G", beats: 4 }, { chord: "F", beats: 4 }, { chord: "E", beats: 4 }] },
  ] },

  // --- Rock (more classics) ---
  { id: "imagine", title: "Imagine", artist: "John Lennon", bpm: 76, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Cmaj7", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "house-of-the-rising-sun", title: "House of the Rising Sun", artist: "The Animals", bpm: 120, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "F", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "E", beats: 4 }] },
  ] },
  { id: "hey-jude", title: "Hey Jude", artist: "The Beatles", bpm: 74, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "yesterday", title: "Yesterday", artist: "The Beatles", bpm: 96, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "A7", beats: 4 }, { chord: "Dm", beats: 4 }] },
  ] },
  { id: "bridge-over-troubled-water", title: "Bridge Over Troubled Water", artist: "Simon & Garfunkel", bpm: 80, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "wonderful-tonight", title: "Wonderful Tonight", artist: "Eric Clapton", bpm: 85, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }] },
  ] },
  { id: "wish-you-were-here", title: "Wish You Were Here", artist: "Pink Floyd", bpm: 60, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "nothing-else-matters", title: "Nothing Else Matters", artist: "Metallica", bpm: 100, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "D", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "mr-brightside", title: "Mr. Brightside", artist: "The Killers", bpm: 148, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "viva-la-vida", title: "Viva la Vida", artist: "Coldplay", bpm: 138, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Em", beats: 4 }] },
  ] },
  { id: "yellow", title: "Yellow", artist: "Coldplay", bpm: 87, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "clocks", title: "Clocks", artist: "Coldplay", bpm: 131, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Groove", chords: [{ chord: "Eb", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "Fm", beats: 4 }, { chord: "Ab", beats: 4 }] },
  ] },
  { id: "fix-you", title: "Fix You", artist: "Coldplay", bpm: 138, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "in-the-end", title: "In the End", artist: "Linkin Park", bpm: 105, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "D", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "numb", title: "Numb", artist: "Linkin Park", bpm: 110, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "F#m", beats: 4 }, { chord: "D", beats: 4 }, { chord: "A", beats: 4 }, { chord: "E", beats: 4 }] },
  ] },
  { id: "torn", title: "Torn", artist: "Natalie Imbruglia", bpm: 100, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "A", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "all-star", title: "All Star", artist: "Smash Mouth", bpm: 104, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "stairway-to-heaven", title: "Stairway to Heaven", artist: "Led Zeppelin", bpm: 82, beatsPerBar: 4, genre: "rock", difficulty: "hard", sections: [
    { name: "Intro", chords: [{ chord: "Am", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "whiskey-in-the-jar", title: "Whiskey in the Jar", artist: "Traditional (arr. Thin Lizzy)", bpm: 130, beatsPerBar: 4, genre: "folk", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },

  // --- Soul (more) ---
  { id: "aint-no-mountain-high-enough", title: "Ain't No Mountain High Enough", artist: "Marvin Gaye & Tammi Terrell", bpm: 130, beatsPerBar: 4, genre: "soul", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }] },
  ] },
  { id: "youve-lost-that-lovin-feelin", title: "You've Lost That Lovin' Feelin'", artist: "The Righteous Brothers", bpm: 100, beatsPerBar: 4, genre: "soul", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "i-want-it-that-way", title: "I Want It That Way", artist: "Backstreet Boys", bpm: 100, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },

  // --- Movie / Musical themes ---
  { id: "let-it-go", title: "Let It Go", artist: "Idina Menzel (Frozen)", bpm: 138, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "a-whole-new-world", title: "A Whole New World", artist: "Aladdin", bpm: 84, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Bb", beats: 4 }, { chord: "Eb", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "cant-help-falling-in-love", title: "Can't Help Falling in Love", artist: "Elvis Presley", bpm: 88, beatsPerBar: 3, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 3 }, { chord: "Em", beats: 3 }, { chord: "F", beats: 3 }, { chord: "G", beats: 3 }] },
  ] },
  { id: "my-heart-will-go-on", title: "My Heart Will Go On", artist: "Celine Dion (Titanic)", bpm: 100, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "D", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "circle-of-life", title: "Circle of Life", artist: "Elton John (The Lion King)", bpm: 120, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },

  // --- Hip-hop piano crossovers ---
  { id: "empire-state-of-mind", title: "Empire State of Mind", artist: "Jay-Z ft. Alicia Keys", bpm: 94, beatsPerBar: 4, genre: "soul", difficulty: "easy", sections: [
    { name: "Chorus", chords: [{ chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "lose-yourself", title: "Lose Yourself", artist: "Eminem", bpm: 86, beatsPerBar: 4, genre: "soul", difficulty: "easy", sections: [
    { name: "Groove", chords: [{ chord: "Cm", beats: 4 }, { chord: "Fm", beats: 4 }] },
  ] },

  // --- Holiday ---
  { id: "have-yourself-a-merry-little-christmas", title: "Have Yourself a Merry Little Christmas", artist: "Traditional", bpm: 84, beatsPerBar: 4, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "G", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "feliz-navidad", title: "Feliz Navidad", artist: "José Feliciano", bpm: 150, beatsPerBar: 4, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "all-i-want-for-christmas-is-you", title: "All I Want for Christmas Is You", artist: "Mariah Carey", bpm: 150, beatsPerBar: 4, genre: "traditional", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "deck-the-halls", title: "Deck the Halls", artist: "Traditional", bpm: 120, beatsPerBar: 4, genre: "traditional", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },

  // --- K-pop (simplified fan/cover-chart progressions) ---
  { id: "dynamite", title: "Dynamite", artist: "BTS", bpm: 114, beatsPerBar: 4, genre: "kpop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "G", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "butter", title: "Butter", artist: "BTS", bpm: 110, beatsPerBar: 4, genre: "kpop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "A", beats: 4 }, { chord: "C", beats: 4 }] },
    { name: "Chorus", chords: [{ chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }] },
  ] },
  { id: "gangnam-style", title: "Gangnam Style", artist: "PSY", bpm: 132, beatsPerBar: 4, genre: "kpop", difficulty: "easy", sections: [
    { name: "Groove", chords: [{ chord: "Bm", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },

  // --- Major artists, past 3 decades ---
  { id: "smells-like-teen-spirit", title: "Smells Like Teen Spirit", artist: "Nirvana", bpm: 117, beatsPerBar: 4, genre: "rock", difficulty: "hard", sections: [
    { name: "Verse", chords: [{ chord: "F#m", beats: 4 }, { chord: "A", beats: 4 }, { chord: "E", beats: 4 }, { chord: "B", beats: 4 }] },
  ] },
  { id: "ironic", title: "Ironic", artist: "Alanis Morissette", bpm: 137, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }] },
  ] },
  { id: "wannabe", title: "Wannabe", artist: "Spice Girls", bpm: 110, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "baby-one-more-time", title: "...Baby One More Time", artist: "Britney Spears", bpm: 92, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Cm", beats: 4 }, { chord: "Ab", beats: 4 }, { chord: "Eb", beats: 4 }, { chord: "Bb", beats: 4 }] },
  ] },
  { id: "since-u-been-gone", title: "Since U Been Gone", artist: "Kelly Clarkson", bpm: 130, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Cm", beats: 4 }, { chord: "Eb", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "hey-ya", title: "Hey Ya!", artist: "OutKast", bpm: 160, beatsPerBar: 4, genre: "funk", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "she-will-be-loved", title: "She Will Be Loved", artist: "Maroon 5", bpm: 96, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "A", beats: 4 }, { chord: "E", beats: 4 }, { chord: "F#m", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "sugar-were-goin-down", title: "Sugar, We're Goin Down", artist: "Fall Out Boy", bpm: 89, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "complicated", title: "Complicated", artist: "Avril Lavigne", bpm: 79, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "A", beats: 4 }] },
  ] },
  { id: "bad-day", title: "Bad Day", artist: "Daniel Powter", bpm: 138, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "Bb", beats: 4 }] },
  ] },
  { id: "love-story", title: "Love Story", artist: "Taylor Swift", bpm: 119, beatsPerBar: 4, genre: "country", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "D", beats: 4 }, { chord: "A", beats: 4 }, { chord: "Bm", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "marry-you", title: "Marry You", artist: "Bruno Mars", bpm: 144, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "what-makes-you-beautiful", title: "What Makes You Beautiful", artist: "One Direction", bpm: 126, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "radioactive", title: "Radioactive", artist: "Imagine Dragons", bpm: 136, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "A", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "believer", title: "Believer", artist: "Imagine Dragons", bpm: 125, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "D", beats: 4 }, { chord: "A", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "stressed-out", title: "Stressed Out", artist: "twenty one pilots", bpm: 170, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "D", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "good-4-u", title: "good 4 u", artist: "Olivia Rodrigo", bpm: 166, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "A", beats: 4 }, { chord: "E", beats: 4 }, { chord: "F#m", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "as-it-was", title: "As It Was", artist: "Harry Styles", bpm: 174, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "ocean-eyes", title: "Ocean Eyes", artist: "Billie Eilish", bpm: 106, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "dont-start-now", title: "Don't Start Now", artist: "Dua Lipa", bpm: 124, beatsPerBar: 4, genre: "funk", difficulty: "medium", sections: [
    { name: "Groove", chords: [{ chord: "Bm", beats: 4 }, { chord: "A", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "circles", title: "Circles", artist: "Post Malone", bpm: 120, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "counting-stars", title: "Counting Stars", artist: "OneRepublic", bpm: 122, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "demons", title: "Demons", artist: "Imagine Dragons", bpm: 90, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "thunder", title: "Thunder", artist: "Imagine Dragons", bpm: 168, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Cm", beats: 4 }, { chord: "Ab", beats: 4 }, { chord: "Eb", beats: 4 }, { chord: "Bb", beats: 4 }] },
  ] },
  { id: "shallow", title: "Shallow", artist: "Lady Gaga & Bradley Cooper", bpm: 95, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "royals", title: "Royals", artist: "Lorde", bpm: 85, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "cant-feel-my-face", title: "Can't Feel My Face", artist: "The Weeknd", bpm: 108, beatsPerBar: 4, genre: "funk", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "all-about-that-bass", title: "All About That Bass", artist: "Meghan Trainor", bpm: 134, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "blank-space", title: "Blank Space", artist: "Taylor Swift", bpm: 96, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "D", beats: 4 }, { chord: "G", beats: 4 }, { chord: "A", beats: 4 }] },
  ] },
  { id: "see-you-again", title: "See You Again", artist: "Wiz Khalifa ft. Charlie Puth", bpm: 80, beatsPerBar: 4, genre: "soul", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "need-you-now", title: "Need You Now", artist: "Lady Antebellum", bpm: 108, beatsPerBar: 4, genre: "country", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },

  // --- More popular artists, last 3 decades ---
  { id: "irreplaceable", title: "Irreplaceable", artist: "Beyoncé", bpm: 100, beatsPerBar: 4, genre: "soul", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Dm", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "stay", title: "Stay", artist: "Rihanna", bpm: 82, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "teenage-dream", title: "Teenage Dream", artist: "Katy Perry", bpm: 120, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "love-yourself", title: "Love Yourself", artist: "Justin Bieber", bpm: 100, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "closer", title: "Closer", artist: "The Chainsmokers ft. Halsey", bpm: 95, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Dm", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "high-hopes", title: "High Hopes", artist: "Panic! At The Disco", bpm: 82, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Am", beats: 4 }] },
  ] },
  { id: "everlong", title: "Everlong", artist: "Foo Fighters", bpm: 158, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "starlight", title: "Starlight", artist: "Muse", bpm: 122, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Eb", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "Cm", beats: 4 }, { chord: "Ab", beats: 4 }] },
  ] },
  { id: "valerie", title: "Valerie", artist: "Amy Winehouse", bpm: 105, beatsPerBar: 4, genre: "soul", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "gravity", title: "Gravity", artist: "John Mayer", bpm: 84, beatsPerBar: 4, genre: "blues", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "chandelier", title: "Chandelier", artist: "Sia", bpm: 116, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "wrecking-ball", title: "Wrecking Ball", artist: "Miley Cyrus", bpm: 120, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "flowers", title: "Flowers", artist: "Miley Cyrus", bpm: 118, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "A", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "lose-you-to-love-me", title: "Lose You to Love Me", artist: "Selena Gomez", bpm: 137, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "stitches", title: "Stitches", artist: "Shawn Mendes", bpm: 147, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "just-give-me-a-reason", title: "Just Give Me a Reason", artist: "P!nk ft. Nate Ruess", bpm: 77, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "all-the-small-things", title: "All the Small Things", artist: "blink-182", bpm: 148, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "E", beats: 4 }, { chord: "A", beats: 4 }, { chord: "B", beats: 4 }] },
  ] },
  { id: "island-in-the-sun", title: "Island in the Sun", artist: "Weezer", bpm: 96, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "G", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "beautiful-day", title: "Beautiful Day", artist: "U2", bpm: 136, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "D", beats: 4 }, { chord: "A", beats: 4 }, { chord: "Bm", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "somebody-told-me", title: "Somebody Told Me", artist: "The Killers", bpm: 141, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "A", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "use-somebody", title: "Use Somebody", artist: "Kings of Leon", bpm: 136, beatsPerBar: 4, genre: "rock", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "shake-it-out", title: "Shake It Out", artist: "Florence + the Machine", bpm: 99, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "i-will-wait", title: "I Will Wait", artist: "Mumford & Sons", bpm: 137, beatsPerBar: 4, genre: "folk", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "little-talks", title: "Little Talks", artist: "Of Monsters and Men", bpm: 138, beatsPerBar: 4, genre: "folk", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "Bb", beats: 4 }] },
  ] },
  { id: "man-i-feel-like-a-woman", title: "Man! I Feel Like a Woman!", artist: "Shania Twain", bpm: 133, beatsPerBar: 4, genre: "country", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "somebody-like-you", title: "Somebody Like You", artist: "Keith Urban", bpm: 121, beatsPerBar: 4, genre: "country", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "no-one", title: "No One", artist: "Alicia Keys", bpm: 92, beatsPerBar: 4, genre: "soul", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "u-got-it-bad", title: "U Got It Bad", artist: "Usher", bpm: 74, beatsPerBar: 4, genre: "soul", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "hero", title: "Hero", artist: "Enrique Iglesias", bpm: 74, beatsPerBar: 4, genre: "latin", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "vivir-mi-vida", title: "Vivir Mi Vida", artist: "Marc Anthony", bpm: 96, beatsPerBar: 4, genre: "latin", difficulty: "easy", sections: [
    { name: "Groove", chords: [{ chord: "Am", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "E7", beats: 4 }] },
  ] },

  // --- Charlie Puth, Bruno Mars, and similar ---
  { id: "24k-magic", title: "24K Magic", artist: "Bruno Mars", bpm: 107, beatsPerBar: 4, genre: "funk", difficulty: "medium", sections: [
    { name: "Groove", chords: [{ chord: "Dm", beats: 4 }, { chord: "Gm", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "grenade", title: "Grenade", artist: "Bruno Mars", bpm: 108, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Cm", beats: 4 }, { chord: "Ab", beats: 4 }, { chord: "Eb", beats: 4 }, { chord: "Bb", beats: 4 }] },
  ] },
  { id: "treasure", title: "Treasure", artist: "Bruno Mars", bpm: 116, beatsPerBar: 4, genre: "funk", difficulty: "medium", sections: [
    { name: "Groove", chords: [{ chord: "Ab", beats: 4 }, { chord: "Bbm", beats: 4 }, { chord: "Eb", beats: 4 }] },
  ] },
  { id: "the-lazy-song", title: "The Lazy Song", artist: "Bruno Mars", bpm: 84, beatsPerBar: 4, genre: "pop", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "when-i-was-your-man", title: "When I Was Your Man", artist: "Bruno Mars", bpm: 72, beatsPerBar: 4, genre: "soul", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "attention", title: "Attention", artist: "Charlie Puth", bpm: 100, beatsPerBar: 4, genre: "funk", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Cm", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "Ab", beats: 4 }] },
  ] },
  { id: "we-dont-talk-anymore", title: "We Don't Talk Anymore", artist: "Charlie Puth ft. Selena Gomez", bpm: 100, beatsPerBar: 4, genre: "pop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "one-call-away", title: "One Call Away", artist: "Charlie Puth", bpm: 96, beatsPerBar: 4, genre: "soul", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },

  // --- More Coldplay ---
  { id: "the-scientist", title: "The Scientist", artist: "Coldplay", bpm: 73, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "paradise", title: "Paradise", artist: "Coldplay", bpm: 88, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "D", beats: 4 }, { chord: "A", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "speed-of-sound", title: "Speed of Sound", artist: "Coldplay", bpm: 138, beatsPerBar: 4, genre: "rock", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },

  // --- Bollywood (chords cross-checked against published chord charts) ---
  { id: "tum-hi-ho", title: "Tum Hi Ho", artist: "Arijit Singh (Aashiqui 2)", bpm: 84, beatsPerBar: 4, genre: "bollywood", difficulty: "medium", sections: [
    { name: "Chorus", chords: [{ chord: "Em", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Bm", beats: 4 }] },
  ] },
  { id: "kesariya", title: "Kesariya", artist: "Arijit Singh (Brahmastra)", bpm: 92, beatsPerBar: 4, genre: "bollywood", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }] },
    { name: "Chorus", chords: [{ chord: "Fmaj7", beats: 4 }, { chord: "C", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "channa-mereya", title: "Channa Mereya", artist: "Arijit Singh (Ae Dil Hai Mushkil)", bpm: 84, beatsPerBar: 4, genre: "bollywood", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "kal-ho-naa-ho", title: "Kal Ho Naa Ho (Title Track)", artist: "Sonu Nigam", bpm: 78, beatsPerBar: 4, genre: "bollywood", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "tera-hone-laga-hoon", title: "Tera Hone Laga Hoon", artist: "Atif Aslam", bpm: 120, beatsPerBar: 4, genre: "bollywood", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Bm", beats: 4 }] },
  ] },

  // --- Anime openings & endings (chords cross-checked against published chord charts) ---
  { id: "gurenge", title: "Gurenge", artist: "LiSA (Demon Slayer OP)", bpm: 138, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "Bm", beats: 4 }] },
  ] },
  { id: "cruel-angels-thesis", title: "A Cruel Angel's Thesis", artist: "Yoko Takahashi (Evangelion OP)", bpm: 120, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "Dm", beats: 4 }, { chord: "G", beats: 4 }, { chord: "C", beats: 4 }] },
    { name: "Chorus", chords: [{ chord: "Em7", beats: 4 }, { chord: "Fmaj7", beats: 4 }] },
  ] },
  { id: "unravel", title: "Unravel", artist: "TK from Ling Tosite Sigure (Tokyo Ghoul OP)", bpm: 165, beatsPerBar: 4, genre: "anime", difficulty: "hard", sections: [
    { name: "Verse", chords: [{ chord: "F#m", beats: 4 }, { chord: "D", beats: 4 }, { chord: "E", beats: 4 }, { chord: "A", beats: 4 }] },
  ] },
  { id: "again", title: "Again", artist: "YUI (Fullmetal Alchemist: Brotherhood OP)", bpm: 176, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "D", beats: 4 }, { chord: "C", beats: 4 }, { chord: "B", beats: 4 }] },
  ] },
  { id: "sign", title: "Sign", artist: "FLOW (Naruto Shippuden OP)", bpm: 70, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "A", beats: 4 }] },
  ] },

  // --- More anime (chords cross-checked against published chord charts) ---
  { id: "zenzenzense", title: "Zenzenzense", artist: "RADWIMPS (Your Name OP)", bpm: 150, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "B", beats: 4 }, { chord: "E", beats: 4 }, { chord: "G#m", beats: 4 }, { chord: "F#", beats: 4 }] },
  ] },
  { id: "we-are", title: "We Are!", artist: "Hiroshi Kitadani (One Piece OP1)", bpm: 172, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "E", beats: 4 }, { chord: "D", beats: 4 }, { chord: "C", beats: 4 }, { chord: "A", beats: 4 }, { chord: "B", beats: 4 }] },
  ] },
  { id: "idol", title: "Idol", artist: "YOASOBI (Oshi no Ko OP)", bpm: 166, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Am", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "E", beats: 4 }, { chord: "G#m", beats: 4 }] },
  ] },
  { id: "silhouette", title: "Silhouette", artist: "KANA-BOON (Naruto Shippuden OP)", bpm: 190, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "F", beats: 4 }, { chord: "G", beats: 4 }, { chord: "Em", beats: 4 }] },
  ] },
  { id: "butter-fly", title: "Butter-Fly", artist: "Kōji Wada (Digimon Adventure OP)", bpm: 128, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "E", beats: 4 }, { chord: "A", beats: 4 }, { chord: "C#m", beats: 4 }, { chord: "D", beats: 4 }, { chord: "B", beats: 4 }] },
  ] },

  // --- More Indian & Pakistani songs (chords cross-checked against published chord charts) ---
  { id: "pasoori", title: "Pasoori", artist: "Ali Sethi & Shae Gill (Coke Studio Pakistan)", bpm: 100, beatsPerBar: 4, genre: "bollywood", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Bm", beats: 4 }, { chord: "F#", beats: 4 }, { chord: "A", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "afreen-afreen", title: "Afreen Afreen", artist: "Rahat Fateh Ali Khan & Momina Mustehsan (Coke Studio)", bpm: 80, beatsPerBar: 4, genre: "bollywood", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "E", beats: 4 }, { chord: "A", beats: 4 }, { chord: "F#m", beats: 4 }, { chord: "Bm", beats: 4 }] },
  ] },
  { id: "bulleya", title: "Bulleya", artist: "Amit Mishra & Shilpa Rao (Ae Dil Hai Mushkil)", bpm: 88, beatsPerBar: 4, genre: "bollywood", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Dm", beats: 4 }, { chord: "F", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "Gm", beats: 4 }] },
    { name: "Chorus", chords: [{ chord: "Dm", beats: 4 }, { chord: "Bb", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "ilahi", title: "Ilahi", artist: "Arijit Singh (Yeh Jawaani Hai Deewani)", bpm: 100, beatsPerBar: 4, genre: "bollywood", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "A", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Bm", beats: 4 }, { chord: "F#m", beats: 4 }] },
  ] },
  { id: "tum-se-hi", title: "Tum Se Hi", artist: "Mohit Chauhan (Jab We Met)", bpm: 84, beatsPerBar: 4, genre: "bollywood", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "C", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },

  // --- More Korean songs (chords cross-checked against published chord charts) ---
  { id: "spring-day", title: "Spring Day", artist: "BTS", bpm: 90, beatsPerBar: 4, genre: "kpop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "F", beats: 4 }] },
  ] },
  { id: "how-you-like-that", title: "How You Like That", artist: "BLACKPINK", bpm: 130, beatsPerBar: 4, genre: "kpop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "B", beats: 4 }, { chord: "G", beats: 4 }, { chord: "A", beats: 4 }] },
  ] },
  { id: "my-universe", title: "My Universe", artist: "Coldplay x BTS", bpm: 111, beatsPerBar: 4, genre: "kpop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "F", beats: 4 }, { chord: "Am", beats: 4 }, { chord: "G", beats: 4 }, { chord: "C", beats: 4 }] },
  ] },
  { id: "through-the-night", title: "Through the Night", artist: "IU", bpm: 76, beatsPerBar: 4, genre: "kpop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "A", beats: 4 }, { chord: "F#m", beats: 4 }, { chord: "Bm", beats: 4 }] },
  ] },
  { id: "stay-with-me-goblin", title: "Stay With Me", artist: "Chanyeol & Punch (Goblin OST)", bpm: 75, beatsPerBar: 4, genre: "kpop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Cm", beats: 4 }, { chord: "Ab", beats: 4 }, { chord: "Eb", beats: 4 }, { chord: "Bb", beats: 4 }] },
  ] },
  { id: "beautiful-goblin", title: "Beautiful", artist: "Crush (Goblin OST)", bpm: 74, beatsPerBar: 4, genre: "kpop", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "A", beats: 4 }, { chord: "C#m", beats: 4 }, { chord: "F#m", beats: 4 }, { chord: "Bm", beats: 4 }] },
  ] },

  // --- Naruto, Dragon Ball, JoJo (chords cross-checked against published chord charts) ---
  { id: "wind-naruto", title: "Wind", artist: "Akeboshi (Naruto ED1)", bpm: 176, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Cm", beats: 4 }, { chord: "Gm", beats: 4 }, { chord: "Ab", beats: 4 }, { chord: "Eb", beats: 4 }] },
  ] },
  { id: "rocks-naruto", title: "R★O★C★K★S", artist: "Hound Dog (Naruto OP1)", bpm: 170, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "A", beats: 4 }, { chord: "F#m", beats: 4 }, { chord: "E", beats: 4 }, { chord: "F#", beats: 4 }] },
  ] },
  { id: "cha-la-head-cha-la", title: "Cha-La Head-Cha-La", artist: "Hironobu Kageyama (Dragon Ball Z OP)", bpm: 132, beatsPerBar: 4, genre: "anime", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "E", beats: 4 }, { chord: "D", beats: 4 }, { chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "dan-dan-kokoro", title: "Dan Dan Kokoro Hikareteku", artist: "Field of View (Dragon Ball GT OP)", bpm: 145, beatsPerBar: 4, genre: "anime", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "B", beats: 4 }, { chord: "E", beats: 4 }, { chord: "A", beats: 4 }, { chord: "D", beats: 4 }] },
  ] },
  { id: "sono-chi-no-sadame", title: "Sono Chi no Sadame", artist: "Coda (JoJo's Bizarre Adventure OP1)", bpm: 145, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Em", beats: 4 }, { chord: "Bm", beats: 4 }, { chord: "C", beats: 4 }, { chord: "B", beats: 4 }] },
  ] },
  { id: "bloody-stream", title: "Bloody Stream", artist: "Coda (JoJo's Bizarre Adventure OP2)", bpm: 145, beatsPerBar: 4, genre: "anime", difficulty: "medium", sections: [
    { name: "Verse", chords: [{ chord: "Cm", beats: 4 }, { chord: "Eb", beats: 4 }, { chord: "Ab", beats: 4 }, { chord: "G", beats: 4 }] },
  ] },
  { id: "crazy-noisy-bizarre-town", title: "Crazy Noisy Bizarre Town", artist: "THE DU (JoJo's Bizarre Adventure OP5)", bpm: 136, beatsPerBar: 4, genre: "anime", difficulty: "easy", sections: [
    { name: "Verse", chords: [{ chord: "G", beats: 4 }, { chord: "D", beats: 4 }, { chord: "Em", beats: 4 }, { chord: "A", beats: 4 }] },
  ] },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

// Common filler words that shouldn't count as a meaningful match on
// their own (avoids e.g. "you" matching inside "yours").
const STOPWORDS = new Set([
  "the", "a", "an", "and", "of", "to", "you", "your", "i", "m", "official",
  "video", "audio", "lyrics", "lyric", "hd", "hq", "ft", "feat",
]);

export function searchSongs(query: string): Song[] {
  const q = normalize(query);
  if (!q) return [];
  const rawTerms = q.split(" ").filter(Boolean);
  const terms = rawTerms.filter((t) => !STOPWORDS.has(t) && t.length > 1);
  const effectiveTerms = terms.length > 0 ? terms : rawTerms;

  return SONGS.map((song) => {
    const haystackWords = new Set(
      normalize(`${song.title} ${song.artist}`).split(" ")
    );
    const score = effectiveTerms.reduce(
      (acc, term) => acc + (haystackWords.has(term) ? 1 : 0),
      0
    );
    const ratio = score / effectiveTerms.length;
    return { song, score, ratio };
  })
    .filter((r) => r.score > 0 && r.ratio >= 0.34)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.song);
}

export function getSongById(id: string): Song | undefined {
  return SONGS.find((s) => s.id === id);
}

export function getUniqueChords(song: Song): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const section of song.sections) {
    for (const event of section.chords) {
      if (!seen.has(event.chord)) {
        seen.add(event.chord);
        order.push(event.chord);
      }
    }
  }
  return order;
}

export const GENRES: Genre[] = [
  "pop", "rock", "folk", "reggae", "soul", "funk", "jazz", "country", "traditional", "blues", "latin", "kpop", "bollywood", "anime",
];
