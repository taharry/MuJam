import { describe, expect, it } from "vitest";
import { resolveCapoChord } from "./capo";

describe("resolveCapoChord", () => {
  it("passes the chord through unchanged with no capo and no transpose", () => {
    expect(resolveCapoChord("D", 0, 0)).toEqual({ soundingChord: "D", shapeChord: "D", unsupported: false });
  });

  it("with capo 2, a sounding D shows a C shape", () => {
    const r = resolveCapoChord("D", 0, 2);
    expect(r.soundingChord).toBe("D");
    expect(r.shapeChord).toBe("C");
    expect(r.unsupported).toBe(false);
  });

  it("applies transpose to the sounding chord before removing the capo offset", () => {
    // Original D, transposed up 2 (-> E), capo 2 -> shape should fall back to D.
    const r = resolveCapoChord("D", 2, 2);
    expect(r.soundingChord).toBe("E");
    expect(r.shapeChord).toBe("D");
  });

  it("transpose alone (no capo) just reports the transposed sounding chord as the shape", () => {
    const r = resolveCapoChord("D", 2, 0);
    expect(r.soundingChord).toBe("E");
    expect(r.shapeChord).toBe("E");
  });

  it("reports unsupported instead of a wrong shape for an unparseable chord", () => {
    const r = resolveCapoChord("Cadd9", 2, 2);
    expect(r.unsupported).toBe(true);
    expect(r.shapeChord).toBeNull();
  });
});
