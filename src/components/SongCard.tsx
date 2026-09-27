import { useNavigate } from "react-router-dom";
import { getArrangement, type Song } from "../data/songs";
import { INSTRUMENTS } from "../data/instruments";
import InstrumentIcon from "./InstrumentIcon";

interface Props {
  song: Song;
}

const ARRANGEMENT_LABEL: Record<ReturnType<typeof getArrangement>["source"], string> = {
  verified: "Full arrangement",
  simplified: "Simplified",
  imported: "Your import",
};

export default function SongCard({ song }: Props) {
  const navigate = useNavigate();
  const arrangementSource = getArrangement(song).source;
  const initial = song.title.trim().charAt(0).toUpperCase() || "?";

  return (
    <button className="song-card" onClick={() => navigate(`/song/${song.id}`)}>
      <div className="song-card__art" aria-hidden="true">
        <span className="song-card__art-letter">{initial}</span>
      </div>
      <div className="song-card__body">
        <div className="song-card__title">{song.title}</div>
        <div className="song-card__artist">{song.artist}</div>
        <div className="song-card__badges">
          <span className={`song-card__badge song-card__badge--${song.difficulty}`}>{song.difficulty}</span>
          <span className={`song-card__badge song-card__badge--arrangement-${arrangementSource}`}>
            {ARRANGEMENT_LABEL[arrangementSource]}
          </span>
        </div>
        <div className="song-card__instruments" title="Playable on every instrument">
          {INSTRUMENTS.map((inst) => (
            <InstrumentIcon key={inst.id} instrument={inst.id} size={14} />
          ))}
        </div>
      </div>
    </button>
  );
}
