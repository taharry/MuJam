import { beatsToSeconds, secondsToBeats } from "./time";

// Minimal shape of a real YT.Player instance we actually call. Kept as
// our own interface instead of pulling in @types/youtube, and lets
// tests inject a fake player instead of the real IFrame API.
export interface YouTubePlayerLike {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  getAvailablePlaybackRates(): number[];
  setPlaybackRate(rate: number): void;
}

// From the IFrame API's YT.PlayerState enum.
export const YT_PLAYER_STATE = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } as const;

export function videoTimeToBeat(videoSeconds: number, offsetSeconds: number, bpm: number): number {
  return secondsToBeats(Math.max(0, videoSeconds - offsetSeconds), bpm);
}

export function beatToVideoTime(beat: number, offsetSeconds: number, bpm: number): number {
  return Math.max(0, beatsToSeconds(beat, bpm) + offsetSeconds);
}

// Only worth offering our own speed control in video mode if the
// player actually reports more than one rate including 1x — otherwise
// we'd risk showing a speed that doesn't match what's really playing.
export function supportsPlaybackRateControl(rates: number[]): boolean {
  return rates.length > 1 && rates.includes(1);
}

export class YouTubeSyncController {
  private player: YouTubePlayerLike;
  private offsetSeconds: number;
  private bpm: number;

  constructor(player: YouTubePlayerLike, config: { offsetSeconds: number; bpm: number }) {
    this.player = player;
    this.offsetSeconds = config.offsetSeconds;
    this.bpm = config.bpm;
  }

  setOffset(offsetSeconds: number) {
    this.offsetSeconds = offsetSeconds;
  }

  setBpm(bpm: number) {
    this.bpm = bpm;
  }

  /** The video's own clock is authoritative — this just reads and converts it, never accumulates time itself. */
  getBeat(): number {
    return videoTimeToBeat(this.player.getCurrentTime(), this.offsetSeconds, this.bpm);
  }

  isPlaying(): boolean {
    return this.player.getPlayerState() === YT_PLAYER_STATE.PLAYING;
  }

  play() {
    this.player.playVideo();
  }

  pause() {
    this.player.pauseVideo();
  }

  toggle() {
    if (this.isPlaying()) this.pause();
    else this.play();
  }

  seek(beat: number) {
    this.player.seekTo(beatToVideoTime(beat, this.offsetSeconds, this.bpm), true);
  }

  setPlaybackRate(rate: number) {
    this.player.setPlaybackRate(rate);
  }
}
