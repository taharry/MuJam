# MuJam

Pick a song, pick an instrument, start playing. MuJam is a web app that turns any song in its library into a guided, on-screen chord tutorial — no sheet music, no audio transcription, no lesson plans to sit through first.

## How it works

1. **Search for a song** — search by title/artist or paste a YouTube link.
2. **Pick an instrument** — ukulele, guitar, bass, or piano.
3. **Follow along** — the tutorial shows the current chord, its fingering diagram, and a beat-synced strum guide so you always know what to play and when.

## Features

- **Beat-synced playback** with an adjustable-speed metronome, loop mode, and a strum-pattern guide that highlights where you are in the bar
- **Chord and visual views** — read chord names, see fingering diagrams, or both at once
- **No account, no backend** — runs entirely client-side as a static site

The song library and instrument support are both actively growing — more songs, genres, and instruments are being added over time.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev/build tooling
- [React Router](https://reactrouter.com/) (hash-based routing for static hosting)
- Web Audio API for the metronome click track

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

### Other scripts

```bash
npm run build    # type-check and build for production
npm run preview  # preview the production build locally
npm run lint      # lint with oxlint
```

## Project structure

```
src/
  components/   UI components (player, chord diagrams, icons, etc.)
  data/         song library, instrument chord data, strum patterns
  lib/          music theory engine, YouTube link resolution
  pages/        route-level pages (Home, Song Detail, Player)
```

## Chord data

Chord data is sourced and cross-checked from publicly available chord charts, keyed by title/artist/tempo. No lyrics or copyrighted media are stored — only chord names and song metadata.
