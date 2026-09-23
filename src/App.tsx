import { HashRouter, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import SongDetail from "./pages/SongDetail";
import PlayerPage from "./pages/Player";
import ImportAudio from "./pages/ImportAudio";
import "./App.css";

function App() {
  return (
    <HashRouter>
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/import" element={<ImportAudio />} />
          <Route path="/song/:songId" element={<SongDetail />} />
          <Route path="/song/:songId/play/:instrument/:mode" element={<PlayerPage />} />
        </Routes>
      </main>
    </HashRouter>
  );
}

export default App;
