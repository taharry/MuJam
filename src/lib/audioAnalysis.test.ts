import { describe, expect, it } from "vitest";
import {
  computeChroma,
  estimateBpm,
  estimateChords,
  goertzelMagnitude,
  matchChordTemplate,
  mergeAdjacentSameChord,
  type ChordEstimate,
} from "./audioAnalysis";

const SAMPLE_RATE = 22050;

function sineWave(freq: number, seconds: number, sampleRate = SAMPLE_RATE, amplitude = 1): Float32Array {
  const n = Math.floor(seconds * sampleRate);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  return out;
}

function sumSignals(...signals: Float32Array[]): Float32Array {
  const n = Math.max(...signals.map((s) => s.length));
  const out = new Float32Array(n);
  for (const s of signals) for (let i = 0; i < s.length; i++) out[i] += s[i];
  return out;
}

function chordSignal(freqsHz: number[], seconds: number, sampleRate = SAMPLE_RATE): Float32Array {
  return sumSignals(...freqsHz.map((f) => sineWave(f, seconds, sampleRate, 1 / freqsHz.length)));
}

// Frequencies for a middle-register C major and A minor triad.
const C_MAJOR_FREQS = [261.63, 329.63, 392.0]; // C4 E4 G4
const A_MINOR_FREQS = [220.0, 261.63, 329.63]; // A3 C4 E4

describe("goertzelMagnitude", () => {
  it("gives a strong reading at the signal's own frequency", () => {
    const signal = sineWave(440, 0.25);
    const onTarget = goertzelMagnitude(signal, SAMPLE_RATE, 440);
    const offTarget = goertzelMagnitude(signal, SAMPLE_RATE, 1000);
    expect(onTarget).toBeGreaterThan(offTarget * 5);
  });
});

describe("computeChroma", () => {
  it("peaks at pitch class C for a pure C4 tone", () => {
    const signal = sineWave(261.63, 0.5);
    const chroma = computeChroma(signal, SAMPLE_RATE);
    const maxIndex = chroma.indexOf(Math.max(...chroma));
    expect(maxIndex).toBe(0); // C
  });

  it("peaks at pitch class A for a pure A4 tone", () => {
    const signal = sineWave(440, 0.5);
    const chroma = computeChroma(signal, SAMPLE_RATE);
    const maxIndex = chroma.indexOf(Math.max(...chroma));
    expect(maxIndex).toBe(9); // A
  });
});

describe("matchChordTemplate", () => {
  it("identifies a synthesized C major chord", () => {
    const signal = chordSignal(C_MAJOR_FREQS, 0.5);
    const chroma = computeChroma(signal, SAMPLE_RATE);
    const result = matchChordTemplate(chroma);
    expect(result.chord).toBe("C");
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it("identifies a synthesized A minor chord", () => {
    const signal = chordSignal(A_MINOR_FREQS, 0.5);
    const chroma = computeChroma(signal, SAMPLE_RATE);
    const result = matchChordTemplate(chroma);
    expect(result.chord).toBe("Am");
  });
});

describe("estimateChords", () => {
  it("detects a chord change from a two-chord synthetic recording", () => {
    const half1 = chordSignal(C_MAJOR_FREQS, 1);
    const half2 = chordSignal(A_MINOR_FREQS, 1);
    const full = new Float32Array(half1.length + half2.length);
    full.set(half1, 0);
    full.set(half2, half1.length);

    const estimates = estimateChords(full, SAMPLE_RATE, 0.5);
    expect(estimates.length).toBeGreaterThanOrEqual(2);
    expect(estimates[0].chord).toBe("C");
    expect(estimates[estimates.length - 1].chord).toBe("Am");
    // Segments should tile the whole recording with no gaps.
    let cursor = 0;
    for (const e of estimates) {
      expect(e.startSeconds).toBeCloseTo(cursor, 1);
      cursor += e.durationSeconds;
    }
  });
});

describe("mergeAdjacentSameChord", () => {
  it("merges consecutive equal-chord windows into one longer segment", () => {
    const input: ChordEstimate[] = [
      { startSeconds: 0, durationSeconds: 0.5, chord: "C", confidence: 0.8 },
      { startSeconds: 0.5, durationSeconds: 0.5, chord: "C", confidence: 0.6 },
      { startSeconds: 1, durationSeconds: 0.5, chord: "G", confidence: 0.9 },
    ];
    const merged = mergeAdjacentSameChord(input);
    expect(merged).toHaveLength(2);
    expect(merged[0]).toMatchObject({ chord: "C", durationSeconds: 1 });
    expect(merged[0].confidence).toBeCloseTo(0.7); // duration-weighted average
    expect(merged[1]).toMatchObject({ chord: "G", durationSeconds: 0.5 });
  });

  it("leaves distinct chords unmerged", () => {
    const input: ChordEstimate[] = [
      { startSeconds: 0, durationSeconds: 0.5, chord: "C", confidence: 1 },
      { startSeconds: 0.5, durationSeconds: 0.5, chord: "G", confidence: 1 },
    ];
    expect(mergeAdjacentSameChord(input)).toHaveLength(2);
  });
});

describe("estimateBpm", () => {
  function clickTrack(bpm: number, beats: number, sampleRate = SAMPLE_RATE): Float32Array {
    const periodSamples = Math.round((60 / bpm) * sampleRate);
    const totalSamples = periodSamples * beats;
    const out = new Float32Array(totalSamples);
    const clickLength = 300;
    for (let beat = 0; beat < beats; beat++) {
      const start = beat * periodSamples;
      for (let i = 0; i < clickLength && start + i < totalSamples; i++) {
        // A short decaying burst, not a single-sample impulse, so it
        // shows up clearly in the short-time energy envelope.
        out[start + i] = Math.sin((2 * Math.PI * 1000 * i) / sampleRate) * Math.exp(-i / 40);
      }
    }
    return out;
  }

  it("recovers the tempo of a clean synthetic click track", () => {
    const targetBpm = 120;
    const signal = clickTrack(targetBpm, 10);
    const { bpm } = estimateBpm(signal, SAMPLE_RATE);
    // Onset-autocorrelation tempo detection is inherently prone to
    // octave errors (half/double time) even on a clean signal, so
    // accept either the target or one of its common reinterpretations.
    const plausible = [targetBpm, targetBpm / 2, targetBpm * 2];
    const closest = plausible.reduce((a, b) => (Math.abs(bpm - b) < Math.abs(bpm - a) ? b : a));
    expect(Math.abs(bpm - closest)).toBeLessThan(3);
  });

  it("offers half-time and double-time alternatives", () => {
    const { bpm, alternatives } = estimateBpm(clickTrack(100, 10), SAMPLE_RATE);
    expect(alternatives).toContain(Math.round((bpm / 2) * 10) / 10);
    expect(alternatives).toContain(Math.round(bpm * 2 * 10) / 10);
  });
});
