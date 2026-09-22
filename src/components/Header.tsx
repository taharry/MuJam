import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="app-header">
      <Link to="/" className="app-header__brand">
        🎶 MuJam
      </Link>
    </header>
  );
}
