import { useState } from "react";
import { Star } from "lucide-react";
import { toggleFavorite } from "../lib/favorites";

interface Props {
  songId: string;
  initialFavorite: boolean;
  size?: number;
  className?: string;
}

export default function FavoriteButton({ songId, initialFavorite, size = 20, className = "" }: Props) {
  const [favorite, setFavorite] = useState(initialFavorite);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation(); // never let this bubble into a parent card's own click-to-navigate
    setFavorite(toggleFavorite(songId));
  }

  return (
    <button
      className={`favorite-btn${favorite ? " favorite-btn--active" : ""} ${className}`.trim()}
      onClick={handleClick}
      aria-pressed={favorite}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      title={favorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Star size={size} fill={favorite ? "currentColor" : "none"} strokeWidth={2} />
    </button>
  );
}
