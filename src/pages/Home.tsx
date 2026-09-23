import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchSongs, type Song } from "../data/songs";
import { extractYouTubeUrl, resolveYouTubeTitle } from "../lib/youtube";
import { listCustomSongs } from "../lib/customSongs";
import Divider from "../components/Divider";

export default function Home() {
  const [query, setQuery] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolvedFrom, setResolvedFrom] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();
  const customSongs = useMemo(() => listCustomSongs(), []);

  const results = useMemo(() => searchSongs(query), [query]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setNotFound(false);
    setResolvedFrom(null);

    const ytUrl = extractYouTubeUrl(query);
    let effectiveQuery = query;

    if (ytUrl) {
      setResolving(true);
      const meta = await resolveYouTubeTitle(ytUrl);
      setResolving(false);
      if (meta) {
        effectiveQuery = `${meta.title} ${meta.authorName}`;
        setResolvedFrom(`${meta.title} — ${meta.authorName}`);
      }
    }

    const matches = searchSongs(effectiveQuery);
    if (matches.length > 0) {
      navigate(`/song/${matches[0].id}`);
    } else {
      setNotFound(true);
    }
  }

  return (
    <div className="home">
      <section className="hero">
        <h1>Pick a song. Pick your instrument. Play.</h1>
        <Divider />
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" disabled={resolving}>
            {resolving ? "Looking up…" : "Find song"}
          </button>
        </form>
        {resolvedFrom && (
          <p className="hero__resolved">Matched from: {resolvedFrom}</p>
        )}
        {notFound && (
          <p className="hero__notfound">
            That song isn't in the library yet — try a different title or artist.
          </p>
        )}
        {query && results.length > 0 && (
          <ul className="search-results">
            {results.map((song) => (
              <SongRow key={song.id} song={song} />
            ))}
          </ul>
        )}
        <button className="link-btn import-audio-link" onClick={() => navigate("/import")}>
          Or import a recording of your own →
        </button>
      </section>

      {customSongs.length > 0 && (
        <section className="your-imports">
          <h2>Your imports</h2>
          <ul className="search-results">
            {customSongs.map((song) => (
              <SongRow key={song.id} song={song} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SongRow({ song }: { song: Song }) {
  const navigate = useNavigate();
  return (
    <li>
      <button className="search-result" onClick={() => navigate(`/song/${song.id}`)}>
        <strong>{song.title}</strong> <span>· {song.artist}</span>
      </button>
    </li>
  );
}
