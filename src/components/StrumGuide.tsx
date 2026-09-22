import { getStrumPattern, type StrumSymbol } from "../data/strumPatterns";
import type { Genre } from "../data/songs";

interface Props {
  genre: Genre;
  beatsPerBar: number;
  activeIndex?: number;
}

const SYMBOL_LABEL: Record<StrumSymbol, string> = { D: "↓", U: "↑", "-": "" };
const SYMBOL_NAME: Record<StrumSymbol, string> = { D: "down", U: "up", "-": "skip" };

export default function StrumGuide({ genre, beatsPerBar, activeIndex = -1 }: Props) {
  const pattern = getStrumPattern(genre, beatsPerBar);

  return (
    <div className="strum-guide">
      <div className="strum-guide__title">Suggested strum pattern</div>
      <div className="strum-guide__row">
        {pattern.symbols.map((s, i) => (
          <span
            key={i}
            className={`strum-guide__cell strum-guide__cell--${SYMBOL_NAME[s]}${
              i === activeIndex ? " strum-guide__cell--now" : ""
            }`}
            title={SYMBOL_NAME[s]}
          >
            {SYMBOL_LABEL[s]}
          </span>
        ))}
      </div>
      <p className="strum-guide__tip">{pattern.tip}</p>
    </div>
  );
}
