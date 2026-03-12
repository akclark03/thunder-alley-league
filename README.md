# Thunder Alley League Manager

A full-stack race management system for tracking Thunder Alley board game league seasons. Run races, track standings, and view full season history — all from a NASCAR-style web app backed by a Python scoring engine.

## Overview

The project has two main components:

| Component | Description |
|---|---|
| `thunder_alley_league/` | Python CLI — race entry, scoring, CSV exports |
| `frontend/` | Express + React web app — standings, race history, race wizard |

---

## Web App (Frontend)

A NASCAR.com-style dashboard built with **Express + Vite + React 18 + Tailwind CSS + shadcn/ui**.

### Pages

| Page | Route | Description |
|---|---|---|
| Dashboard | `/#/` | Season overview — stat cards, standings previews, recent races |
| Driver Standings | `/#/standings/drivers` | Full standings table: Pos, Car#, Driver, Team, Points, Behind, Starts, Wins, Top 5, Top 10, Turns Led, Playoff Pts |
| Owner Standings | `/#/standings/owners` | Team standings: Pos, Team, Owner, Points, Behind, Wins, Top 5, Top 10, Turns Led |
| Playoff Standings | `/#/standings/playoffs` | Top-12 cutline with +/– margin, green/red in/out styling |
| Race History | `/#/races` | Expandable race cards — driver results and team results per race |
| Run a Race | `/#/race/new` | 6-step race wizard: Players → Teams → Track → Grid → Results → Summary |

### Tech Stack

- **Backend**: Express (Node.js), in-memory storage with JSON persistence to `data/raw/`
- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query, wouter (hash routing)
- **Font**: Cabinet Grotesk
- **Theme**: Dark asphalt + red/gold racing accent

### Running the Web App

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5000`.

### Building for Production

```bash
cd frontend
npm run build
NODE_ENV=production node dist/index.cjs
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/standings/drivers` | Driver season standings |
| `GET` | `/api/standings/owners` | Owner/team standings |
| `GET` | `/api/standings/playoffs` | Playoff points standings |
| `GET` | `/api/races` | All races |
| `GET` | `/api/races/:id` | Single race detail |
| `GET` | `/api/config/teams` | Team list |
| `GET` | `/api/config/tracks` | Track list |
| `GET` | `/api/config/drivers` | Driver roster |
| `POST` | `/api/grid` | Generate starting grid |
| `POST` | `/api/race` | Score and save a race |

### Frontend Project Structure

```
frontend/
├── client/
│   └── src/
│       ├── components/
│       │   ├── app-sidebar.tsx       # Sidebar nav (logo + all routes)
│       │   └── ui/                   # shadcn/ui components
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── DriverStandings.tsx
│       │   ├── OwnerStandings.tsx
│       │   ├── PlayoffStandings.tsx
│       │   ├── RaceHistory.tsx
│       │   └── RaceWizard.tsx        # 6-step race entry wizard
│       ├── types/
│       │   └── standings.ts          # DriverStanding, OwnerStanding, PlayoffStanding
│       └── App.tsx                   # SidebarProvider shell + Router
└── server/
    ├── routes.ts                     # All API endpoints
    └── storage.ts                    # In-memory store + standings computation
```

---

## Python CLI

### Installation

```bash
git clone <repo-url>
cd thunder-alley-league
conda env create -f environment.yml
conda activate thunder-alley-league
```

### Usage

```bash
python -m thunder_alley_league.main
```

### Menu Options

1. **Start a race** — select players, teams, track; enter finishes and turns led; auto-saves results
2. **Recalculate standings** — rebuild CSVs from all race JSONs
3. **Exit**

---

## Scoring System

### Race Points

- Position-based points from `config/points_structure.json`
- +1 point per turn led (added to that driver's total)
- +1 bonus point to the team that led the most turns (best finisher on that team)

### Playoff Points

| Position | Points |
|---|---|
| 1st | 16 |
| 2nd | 12 |
| 3rd | 11 |
| 4th | 10 |
| 5th | 9 |
| 6th | 8 |
| … | strictly descending |
| 12th | 2 |
| 13th+ | 1 |

### Qualifying Points

- Position-based points from `config/points_structure.json`
- +4 bonus points for pole position starter

### Standings Tiebreakers

Driver standings: most wins → most top 5s → most top 10s → most turns led

Owner standings: most wins → most top 5s → most top 10s

Playoff standings: most wins → most top 5s → most turns led

> **Note:** Turns led is a tiebreaker in owner standings — it is not a direct points bonus for owners.

---

## Project Structure

```
thunder-alley-league/
├── config/                          # League configuration (JSON)
│   ├── points_structure.json        # Race, playoff, qualifying points
│   ├── pole_position.json           # Team pole order
│   ├── drivers.json                 # Driver roster (27 drivers, 5 active teams)
│   ├── team_owners.json             # Team → owner mapping
│   └── tracks.json                  # Track definitions
├── data/
│   ├── raw/                         # race_{date}_r{num}.json — one file per race
│   └── season/                      # Auto-generated CSVs
│       ├── season_2_results.csv
│       ├── driver_standings.csv
│       ├── owner_standings.csv
│       └── playoff_standings.csv
├── doc/                             # Official league rules
├── frontend/                        # Web app (Express + React)
└── thunder_alley_league/            # Python package
    ├── main.py                      # CLI entry point
    ├── io_utils.py                  # File I/O (CURRENT_SEASON = 2)
    ├── qualifying.py                # Grid generation
    ├── race.py                      # Race orchestration
    ├── scoring.py                   # Points calculation
    └── standings.py                 # Standings aggregation
```

---

## Teams

| Team | Color |
|---|---|
| Howitzer Racing | Red |
| Red Fury Racing | Rose |
| Pockets Racing | Blue |
| Quaker-Stubbs Motorsports | Amber |
| Mythos Motorsports | Purple |
| Oracle Oil Racing Team | Emerald |

---

## Configuration

### Change Season

Edit `thunder_alley_league/io_utils.py`:

```python
CURRENT_SEASON = 2  # increment for new seasons
```

### Points Structure

Edit `config/points_structure.json` to adjust race, playoff, or qualifying points.

---

## Requirements

- **Python**: 3.10+ — managed via conda (`environment.yml`)
- **Node.js**: 18+ — managed via npm (`frontend/package.json`)

Dependencies: `pandas`, `numpy` (Python) · `express`, `react`, `vite`, `tailwindcss`, `@tanstack/react-query` (Node)

---

## License

See `LICENSE` file for details.

## Documentation

See `doc/` for official Thunder Alley league rules and modifications.
