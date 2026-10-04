import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { resolveSong } from "../lib/customSongs";
import { recordRecentSong } from "../lib/recentSongs";
import { getArrangement } from "../data/songs";
import { INSTRUMENTS, type InstrumentId } from "../data/instruments";
import { isFavorite } from "../lib/favorites";
import InstrumentIcon from "../components/InstrumentIcon";
import FavoriteButton from "../components/FavoriteButton";

const INSTRUMENT_BLURB: Record<InstrumentId, string> = {
  ukulele: "4-string chord shapes",
  guitar: "6-string open & barre chords",
  "electric-guitar": "Uses the same chord shapes as acoustic guitar — pick this if you're playing an electric",
  bass: "Root-note bass line",
  piano: "Backing, triad, or two-hand voicing",
};

const ARRANGEMENT_LABEL = {
  verified: "Full arrangement",
  simplified: "Simplified progression",
  imported: "Your imported draft",
} as const;

export default function SongDetail() {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const song = songId ? resolveSong(songId) : undefined;
  const [selected, setSelected] = useState<InstrumentId | null>(null);

  useEffect(() => {
    if (song) recordRecentSong(song.id);
  }, [song]);

  if (!song) return <Navigate to="/" replace />;

  const arrangementSource = getArrangement(song).source;

  function chooseInstrument(id: InstrumentId) {
    if (!song) return;
    setSelected(id);
    window.setTimeout(() => navigate(`/song/${song.id}/play/${id}/both`), 170);
  }

  return (
    <div className="song-detail">
      <button className="back-link" onClick={() => navigate("/")}>
        ← Back
      </button>

      <header className="song-detail__header">
        <div className="song-detail__title-row">
          <h1>{song.title}</h1>
          <FavoriteButton songId={song.id} initialFavorite={isFavorite(song.id)} size={24} />
        </div>
        <p className="song-detail__meta">
          <em>{song.artist}</em> · {song.genre} · {song.bpm} BPM
        </p>
        <div className="song-detail__badges">
          <span className={`song-card__badge song-card__badge--${song.difficulty}`}>{song.difficulty}</span>
          <span className={`song-card__badge song-card__badge--arrangement-${arrangementSource}`}>
            {ARRANGEMENT_LABEL[arrangementSource]}
          </span>
        </div>
      </header>

      <h2 className="song-detail__prompt">Choose your instrument</h2>
      <div className="instrument-picker">
        {INSTRUMENTS.map((inst) => (
          <button
            key={inst.id}
            className={`instrument-card${selected === inst.id ? " instrument-card--selected" : ""}`}
            onClick={() => chooseInstrument(inst.id)}
          >
            <span className="instrument-card__icon">
              <InstrumentIcon instrument={inst.id} size={48} />
            </span>
            <span className="instrument-card__label">{inst.label}</span>
            <span className="instrument-card__blurb">{INSTRUMENT_BLURB[inst.id]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
