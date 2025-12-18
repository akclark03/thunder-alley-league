# Thunder Alley League Manager

A Python-based race management system for tracking Thunder Alley board game league seasons. Manage races, calculate standings, and maintain historical season data with JSON-based configuration and CSV exports.

## Features

- **Interactive Race Management**: Run races with team/track selection, qualifying, and result entry
- **Automated Scoring**: Points calculation including race points, playoff points, qualifying points, and team bonuses
- **Season Tracking**: Persistent storage of race results and cumulative season statistics
- **Standings Calculation**: Driver, owner, and playoff standings with tie-breakers
- **Team Results**: Track team performance per race with aggregate statistics
- **Configurable Rules**: JSON-based points structures and league configuration

## Project Structure

```bash
thunder-alley-league/
├── config/ # League configuration files
│ ├── points_structure.json # Race and playoff points definitions
│ ├── pole_position.json # Team pole position rankings
│ ├── drivers.json # Driver and team roster
│ ├── team_owners.json # Team ownership mapping
│ └── tracks.json # Track definitions
├── data/
│ ├── raw/ # Individual race JSONs (race_*.json)
│ └── season/ # Season aggregate data
│ ├── season_2_results.csv # All race results (current season)
│ ├── driver_standings.csv # Driver standings
│ ├── owner_standings.csv # Owner/team standings
│ └── playoff_standings.csv # Playoff points standings
├── doc/ # League rules documentation
└── thunder_alley_league/ # Python package
├── init.py
├── main.py # CLI entry point
├── io_utils.py # File I/O and data loading
├── qualifying.py # Qualifying and grid generation
├── race.py # Race orchestration and user interaction
├── scoring.py # Points calculation logic
└── standings.py # Standings aggregation
```

## Installation

### Clone the repository

```bash
git clone <repo-url>
cd thunder-alley-league
```

### Create virtual environment (optional but recommended)

The project uses conda for dependency management. See `environment.yml`:

```bash
conda env create -f environment.yml
```

## Usage

### Activate the environment (if not already active)

```bash
conda activate thunder-alley-league
```

### Run the league manager

```bash
python -m thunder_alley_league.main
```

### Main Menu Options

#### 1. Start a race**

- Select number of players (2-7)
- Choose teams (3-4 cars per team based on player count)
- Select track
- View qualifying/starting grid
- Enter finishing positions and turns led
- Automatically saves race results and updates season

#### 2. Recalculate standings**

- Rebuilds season CSV from all race JSONs
- Updates driver, owner, and playoff standings
- Saves standings to CSV files

#### 3. Exit

## Scoring System

### Race Points

- Position-based points from `points_structure.json`
- +1 point per turn led
- +1 bonus point to best finisher on team that led most turns

### Playoff Points

- Position-based playoff points from `points_structure.json`

### Qualifying Points

- Position-based points from `points_structure.json`
- +4 bonus points for pole position starter

### Relative Finish

- Team-relative finishing position (1 = best on team)

## Configuration

### Season Settings

Edit `thunder_alley_league/io_utils.py` to change the current season:

```python
CURRENT_SEASON = 2 # Update for new seasons
```

### Points Structure

Edit `config/*.json`:

## Data Persistence

- **Race Data**: Each race saved as `data/raw/race_{date}_r{num}.json`
- **Season CSV**: Flattened view of all races in `data/season/season_2_results.csv`
- **Standings**: Auto-generated CSV files in `data/season/`
- **Team Results**: Included in race JSON under `teamResults`

## Development

### Adding New Features

- **Scoring logic**: Modify `scoring.py`
- **Standings calculations**: Modify `standings.py`
- **Data I/O**: Modify `io_utils.py`
- **Race workflow**: Modify `race.py`
- **Qualifying system**: Modify `qualifying.py`

## Requirements

- Python 3.10+
- pandas
- numpy

Managed via conda environment (see `environment.yml`)

## License

See LICENSE file for details.

## Documentation

See `doc/` folder for official Thunder Alley league rules and modifications.
