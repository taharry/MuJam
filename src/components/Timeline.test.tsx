// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import Timeline from "./Timeline";
import { buildArrangement } from "../lib/arrangement";

afterEach(cleanup);

const arrangement = buildArrangement({
  bpm: 100,
  beatsPerBar: 4,
  sections: [
    { name: "Verse", chords: [{ chord: "C", beats: 4 }, { chord: "G", beats: 4 }] },
    { name: "Chorus", chords: [{ chord: "Am", beats: 4 }, { chord: "F", beats: 4 }] },
  ],
});

describe("Timeline", () => {
  it("renders every chord event and section", () => {
    render(<Timeline arrangement={arrangement} beat={0} onSeek={() => {}} />);
    expect(screen.getByText("C")).toBeTruthy();
    expect(screen.getByText("G")).toBeTruthy();
    expect(screen.getByText("Am")).toBeTruthy();
    expect(screen.getByText("F")).toBeTruthy();
    expect(screen.getByTitle("Verse")).toBeTruthy();
    expect(screen.getByTitle("Chorus")).toBeTruthy();
  });

  it("marks the chord containing the current beat as active", () => {
    render(<Timeline arrangement={arrangement} beat={5} onSeek={() => {}} />);
    // beat 5 falls in the second event (G, beats 4-8)
    const active = screen.getByLabelText(/^G,.*now playing/);
    expect(active).toBeTruthy();
  });

  it("marks already-played chords as past and later ones as upcoming", () => {
    render(<Timeline arrangement={arrangement} beat={5} onSeek={() => {}} />);
    // beat 5: C (0-4) is past, G (4-8) is active, Am/F (8-16) are upcoming
    expect(screen.getByLabelText(/^C,/).className).toContain("timeline__chord--past");
    expect(screen.getByLabelText(/^Am,/).className).toContain("timeline__chord--upcoming");
  });

  it("clicking a chord seeks to its start beat", () => {
    const onSeek = vi.fn();
    render(<Timeline arrangement={arrangement} beat={0} onSeek={onSeek} />);
    fireEvent.click(screen.getByText("Am"));
    expect(onSeek).toHaveBeenCalledWith(8);
  });

  it("dragging the scrub rail seeks, snapping to a whole beat by default", () => {
    const onSeek = vi.fn();
    render(<Timeline arrangement={arrangement} beat={0} onSeek={onSeek} />);
    const rail = screen.getByLabelText("Seek within the song, in beats");
    fireEvent.change(rail, { target: { value: "6" } });
    expect(onSeek).toHaveBeenCalledWith(6);
  });

  it("turning off snap-to-beat allows a fractional seek step", () => {
    const onSeek = vi.fn();
    render(<Timeline arrangement={arrangement} beat={0} onSeek={onSeek} />);
    fireEvent.click(screen.getByLabelText("Snap to beat"));
    const rail = screen.getByLabelText("Seek within the song, in beats");
    expect(rail.getAttribute("step")).toBe("0.05");
  });
});
