import { Navigate, useNavigate, useParams } from "react-router-dom";
import { getSongById } from "../data/songs";
import { INSTRUMENTS, type InstrumentId } from "../data/instruments";
import Divider from "../components/Divider";
import InstrumentCardArt from "../components/InstrumentCardArt";

const STRING_COUNT: Partial<Record<InstrumentId, number>> = {
  ukulele: 4,
  guitar: 6,
  bass: 4,
};

export default function SongDetail() {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const song = songId ? getSongById(songId) : undefined;

  if (!song) return <Navigate to="/" replace />;

  return (
    <div className="song-detail">
      <button className="back-link" onClick={() => navigate("/")}>
        ← Back
      </button>
      <h1>{song.title}</h1>
      <p className="song-detail__meta">
        <em>{song.artist}</em> · {song.genre} · {song.difficulty} · {song.bpm} BPM
      </p>
      <Divider />

      <h2>Choose your instrument</h2>
      <div className="instrument-picker">
        {INSTRUMENTS.map((inst) => (
          <button
            key={inst.id}
            className="instrument-card"
            onClick={() => navigate(`/song/${song.id}/play/${inst.id}/both`)}
          >
            <InstrumentCardArt
              variant={inst.id === "piano" ? "keys" : "strings"}
              strings={STRING_COUNT[inst.id]}
            />
            <div className="instrument-card__label">{inst.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
