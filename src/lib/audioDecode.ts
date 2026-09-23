// Browser-only decode step (thin wrapper, not unit tested — jsdom has
// no Web Audio implementation). All the actual analysis logic lives in
// audioAnalysis.ts and operates on the plain PCM this returns.
export interface DecodedAudio {
  channelData: Float32Array;
  sampleRate: number;
  durationSeconds: number;
  /** Kept for playback preview (a fresh AudioContext is used to actually play it). */
  buffer: AudioBuffer;
}

export async function decodeAudioFile(file: File): Promise<DecodedAudio> {
  const arrayBuffer = await file.arrayBuffer();
  const ctx = new AudioContext();
  try {
    const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    const channelData = mixToMono(buffer);
    return { channelData, sampleRate: buffer.sampleRate, durationSeconds: buffer.duration, buffer };
  } catch {
    throw new Error(
      `Couldn't decode "${file.name}" — it may not be a supported audio format, or the file may be corrupted.`
    );
  } finally {
    ctx.close();
  }
}

function mixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
  const out = new Float32Array(buffer.length);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i++) out[i] += data[i] / buffer.numberOfChannels;
  }
  return out;
}
