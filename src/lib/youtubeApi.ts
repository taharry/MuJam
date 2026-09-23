// Loads the real YouTube IFrame Player API script once per page,
// resolving when window.YT.Player is available. This is the only
// supported way to read/control an embedded video's playback position
// — there's no other API for it, and we never scrape or guess.
let apiPromise: Promise<void> | null = null;

export function loadYouTubeIframeApi(): Promise<void> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve, reject) => {
    const w = window as typeof window & {
      YT?: { Player: unknown };
      onYouTubeIframeAPIReady?: () => void;
    };
    if (w.YT?.Player) {
      resolve();
      return;
    }

    const previous = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load the YouTube player API"));
    document.head.appendChild(script);
  });

  return apiPromise;
}
