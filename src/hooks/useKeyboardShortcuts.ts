import { useEffect, useRef } from "react";

export interface KeyboardShortcutHandlers {
  onPlayPause?: () => void;
  onSeekBackward?: () => void;
  onSeekForward?: () => void;
  onToggleLoop?: () => void;
  onToggleMetronome?: () => void;
  onToggleHelp?: () => void;
}

// A native <input> (including a range slider, which already owns its
// own arrow-key behavior), a <textarea>, a <select>, or contenteditable
// content — never steal a keystroke from any of these.
export function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  const editable = el as HTMLElement;
  return editable.isContentEditable === true || editable.getAttribute?.("contenteditable") === "true";
}

// Centralizes every player keyboard shortcut in one listener so they
// can never fire twice from duplicate handlers, and so "don't steal
// typing" is enforced in exactly one place.
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled: boolean, dialogOpen: boolean) {
  // A ref keeps the listener itself stable across renders (attached
  // once per enabled/dialogOpen change, not on every re-render) while
  // still always calling the latest handler closures.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(document.activeElement)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return; // never override browser/OS chords

      const handlers = handlersRef.current;

      if (dialogOpen) {
        // While the shortcuts dialog itself is open, only Escape/"?"
        // reach it (to close) — everything else stays inert so a stray
        // Space/M/L doesn't fire behind an open dialog.
        if (e.key === "Escape" || e.key === "?") {
          e.preventDefault();
          handlers.onToggleHelp?.();
        }
        return;
      }

      // Toggle-style keys ignore OS key-repeat (a held key would
      // otherwise flip the state many times a second); seeking is fine
      // to repeat since holding the arrow to keep scrubbing is expected.
      switch (e.key) {
        case " ":
        case "Spacebar":
          if (e.repeat) return;
          e.preventDefault();
          handlers.onPlayPause?.();
          break;
        case "ArrowLeft":
          e.preventDefault();
          handlers.onSeekBackward?.();
          break;
        case "ArrowRight":
          e.preventDefault();
          handlers.onSeekForward?.();
          break;
        case "l":
        case "L":
          if (e.repeat) return;
          handlers.onToggleLoop?.();
          break;
        case "m":
        case "M":
          if (e.repeat) return;
          handlers.onToggleMetronome?.();
          break;
        case "?":
          if (e.repeat) return;
          e.preventDefault();
          handlers.onToggleHelp?.();
          break;
        default:
          break;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled, dialogOpen]);
}

export const KEYBOARD_SHORTCUTS = [
  { keys: "Space", description: "Play / pause" },
  { keys: "← / →", description: "Seek backward / forward one beat" },
  { keys: "L", description: "Toggle loop" },
  { keys: "M", description: "Toggle metronome" },
  { keys: "?", description: "Show this help" },
];
