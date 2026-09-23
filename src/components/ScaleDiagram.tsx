import type { InstrumentId } from "../data/instruments";
import { NOTE_NAMES, getScaleNoteIndices, type ScaleMode } from "../lib/chordTheory";
import { GUITAR_STRING_NAMES } from "../data/instruments/guitar";
import { UKULELE_STRING_NAMES } from "../data/instruments/ukulele";
import { BASS_STRING_NAMES } from "../data/instruments/bass";
import PianoKeys from "./PianoKeys";

interface Props {
  instrument: InstrumentId;
  rootIndex: number;
  mode: ScaleMode;
  size?: number;
}

const FRETS_SHOWN = 5;

function stringPitchIndex(name: string): number {
  return NOTE_NAMES.indexOf(name.toUpperCase() as (typeof NOTE_NAMES)[number]);
}

function ScaleFretboard({
  stringNames,
  scaleSet,
  rootPitch,
  size,
}: {
  stringNames: readonly string[];
  scaleSet: Set<number>;
  rootPitch: number;
  size: number;
}) {
  const width = size;
  const height = size * 1.25;
  const padTop = height * 0.22;
  const padSide = width * 0.12;
  const nameY = padTop * 0.35;
  const openY = padTop * 0.72;
  const gridW = width - padSide * 2;
  const gridH = height - padTop - height * 0.06;
  const stringGap = gridW / (stringNames.length - 1);
  const fretGap = gridH / FRETS_SHOWN;
  const dotR = fretGap * 0.24;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect x={padSide} y={padTop} width={gridW} height={5} fill="currentColor" />
      {Array.from({ length: FRETS_SHOWN + 1 }).map((_, i) => (
        <line
          key={`fret-${i}`}
          x1={padSide}
          y1={padTop + i * fretGap}
          x2={padSide + gridW}
          y2={padTop + i * fretGap}
          stroke="currentColor"
          strokeWidth={i === 0 ? 0 : 1.5}
          opacity={0.5}
        />
      ))}
      {stringNames.map((_, i) => (
        <line
          key={`string-${i}`}
          x1={padSide + i * stringGap}
          y1={padTop}
          x2={padSide + i * stringGap}
          y2={padTop + gridH}
          stroke="currentColor"
          strokeWidth={2}
          opacity={0.7}
        />
      ))}
      {stringNames.map((n, i) => (
        <text
          key={`name-${i}`}
          x={padSide + i * stringGap}
          y={nameY}
          fontSize={11}
          textAnchor="middle"
          fill="currentColor"
        >
          {n}
        </text>
      ))}
      {stringNames.flatMap((name, i) => {
        const openIndex = stringPitchIndex(name);
        const x = padSide + i * stringGap;
        const dots = [];
        for (let fret = 0; fret <= FRETS_SHOWN; fret++) {
          const pitch = (openIndex + fret) % 12;
          if (!scaleSet.has(pitch)) continue;
          const isRoot = pitch === rootPitch;
          const y = fret === 0 ? openY : padTop + (fret - 0.5) * fretGap;
          dots.push(
            <circle
              key={`dot-${i}-${fret}`}
              cx={x}
              cy={y}
              r={isRoot ? dotR * 1.3 : dotR}
              className={`scale-diagram__dot${isRoot ? " scale-diagram__dot--root" : ""}`}
            />
          );
        }
        return dots;
      })}
    </svg>
  );
}

export default function ScaleDiagram({ instrument, rootIndex, mode, size = 160 }: Props) {
  const scaleSet = new Set(getScaleNoteIndices(rootIndex, mode));

  if (instrument === "piano") {
    return (
      <div className="scale-diagram" style={{ width: size }}>
        <PianoKeys noteSet={scaleSet} root={rootIndex} size={size} />
      </div>
    );
  }

  const stringNames =
    instrument === "guitar"
      ? GUITAR_STRING_NAMES
      : instrument === "bass"
        ? BASS_STRING_NAMES
        : UKULELE_STRING_NAMES;

  return (
    <div className="scale-diagram" style={{ width: size }}>
      <ScaleFretboard stringNames={stringNames} scaleSet={scaleSet} rootPitch={rootIndex} size={size} />
    </div>
  );
}
