import { useEffect, useRef, useState } from "react";
import { loadYouTubeIframeApi } from "../lib/youtubeApi";
import { YouTubeSyncController, type YouTubePlayerLike } from "../lib/youtubeSync";

export type YouTubeSyncStatus = "loading" | "ready" | "error";

interface Options {
  videoId: string;
  offsetSeconds: number;
  bpm: number;
  /** Skip loading/creating the player until the caller actually switches into video mode. */
  enabled: boolean;
}

// The handful of YT.Player constructor pieces we actually use — kept
// minimal on purpose instead of depending on @types/youtube.
interface YTPlayerCtor {
  new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, number>;
      events?: {
        onReady?: () => void;
        onError?: () => void;
      };
    }
  ): YouTubePlayerLike;
}

export function useYouTubeSync({ videoId, offsetSeconds, bpm, enabled }: Options) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<YouTubeSyncController | null>(null);
  const rafRef = useRef<number | null>(null);

  const [status, setStatus] = useState<YouTubeSyncStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [beat, setBeat] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [availableRates, setAvailableRates] = useState<number[]>([]);

  useEffect(() => {
    if (!enabled || !videoId) return;
    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);
    setAvailableRates([]);

    loadYouTubeIframeApi()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const w = window as typeof window & { YT?: { Player: YTPlayerCtor } };
        if (!w.YT?.Player) {
          setStatus("error");
          setErrorMessage("YouTube's player didn't load.");
          return;
        }
        const player = new w.YT.Player(containerRef.current, {
          videoId,
          playerVars: { playsinline: 1 },
          events: {
            onReady: () => {
              if (cancelled) return;
              controllerRef.current = new YouTubeSyncController(player, { offsetSeconds, bpm });
              setAvailableRates(player.getAvailablePlaybackRates());
              setStatus("ready");
            },
            onError: () => {
              if (cancelled) return;
              setStatus("error");
              setErrorMessage("This video can't be played here — try practice mode instead.");
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage("Couldn't reach YouTube — try practice mode instead.");
        }
      });

    return () => {
      cancelled = true;
      controllerRef.current = null;
    };
    // Only re-run when the video or enabled-ness changes — offset/bpm
    // are pushed to the existing controller below instead of recreating
    // the player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, enabled]);

  useEffect(() => {
    controllerRef.current?.setOffset(offsetSeconds);
  }, [offsetSeconds]);

  useEffect(() => {
    controllerRef.current?.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    if (status !== "ready") return;
    function loop() {
      const controller = controllerRef.current;
      if (controller) {
        setBeat(controller.getBeat());
        setPlaying(controller.isPlaying());
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [status]);

  function toggle() {
    controllerRef.current?.toggle();
  }

  function seek(targetBeat: number) {
    controllerRef.current?.seek(targetBeat);
    setBeat(targetBeat);
  }

  function setPlaybackRate(rate: number) {
    controllerRef.current?.setPlaybackRate(rate);
  }

  return { containerRef, status, errorMessage, beat, playing, toggle, seek, availableRates, setPlaybackRate };
}
