import { describe, expect, it, vi } from "vitest";
import {
  YT_PLAYER_STATE,
  YouTubeSyncController,
  beatToVideoTime,
  supportsPlaybackRateControl,
  videoTimeToBeat,
  type YouTubePlayerLike,
} from "./youtubeSync";

describe("videoTimeToBeat / beatToVideoTime", () => {
  it("converts video seconds to a beat position, applying the offset", () => {
    // 100bpm -> 1 beat = 0.6s. Video at 10s with a 4s intro offset -> 6s of song -> 10 beats.
    expect(videoTimeToBeat(10, 4, 100)).toBeCloseTo(10);
  });

  it("clamps to 0 for video time before the offset (still in the intro)", () => {
    expect(videoTimeToBeat(1, 4, 100)).toBe(0);
  });

  it("round-trips a beat position back to video time", () => {
    const beat = 12.5;
    const offset = 3.2;
    const bpm = 92;
    const videoTime = beatToVideoTime(beat, offset, bpm);
    expect(videoTimeToBeat(videoTime, offset, bpm)).toBeCloseTo(beat);
  });
});

describe("supportsPlaybackRateControl", () => {
  it("requires more than one rate and that 1x is among them", () => {
    expect(supportsPlaybackRateControl([1])).toBe(false);
    expect(supportsPlaybackRateControl([0.5, 1, 1.5, 2])).toBe(true);
    expect(supportsPlaybackRateControl([0.5, 2])).toBe(false); // no 1x
  });
});

function makeFakePlayer(overrides: Partial<YouTubePlayerLike> = {}): YouTubePlayerLike {
  return {
    playVideo: vi.fn(),
    pauseVideo: vi.fn(),
    seekTo: vi.fn(),
    getCurrentTime: () => 0,
    getPlayerState: () => YT_PLAYER_STATE.PAUSED,
    getAvailablePlaybackRates: () => [1],
    setPlaybackRate: vi.fn(),
    ...overrides,
  };
}

describe("YouTubeSyncController", () => {
  it("reads beat position from the player's current time minus the offset", () => {
    const player = makeFakePlayer({ getCurrentTime: () => 14 });
    const controller = new YouTubeSyncController(player, { offsetSeconds: 2, bpm: 120 });
    expect(controller.getBeat()).toBeCloseTo(24); // (14-2)s * 2 beats/sec
  });

  it("reports playing based on the player's actual state, not internal state", () => {
    const player = makeFakePlayer({ getPlayerState: () => YT_PLAYER_STATE.PLAYING });
    const controller = new YouTubeSyncController(player, { offsetSeconds: 0, bpm: 100 });
    expect(controller.isPlaying()).toBe(true);
  });

  it("toggle() calls play or pause based on current state", () => {
    const play = vi.fn();
    const pause = vi.fn();
    const player = makeFakePlayer({ playVideo: play, pauseVideo: pause, getPlayerState: () => YT_PLAYER_STATE.PAUSED });
    const controller = new YouTubeSyncController(player, { offsetSeconds: 0, bpm: 100 });
    controller.toggle();
    expect(play).toHaveBeenCalled();
    expect(pause).not.toHaveBeenCalled();
  });

  it("seek() converts the beat to video time (plus offset) and calls seekTo", () => {
    const seekTo = vi.fn();
    const player = makeFakePlayer({ seekTo });
    const controller = new YouTubeSyncController(player, { offsetSeconds: 5, bpm: 60 }); // 1 beat = 1s
    controller.seek(8);
    expect(seekTo).toHaveBeenCalledWith(13, true); // 8s + 5s offset
  });

  it("updating the offset changes subsequent beat reads without touching the player", () => {
    const player = makeFakePlayer({ getCurrentTime: () => 20 });
    const controller = new YouTubeSyncController(player, { offsetSeconds: 0, bpm: 60 });
    expect(controller.getBeat()).toBeCloseTo(20);
    controller.setOffset(10);
    expect(controller.getBeat()).toBeCloseTo(10);
  });
});
