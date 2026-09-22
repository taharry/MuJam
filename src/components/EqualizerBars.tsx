interface Props {
  active: boolean;
}

// The classic "now playing" equalizer glyph used across streaming apps —
// bars bounce while playing, sit low while paused.
export default function EqualizerBars({ active }: Props) {
  return (
    <span className={`equalizer${active ? " equalizer--active" : ""}`} aria-hidden="true">
      <span className="equalizer__bar" />
      <span className="equalizer__bar" />
      <span className="equalizer__bar" />
    </span>
  );
}
