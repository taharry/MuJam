import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { resolveSong } from "../lib/customSongs";
import { getArrangement } from "../data/songs";
import { INSTRUMENTS, isInstrumentId } from "../data/instruments";
import { isFavorite } from "../lib/favorites";
import Player, { type ViewMode } from "../components/Player";
import FavoriteButton from "../components/FavoriteButton";

const ARRANGEMENT_LABEL = {
  verified: "Full arrangement",
  simplified: "Simplified progression",
  imported: "Your imported draft",
} as const;

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
  const [focusMode, setFocusMode] = useState(false);

  if (!song || !isInstrumentId(instrument)) return <Navigate to="/" replace />;

  const arrangementSource = getArrangement(song).source;

  return (
    <div className={`player-page${focusMode ? " player-page--focus" : ""}`}>
      {!focusMode && (
        <>
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
          <div className="song-detail__title-row">
            <h1>{song.title}</h1>
            <FavoriteButton songId={song.id} initialFavorite={isFavorite(song.id)} size={22} />
          </div>
          <p className="player-page__meta">
            <em>{song.artist}</em> · {INSTRUMENTS.find((i) => i.id === instrument)?.label}
            {" · "}
            <span className={`song-card__badge song-card__badge--arrangement-${arrangementSource}`}>
              {ARRANGEMENT_LABEL[arrangementSource]}
            </span>
          </p>
        </>
      )}
      <Player
        song={song}
        instrument={instrument}
        mode={viewMode}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((f) => !f)}
      />
      {!focusMode && (
        <button className="btn change-instrument-btn" onClick={() => navigate(`/song/${song.id}`)}>
          Change instrument
        </button>
      )}
    </div>
  );
}
