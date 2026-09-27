import { Guitar, Piano, Zap } from "lucide-react";
import type { InstrumentId } from "../data/instruments";

interface Props {
  instrument: InstrumentId;
  size?: number;
}

// Real, properly-licensed icon assets (lucide-react, ISC) instead of
// hand-drawn silhouettes — no dedicated ukulele/bass/electric-guitar
// glyph exists in any standard icon set, so those reuse the same
// guitar asset, differentiated by scale and (for electric) a small
// lightning-bolt badge, rather than guessing at custom body shapes.
const SCALE: Partial<Record<InstrumentId, number>> = {
  ukulele: 0.68,
  bass: 1.15,
};

export default function InstrumentIcon({ instrument, size = 40 }: Props) {
  if (instrument === "piano") {
    return <Piano size={size} strokeWidth={1.6} aria-hidden="true" />;
  }

  const iconSize = size * (SCALE[instrument] ?? 1);

  return (
    <span className="instrument-icon" style={{ width: size, height: size }} aria-hidden="true">
      <Guitar size={iconSize} strokeWidth={1.6} className="instrument-icon__base" />
      {instrument === "electric-guitar" && (
        <Zap size={Math.max(10, size * 0.4)} strokeWidth={2.5} className="instrument-icon__badge" />
      )}
    </span>
  );
}
