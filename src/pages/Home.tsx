import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchSongs, SONGS, type Song } from "../data/songs";
import { extractYouTubeUrl, resolveYouTubeTitle } from "../lib/youtube";
import { listCustomSongs, resolveSong } from "../lib/customSongs";
import { getRecentSongIds } from "../lib/recentSongs";
import { getFavoriteIds } from "../lib/favorites";
import BrandMotif from "../components/BrandMotif";
import SongCard from "../components/SongCard";
import Divider from "../components/Divider";

export default function Home() {
  const [query, setQuery] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolvedFrom, setResolvedFrom] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const navigate = useNavigate();

  const customSongs = useMemo(() => listCustomSongs(), []);

  // Each row is deduplicated against every row already built above it
  // in one pass — Favorites (explicit, permanent intent) wins, then
  // Recently played (explicit, recent intent), then the curated Full
  // arrangements and Great for beginners rows — so the page reads as
  // curated rather than the same handful of songs padding every
  // section. "Your imports" stays separate: it's a different kind of
  // content (yours, not catalog curation), so it isn't deduplicated
  // against the rows above.
  const { favoriteSongs, recentSongs, featuredSongs, beginnerSongs } = useMemo(() => {
    const usedIds = new Set<string>();
    function dedupe(songs: Song[]): Song[] {
      const unique = songs.filter((s) => !usedIds.has(s.id));
      unique.forEach((s) => usedIds.add(s.id));
      return unique;
    }
    // Favorited/recently-played ids might point at a deleted custom
    // import, or (in principle) a catalog id that no longer exists —
    // resolveSong simply returns undefined for those, quietly dropped
    // here rather than showing a broken card.
    const favorites = dedupe(getFavoriteIds().map((id) => resolveSong(id)).filter((s): s is Song => !!s));
    const recent = dedupe(getRecentSongIds().map((id) => resolveSong(id)).filter((s): s is Song => !!s));
    const featured = dedupe(SONGS.filter((s) => s.verifiedArrangement));
    const beginner = dedupe(SONGS.filter((s) => s.difficulty === "easy")).slice(0, 6);
    return { favoriteSongs: favorites, recentSongs: recent, featuredSongs: featured, beginnerSongs: beginner };
  }, []);

  const results = useMemo(() => searchSongs(query), [query]);
  const hasQuery = query.trim().length > 0;

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
        <BrandMotif />
        <h1>Pick a song. Pick your instrument. Play.</h1>
        <p className="hero__subtitle">
          Chord diagrams, a beat-synced strum guide, and a real practice timeline — follow along on ukulele,
          guitar, bass, or piano.
        </p>

        <form className="search-bar" onSubmit={handleSearch}>
          <label htmlFor="song-search" className="search-bar__label">
            Search a song or paste a YouTube link
          </label>
          <div className="search-bar__row">
            <input
              id="song-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. “Wonderwall” or a youtube.com link"
              autoComplete="off"
            />
            <button type="submit" disabled={resolving}>
              {resolving ? "Looking up…" : "Find song"}
            </button>
          </div>
        </form>

        <button className="link-btn import-audio-link" onClick={() => navigate("/import")}>
          Or import a recording of your own →
        </button>

        {resolvedFrom && <p className="hero__resolved">Matched from: {resolvedFrom}</p>}
        {notFound && (
          <div className="hero__notfound">
            <p>That song isn't in the library yet — try a different title or artist.</p>
            <button className="link-btn" onClick={() => navigate("/import")}>
              Or import your own recording →
            </button>
          </div>
        )}

        {hasQuery && (
          <div className="search-results">
            {results.length > 0 ? (
              <div className="song-grid">
                {results.map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            ) : (
              !notFound && <p className="search-results__hint">No matches yet — keep typing, or try an artist name.</p>
            )}
          </div>
        )}
      </section>

      {!hasQuery && (
        <>
          <Divider />

          {favoriteSongs.length > 0 && <DiscoverySection title="Favorites" songs={favoriteSongs} />}
          {recentSongs.length > 0 && <DiscoverySection title="Recently played" songs={recentSongs} />}
          <DiscoverySection
            title="Full arrangements"
            subtitle="Real song structure, chords cross-checked against published charts"
            songs={featuredSongs}
          />
          <DiscoverySection title="Great for beginners" songs={beginnerSongs} />
          {customSongs.length > 0 && <DiscoverySection title="Your imports" songs={customSongs} />}
        </>
      )}
    </div>
  );
}

function DiscoverySection({ title, subtitle, songs }: { title: string; subtitle?: string; songs: Song[] }) {
  if (songs.length === 0) return null;
  return (
    <section className="discovery-section">
      <h2>{title}</h2>
      {subtitle && <p className="discovery-section__subtitle">{subtitle}</p>}
      <div className="song-grid">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </section>
  );
}
