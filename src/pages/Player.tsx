import { Navigate, useNavigate, useParams } from "react-router-dom";
import { resolveSong } from "../lib/customSongs";
import { INSTRUMENTS, isInstrumentId } from "../data/instruments";
import Player, { type ViewMode } from "../components/Player";
import Divider from "../components/Divider";

const VALID_MODES: ViewMode[] = ["chords", "visual", "both"];

export default function PlayerPage() {
  const { songId, instrument, mode } = useParams<{
    songId: string;
    instrument: string;
    mode: string;
  }>();
  const navigate = useNavigate();
  const song = songId ? resolveSong(songId) : undefined;
  const viewMode = VALID_MODES.includes(mode as ViewMode) ? (mode as ViewMode) : "both";

  if (!song || !isInstrumentId(instrument)) return <Navigate to="/" replace />;

  return (
    <div className="player-page">
      <div className="player-page__header">
        <button className="back-link" onClick={() => navigate("/")}>
          ← Home
        </button>
        <div className="mode-switch">
          {VALID_MODES.map((m) => (
            <button
              key={m}
              className={`mode-switch__item${m === viewMode ? " mode-switch__item--active" : ""}`}
              onClick={() => navigate(`/song/${song.id}/play/${instrument}/${m}`)}
            >
              {m === "chords" ? "Chords" : m === "visual" ? "Visual" : "Both"}
            </button>
          ))}
        </div>
      </div>
      <h1>{song.title}</h1>
      <p className="player-page__meta">
        <em>{song.artist}</em> · {INSTRUMENTS.find((i) => i.id === instrument)?.label}
      </p>
      <Divider />
      <Player song={song} instrument={instrument} mode={viewMode} />
      <button
        className="btn change-instrument-btn"
        onClick={() => navigate(`/song/${song.id}`)}
      >
        Change instrument
      </button>
    </div>
  );
}
