// Pure signal-processing core for the audio-import feature. Operates
// on plain decoded PCM (Float32Array + sampleRate) so it's fully unit
// testable with synthetic signals, independent of the browser-only
// decode step in audioDecode.ts.
//
// Honest scope: this only distinguishes major and minor triads (the
// same 24 templates used nowhere near real chord-recognition ML). It
// will get confused by dense mixes, vocals, drums, 7ths/extensions,
// and inversions — that's why every estimate carries a confidence
// score and the UI treats the whole thing as an editable draft, never
// as verified data.

export interface ChordEstimate {
  startSeconds: number;
  durationSeconds: number;
  chord: string;
  confidence: number; // 0-1
}

export interface BpmEstimate {
  bpm: number;
  /** Common half-time/double-time reinterpretations of the same estimate. */
  alternatives: number[];
}

const PITCH_CLASS_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const MAJOR_INTERVALS = [0, 4, 7];
const MINOR_INTERVALS = [0, 3, 7];

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Goertzel algorithm: the magnitude of one target frequency in a
// window, without computing a full FFT. O(n) per frequency, which is
// plenty fast for the few dozen pitch-class/octave combinations below.
export function goertzelMagnitude(samples: Float32Array | number[], sampleRate: number, targetFreq: number): number {
  const n = samples.length;
  if (n === 0) return 0;
  const k = Math.round((n * targetFreq) / sampleRate);
  const omega = (2 * Math.PI * k) / n;
  const coeff = 2 * Math.cos(omega);
  let s0 = 0;
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < n; i++) {
    s0 = samples[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  const real = s1 - s2 * Math.cos(omega);
  const imag = s2 * Math.sin(omega);
  return Math.sqrt(real * real + imag * imag) / n;
}

// A 12-bin chroma vector (pitch-class energy) for one window, summed
// across a few octaves and normalized to its own peak.
export function computeChroma(samples: Float32Array | number[], sampleRate: number, octaves: number[] = [2, 3, 4, 5]): number[] {
  const chroma = new Array(12).fill(0);
  for (const octave of octaves) {
    for (let pc = 0; pc < 12; pc++) {
      const freq = midiToFreq(12 * (octave + 1) + pc);
      if (freq >= sampleRate / 2) continue;
      chroma[pc] += goertzelMagnitude(samples, sampleRate, freq);
    }
  }
  const max = Math.max(...chroma, 1e-9);
  return chroma.map((v) => v / max);
}

function chordTemplate(root: number, intervals: number[]): number[] {
  const t = new Array(12).fill(0);
  for (const i of intervals) t[(root + i) % 12] = 1;
  return t;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export function matchChordTemplate(chroma: number[]): { chord: string; confidence: number } {
  let bestChord = "C";
  let bestScore = -1;
  for (let root = 0; root < 12; root++) {
    for (const [intervals, suffix] of [
      [MAJOR_INTERVALS, ""],
      [MINOR_INTERVALS, "m"],
    ] as const) {
      const score = cosineSimilarity(chroma, chordTemplate(root, intervals));
      if (score > bestScore) {
        bestScore = score;
        bestChord = PITCH_CLASS_NAMES[root] + suffix;
      }
    }
  }
  return { chord: bestChord, confidence: Math.max(0, Math.min(1, bestScore)) };
}

export function mergeAdjacentSameChord(estimates: ChordEstimate[]): ChordEstimate[] {
  const merged: ChordEstimate[] = [];
  for (const e of estimates) {
    const last = merged[merged.length - 1];
    if (last && last.chord === e.chord) {
      const totalDuration = last.durationSeconds + e.durationSeconds;
      last.confidence = (last.confidence * last.durationSeconds + e.confidence * e.durationSeconds) / totalDuration;
      last.durationSeconds = totalDuration;
    } else {
      merged.push({ ...e });
    }
  }
  return merged;
}

export function estimateChords(
  channelData: Float32Array | number[],
  sampleRate: number,
  windowSeconds = 0.5
): ChordEstimate[] {
  const windowSize = Math.max(1, Math.floor(windowSeconds * sampleRate));
  const raw: ChordEstimate[] = [];
  for (let start = 0; start + windowSize <= channelData.length; start += windowSize) {
    const frame =
      channelData instanceof Float32Array ? channelData.subarray(start, start + windowSize) : channelData.slice(start, start + windowSize);
    const chroma = computeChroma(frame, sampleRate);
    const { chord, confidence } = matchChordTemplate(chroma);
    raw.push({ startSeconds: start / sampleRate, durationSeconds: windowSeconds, chord, confidence });
  }
  return mergeAdjacentSameChord(raw);
}

// Onset-autocorrelation tempo estimate: build a short-time energy
// envelope, take its positive first difference (an onset/novelty
// function), then autocorrelate that over the lag range for 60-200bpm
// and report whichever lag repeats most strongly.
export function estimateBpm(channelData: Float32Array | number[], sampleRate: number): BpmEstimate {
  const frameSize = 1024;
  const hopSize = 512;
  const hopSeconds = hopSize / sampleRate;

  const energies: number[] = [];
  for (let i = 0; i + frameSize <= channelData.length; i += hopSize) {
    let sum = 0;
    for (let j = 0; j < frameSize; j++) {
      const s = channelData[i + j];
      sum += s * s;
    }
    energies.push(Math.sqrt(sum / frameSize));
  }

  const novelty: number[] = [0];
  for (let i = 1; i < energies.length; i++) {
    novelty.push(Math.max(0, energies[i] - energies[i - 1]));
  }

  const minBpm = 60;
  const maxBpm = 200;
  const minLag = Math.max(1, Math.round(60 / maxBpm / hopSeconds));
  const maxLag = Math.round(60 / minBpm / hopSeconds);

  let bestLag = minLag;
  let bestScore = -Infinity;
  for (let lag = minLag; lag <= maxLag && lag < novelty.length; lag++) {
    let score = 0;
    for (let i = 0; i + lag < novelty.length; i++) {
      score += novelty[i] * novelty[i + lag];
    }
    if (score > bestScore) {
      bestScore = score;
      bestLag = lag;
    }
  }

  const bpm = bestLag > 0 ? 60 / (bestLag * hopSeconds) : 120;
  const alternatives = [bpm / 2, bpm * 2].filter((b) => b >= 40 && b <= 240).map((b) => Math.round(b * 10) / 10);

  return { bpm: Math.round(bpm * 10) / 10, alternatives };
}
