import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { decodeAudioFile, type DecodedAudio } from "../lib/audioDecode";
import { estimateBpm, estimateChords, type ChordEstimate } from "../lib/audioAnalysis";
import { secondsToBeats } from "../lib/time";
import { saveCustomSong, makeCustomSongId } from "../lib/customSongs";
import type { Song } from "../data/songs";
import Waveform from "../components/Waveform";
import Divider from "../components/Divider";
import { IconPause, IconPlay } from "../components/icons";

type Status = "idle" | "working" | "ready" | "error";

export default function ImportAudio() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [decoded, setDecoded] = useState<DecodedAudio | null>(null);
  const [bpm, setBpm] = useState(120);
  const [bpmAlternatives, setBpmAlternatives] = useState<number[]>([]);
  const [segments, setSegments] = useState<ChordEstimate[]>([]);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [playheadSeconds, setPlayheadSeconds] = useState(0);

  const playCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playStartedAtRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      sourceRef.current?.stop();
      playCtxRef.current?.close();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  async function handleFile(file: File) {
    setStatus("working");
    setErrorMessage(null);
    setFileName(file.name);
    setSegments([]);
    setSavedId(null);
    try {
      const audio = await decodeAudioFile(file);
      setDecoded(audio);
      const bpmResult = estimateBpm(audio.channelData, audio.sampleRate);
      setBpm(bpmResult.bpm);
      setBpmAlternatives(bpmResult.alternatives);
      const chordResult = estimateChords(audio.channelData, audio.sampleRate);
      setSegments(chordResult);
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Couldn't analyze this file.");
    }
  }

  function onFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function updateSegment(index: number, patch: Partial<ChordEstimate>) {
    setSegments((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function deleteSegment(index: number) {
    setSegments((prev) => prev.filter((_, i) => i !== index));
  }

  function addSegment() {
    const last = segments[segments.length - 1];
    const startSeconds = last ? last.startSeconds + last.durationSeconds : 0;
    setSegments((prev) => [...prev, { startSeconds, durationSeconds: 2, chord: "C", confidence: 1 }]);
  }

  function stopPreview() {
    sourceRef.current?.stop();
    sourceRef.current = null;
    setPlaying(false);
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }

  function playPreview() {
    if (!decoded) return;
    if (!playCtxRef.current) playCtxRef.current = new AudioContext();
    const ctx = playCtxRef.current;
    const source = ctx.createBufferSource();
    source.buffer = decoded.buffer;
    source.connect(ctx.destination);
    const offset = playheadSeconds;
    source.start(0, offset);
    sourceRef.current = source;
    playStartedAtRef.current = ctx.currentTime - offset;
    setPlaying(true);
    source.onended = () => {
      setPlaying(false);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };

    function tick() {
      if (!playCtxRef.current) return;
      setPlayheadSeconds(playCtxRef.current.currentTime - playStartedAtRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function togglePreview() {
    if (playing) stopPreview();
    else playPreview();
  }

  function handleSave() {
    if (!decoded || segments.length === 0) return;
    const events = segments.map((s) => ({
      chord: s.chord,
      startBeat: secondsToBeats(s.startSeconds, bpm),
      durationBeats: Math.max(0.25, secondsToBeats(s.durationSeconds, bpm)),
    }));
    const id = makeCustomSongId();
    const song: Song = {
      id,
      title: title.trim() || fileName.replace(/\.[^.]+$/, "") || "Untitled import",
      artist: artist.trim() || "My import",
      bpm,
      beatsPerBar: 4,
      genre: "pop",
      difficulty: "medium",
      sections: [],
      importedArrangement: { events },
    };
    saveCustomSong(song);
    setSavedId(id);
  }

  return (
    <div className="import-audio">
      <button className="back-link" onClick={() => navigate("/")}>
        ← Home
      </button>
      <h1>Import audio (beta)</h1>
      <p className="import-audio__intro">
        Upload a local recording and MuJam will estimate a tempo and a rough chord timeline you can correct — this
        is a draft, not a verified transcription. Pasting a YouTube link elsewhere in the app does not do this;
        analysis only runs on a file you upload here.
      </p>
      <Divider />

      {status === "idle" && (
        <label className="import-audio__dropzone">
          <input type="file" accept="audio/*" onChange={onFileInputChange} />
          Choose an audio file
        </label>
      )}

      {status === "working" && <p className="import-audio__status">Decoding and analyzing “{fileName}”…</p>}

      {status === "error" && (
        <div className="import-audio__error">
          <p>{errorMessage}</p>
          <button className="btn" onClick={() => setStatus("idle")}>
            Try a different file
          </button>
        </div>
      )}

      {status === "ready" && decoded && (
        <div className="import-audio__review">
          <Waveform channelData={decoded.channelData} durationSeconds={decoded.durationSeconds} playheadSeconds={playheadSeconds} />

          <div className="import-audio__transport">
            <button className="btn btn--icon" onClick={togglePreview} aria-label={playing ? "Pause preview" : "Play preview"}>
              {playing ? <IconPause /> : <IconPlay />}
            </button>
            <span className="import-audio__time">
              {playheadSeconds.toFixed(1)}s / {decoded.durationSeconds.toFixed(1)}s
            </span>
          </div>

          <div className="import-audio__bpm">
            <label>
              Estimated BPM:
              <input
                type="number"
                min={30}
                max={300}
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value) || bpm)}
              />
            </label>
            {bpmAlternatives.length > 0 && (
              <span className="import-audio__bpm-alts">
                Not quite right? Try:{" "}
                {bpmAlternatives.map((alt) => (
                  <button key={alt} className="chip-btn" onClick={() => setBpm(alt)}>
                    {alt}
                  </button>
                ))}
              </span>
            )}
          </div>

          <table className="import-audio__segments">
            <thead>
              <tr>
                <th>Start (s)</th>
                <th>Duration (s)</th>
                <th>Chord</th>
                <th>Confidence</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {segments.map((s, i) => (
                <tr key={i} className={s.confidence < 0.5 ? "import-audio__row--uncertain" : ""}>
                  <td>
                    <input
                      type="number"
                      step={0.1}
                      value={s.startSeconds}
                      onChange={(e) => updateSegment(i, { startSeconds: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step={0.1}
                      min={0.1}
                      value={s.durationSeconds}
                      onChange={(e) => updateSegment(i, { durationSeconds: Number(e.target.value) })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={s.chord}
                      onChange={(e) => updateSegment(i, { chord: e.target.value })}
                    />
                  </td>
                  <td>
                    <span className="confidence-badge" title={`${Math.round(s.confidence * 100)}% confidence`}>
                      {s.confidence < 0.5 ? "uncertain" : `${Math.round(s.confidence * 100)}%`}
                    </span>
                  </td>
                  <td>
                    <button className="chip-btn" onClick={() => deleteSegment(i)} aria-label="Delete segment">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn" onClick={addSegment}>
            + Add segment
          </button>

          <Divider />

          <div className="import-audio__save">
            <input
              type="text"
              placeholder="Song title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Artist (optional)"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
            <button className="btn btn--primary" onClick={handleSave} disabled={segments.length === 0}>
              Save as custom arrangement
            </button>
          </div>

          {savedId && (
            <p className="import-audio__saved">
              Saved. <button className="link-btn" onClick={() => navigate(`/song/${savedId}`)}>Go play it →</button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
