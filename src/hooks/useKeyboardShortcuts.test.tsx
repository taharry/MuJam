// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { isTypingTarget, useKeyboardShortcuts, type KeyboardShortcutHandlers } from "./useKeyboardShortcuts";

afterEach(cleanup);

function TestHarness({ handlers, enabled = true, dialogOpen = false }: { handlers: KeyboardShortcutHandlers; enabled?: boolean; dialogOpen?: boolean }) {
  useKeyboardShortcuts(handlers, enabled, dialogOpen);
  const [text, setText] = useState("");
  return (
    <div>
      <input aria-label="song-search" value={text} onChange={(e) => setText(e.target.value)} />
      <button>focusable button</button>
    </div>
  );
}

function press(key: string, extra: Partial<KeyboardEventInit> = {}) {
  fireEvent.keyDown(document, { key, ...extra });
}

describe("isTypingTarget", () => {
  it("treats inputs, textareas, selects, and contenteditable as typing targets", () => {
    document.body.innerHTML = `
      <input id="a" /><textarea id="b"></textarea><select id="c"></select>
      <div id="d" contenteditable="true"></div><button id="e"></button>
    `;
    expect(isTypingTarget(document.getElementById("a"))).toBe(true);
    expect(isTypingTarget(document.getElementById("b"))).toBe(true);
    expect(isTypingTarget(document.getElementById("c"))).toBe(true);
    expect(isTypingTarget(document.getElementById("d"))).toBe(true);
    expect(isTypingTarget(document.getElementById("e"))).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

describe("useKeyboardShortcuts", () => {
  it("fires the matching handler for each shortcut key", () => {
    const handlers: KeyboardShortcutHandlers = {
      onPlayPause: vi.fn(),
      onSeekBackward: vi.fn(),
      onSeekForward: vi.fn(),
      onToggleLoop: vi.fn(),
      onToggleMetronome: vi.fn(),
      onToggleHelp: vi.fn(),
    };
    render(<TestHarness handlers={handlers} />);

    press(" ");
    press("ArrowLeft");
    press("ArrowRight");
    press("l");
    press("m");
    press("?");

    expect(handlers.onPlayPause).toHaveBeenCalledTimes(1);
    expect(handlers.onSeekBackward).toHaveBeenCalledTimes(1);
    expect(handlers.onSeekForward).toHaveBeenCalledTimes(1);
    expect(handlers.onToggleLoop).toHaveBeenCalledTimes(1);
    expect(handlers.onToggleMetronome).toHaveBeenCalledTimes(1);
    expect(handlers.onToggleHelp).toHaveBeenCalledTimes(1);
  });

  it("never fires while focus is inside a text input (typing is never intercepted)", () => {
    const handlers: KeyboardShortcutHandlers = { onPlayPause: vi.fn(), onToggleLoop: vi.fn() };
    render(<TestHarness handlers={handlers} />);
    const input = screen.getByLabelText("song-search");
    input.focus();

    fireEvent.keyDown(input, { key: " " });
    fireEvent.keyDown(input, { key: "l" });

    expect(handlers.onPlayPause).not.toHaveBeenCalled();
    expect(handlers.onToggleLoop).not.toHaveBeenCalled();
  });

  it("ignores OS key-repeat for toggle keys but allows it for seeking", () => {
    const handlers: KeyboardShortcutHandlers = { onToggleLoop: vi.fn(), onSeekForward: vi.fn() };
    render(<TestHarness handlers={handlers} />);

    press("l", { repeat: true });
    expect(handlers.onToggleLoop).not.toHaveBeenCalled();

    press("ArrowRight", { repeat: true });
    expect(handlers.onSeekForward).toHaveBeenCalledTimes(1);
  });

  it("does nothing when disabled", () => {
    const handlers: KeyboardShortcutHandlers = { onPlayPause: vi.fn() };
    render(<TestHarness handlers={handlers} enabled={false} />);
    press(" ");
    expect(handlers.onPlayPause).not.toHaveBeenCalled();
  });

  it("suppresses ordinary shortcuts while the help dialog is open, but still lets Escape/? through", () => {
    const handlers: KeyboardShortcutHandlers = { onPlayPause: vi.fn(), onToggleHelp: vi.fn() };
    render(<TestHarness handlers={handlers} dialogOpen />);

    press(" ");
    expect(handlers.onPlayPause).not.toHaveBeenCalled();

    press("Escape");
    expect(handlers.onToggleHelp).toHaveBeenCalledTimes(1);
  });

  it("ignores keys combined with modifier keys, to avoid overriding browser/OS shortcuts", () => {
    const handlers: KeyboardShortcutHandlers = { onPlayPause: vi.fn() };
    render(<TestHarness handlers={handlers} />);
    press(" ", { ctrlKey: true });
    expect(handlers.onPlayPause).not.toHaveBeenCalled();
  });

  it("only attaches one listener per enabled/dialogOpen change, not one per render", () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const handlersA: KeyboardShortcutHandlers = { onPlayPause: vi.fn() };
    const { rerender } = render(<TestHarness handlers={handlersA} />);
    const callsAfterMount = addSpy.mock.calls.filter((c) => c[0] === "keydown").length;

    // Re-render with a brand-new handlers object (as would happen on
    // every parent re-render) — the listener itself should not be
    // re-added, since the hook only depends on enabled/dialogOpen.
    rerender(<TestHarness handlers={{ onPlayPause: vi.fn() }} />);
    const callsAfterRerender = addSpy.mock.calls.filter((c) => c[0] === "keydown").length;

    expect(callsAfterRerender).toBe(callsAfterMount);
    addSpy.mockRestore();
  });
});
