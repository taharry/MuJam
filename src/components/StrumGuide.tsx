import { activeStrumStepIndex, type StrumPattern } from "../lib/strum";

interface Props {
  pattern: StrumPattern;
  beatPosition: number;
  playing: boolean;
}

const STROKE_LABEL: Record<StrumPattern["steps"][number]["stroke"], string> = { down: "↓", up: "↑", rest: "" };

const SOURCE_LABEL: Record<StrumPattern["source"], string> = {
  song: "Song-specific",
  genre: "Genre suggestion",
  default: "Generic pattern",
};

export default function StrumGuide({ pattern, beatPosition, playing }: Props) {
  const activeIndex = playing ? activeStrumStepIndex(pattern, beatPosition) : -1;

  return (
    <div className="strum-guide">
      <div className="strum-guide__header">
        <span className="strum-guide__title">Suggested strum pattern</span>
        <span className={`strum-guide__source strum-guide__source--${pattern.source}`}>
          {SOURCE_LABEL[pattern.source]}
        </span>
      </div>
      <div className="strum-guide__row">
        {pattern.steps.map((step, i) => (
          <span
            key={i}
            className={`strum-guide__cell strum-guide__cell--${step.stroke}${
              i === activeIndex ? " strum-guide__cell--now" : ""
            }`}
            title={step.stroke}
          >
            {STROKE_LABEL[step.stroke]}
          </span>
        ))}
      </div>
      <p className="strum-guide__tip">{pattern.tip}</p>
    </div>
  );
}
