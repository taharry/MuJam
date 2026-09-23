// Shared arrangement/playback timeline model. Every consumer that needs
// to know "what chord is playing when" — the player, chord diagrams,
// strum guide, timeline, and seek controls — reads the same flattened
// `Arrangement.events`/`sections` produced here, instead of each piece
// re-deriving beat positions its own way.

// "imported" = a user's own corrected draft from the audio-import
// estimator — distinct from "verified" (cross-checked against
// published chord charts), so it's never silently presented with the
// same authority.
export type ArrangementSource = "simplified" | "verified" | "imported";

export interface ArrangementEvent {
  chord: string;
  startBeat: number;
  durationBeats: number;
  sectionIndex: number;
}

export interface ArrangementSection {
  name: string;
  startBeat: number;
  durationBeats: number;
}

export interface Arrangement {
  source: ArrangementSource;
  bpm: number;
  beatsPerBar: number;
  totalBeats: number;
  events: ArrangementEvent[];
  sections: ArrangementSection[];
}

// ---- Authoring-time input (before flattening) ----

export interface ChordSlot {
  chord: string;
  beats: number;
  /** Explicit position within the section, in beats. Omit to place it sequentially after the previous chord. */
  startBeat?: number;
}

export interface SectionBlueprint {
  /** Needed only if a later section reuses this one via `ref`. */
  id?: string;
  name: string;
  /** One pass through the section's chords. Omit only if using `ref`. */
  chords?: ChordSlot[];
  /** Reuse an earlier section's chords verbatim instead of restating them (e.g. "Verse 2" = "verse-1"). */
  ref?: string;
  /** How many times this section repeats back-to-back. Defaults to 1. */
  repeat?: number;
}

export interface ArrangementInput {
  source?: ArrangementSource;
  bpm: number;
  beatsPerBar: number;
  sections: SectionBlueprint[];
  /** Optional cross-check: the arrangement's total length, in beats, as declared by whoever entered it. */
  expectedTotalBeats?: number;
}

export class ArrangementError extends Error {}

export function buildArrangement(input: ArrangementInput): Arrangement {
  const source: ArrangementSource = input.source === "verified" || input.source === "imported" ? input.source : "simplified";
  const events: ArrangementEvent[] = [];
  const sections: ArrangementSection[] = [];
  const chordsById = new Map<string, ChordSlot[]>();
  let cursor = 0;

  input.sections.forEach((section, sectionIndex) => {
    let chords: ChordSlot[];
    if (section.ref !== undefined) {
      const resolved = chordsById.get(section.ref);
      if (!resolved) {
        throw new ArrangementError(
          `Section "${section.name}" references unknown or not-yet-defined section id "${section.ref}"`
        );
      }
      chords = resolved;
    } else if (section.chords) {
      chords = section.chords;
    } else {
      throw new ArrangementError(`Section "${section.name}" has neither chords nor a section reference`);
    }
    if (chords.length === 0) {
      throw new ArrangementError(`Section "${section.name}" has no chords`);
    }

    const repeat = section.repeat === undefined ? 1 : section.repeat;
    if (!Number.isInteger(repeat) || repeat < 1) {
      throw new ArrangementError(`Section "${section.name}" has an invalid repeat count: ${repeat}`);
    }

    for (let pass = 0; pass < repeat; pass++) {
      const sectionStart = cursor;
      for (const slot of chords) {
        if (!slot.chord?.trim()) {
          throw new ArrangementError(`Section "${section.name}" has an event with a missing chord name`);
        }
        if (!(slot.beats > 0)) {
          throw new ArrangementError(
            `Section "${section.name}" chord "${slot.chord}" has a non-positive duration (${slot.beats} beats)`
          );
        }
        const eventStart = slot.startBeat !== undefined ? sectionStart + slot.startBeat : cursor;
        if (eventStart < 0) {
          throw new ArrangementError(`Section "${section.name}" chord "${slot.chord}" has a negative start position`);
        }
        events.push({ chord: slot.chord, startBeat: eventStart, durationBeats: slot.beats, sectionIndex });
        cursor = eventStart + slot.beats;
      }
      sections.push({ name: section.name, startBeat: sectionStart, durationBeats: cursor - sectionStart });
    }

    if (section.id) chordsById.set(section.id, chords);
  });

  events.sort((a, b) => a.startBeat - b.startBeat);
  assertNoOverlaps(events);

  const totalBeats = events.reduce((max, e) => Math.max(max, e.startBeat + e.durationBeats), 0);
  if (input.expectedTotalBeats !== undefined && Math.abs(input.expectedTotalBeats - totalBeats) > 1e-6) {
    throw new ArrangementError(
      `Declared duration (${input.expectedTotalBeats} beats) does not match the arrangement's computed length (${totalBeats} beats)`
    );
  }

  return { source, bpm: input.bpm, beatsPerBar: input.beatsPerBar, totalBeats, events, sections };
}

function assertNoOverlaps(events: ArrangementEvent[]) {
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const cur = events[i];
    if (cur.startBeat < prev.startBeat + prev.durationBeats - 1e-9) {
      throw new ArrangementError(
        `Overlapping events: "${prev.chord}" at beat ${prev.startBeat} overlaps "${cur.chord}" at beat ${cur.startBeat}`
      );
    }
  }
}

export function findActiveEventIndex(events: ArrangementEvent[], beat: number): number {
  return events.findIndex((e) => beat >= e.startBeat && beat < e.startBeat + e.durationBeats);
}

export function findActiveSection(sections: ArrangementSection[], beat: number): ArrangementSection | undefined {
  return sections.find((s) => beat >= s.startBeat && beat < s.startBeat + s.durationBeats);
}

export function clampBeat(beat: number, totalBeats: number): number {
  if (totalBeats <= 0) return 0;
  return Math.max(0, Math.min(totalBeats - 1e-6, beat));
}
