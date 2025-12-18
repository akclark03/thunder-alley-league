"""JSON config/race I/O and season CSV conversion utilities."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd

CURRENT_SEASON = 2
BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_DIR = BASE_DIR / "config"
DATA_DIR = BASE_DIR / "data"
RAW_RACES_DIR = DATA_DIR / "raw"
SEASON_DIR = DATA_DIR / "season"
SEASON_CSV_PATH = SEASON_DIR / f"season_{CURRENT_SEASON}_results.csv"  # Change this


# ---------- JSON helpers ----------


def load_json(path: Path) -> Any:
    """Read and parse JSON file."""
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def save_json(obj: Any, path: Path) -> None:
    """Write object to JSON file, creating parent dirs if needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)


# ---------- Config loaders ----------


def load_drivers() -> Dict[str, Dict[str, Any]]:
    """Load drivers config keyed by carNumber."""
    data = load_json(CONFIG_DIR / "drivers.json")
    return data["drivers"]


def load_team_owners() -> Dict[str, str | None]:
    """Load team->owner mapping."""
    data = load_json(CONFIG_DIR / "team_owners.json")
    return data["teamOwners"]


def load_pole_position() -> Dict[str, int]:
    """Load team->pole position ranking."""
    data = load_json(CONFIG_DIR / "pole_position.json")
    return data["polePosition"]


def load_tracks() -> Dict[str, Dict[str, Any]]:
    """Load track configurations."""
    data = load_json(CONFIG_DIR / "tracks.json")
    return data["tracks"]


def load_points_structure() -> Dict[str, Any]:
    """Load race and playoff points structure."""
    data = load_json(CONFIG_DIR / "points_structure.json")
    return data


# ---------- Per-race JSON ----------


def save_race(race_obj: Dict[str, Any]) -> Path:
    """Save race JSON to data/raw/race_{date}_r{num}.json."""
    RAW_RACES_DIR.mkdir(parents=True, exist_ok=True)
    fname = f"race_{race_obj['date']}_r{race_obj['raceNum']}.json"
    path = RAW_RACES_DIR / fname
    save_json(race_obj, path)
    return path


def load_all_races() -> List[Dict[str, Any]]:
    """Load all race JSONs from data/raw/ sorted by filename."""
    if not RAW_RACES_DIR.exists():
        return []
    races: List[Dict[str, Any]] = []
    for p in sorted(RAW_RACES_DIR.glob("race_*.json")):
        races.append(load_json(p))
    return races


# ---------- Season CSV (flattened results) ----------


def races_to_season_df(races: List[Dict[str, Any]]) -> pd.DataFrame:
    """Flatten race JSONs into one row per car per race."""
    rows: List[Dict[str, Any]] = []
    for race in races:
        for r in race.get("results", []):
            rows.append(
                {
                    "date": race["date"],
                    "raceNum": race["raceNum"],
                    "trackId": race["trackId"],
                    "finish": r["finish"],
                    "carNumber": r["carNumber"],
                    "driver": r["driver"],
                    "team": r["team"],
                    "startingPos": r["startingPos"],
                    "turnsLed": r["turnsLed"],
                    "points": r["points"],
                    "playoffPoints": r["playoffPoints"],
                    "relativeFinish": r["relativeFinish"],
                    "qualifyingPoints": r["qualifyingPoints"],
                }
            )
    if not rows:
        return pd.DataFrame(
            columns=[
                "date",
                "raceNum",
                "trackId",
                "finish",
                "carNumber",
                "driver",
                "team",
                "startingPos",
                "turnsLed",
                "points",
                "playoffPoints",
                "relativeFinish",
                "qualifyingPoints",
            ]
        )
    return pd.DataFrame(rows)


def rebuild_season_csv_from_races() -> pd.DataFrame:
    """Load all race_*.json, flatten to a season DataFrame, and overwrite the CSV."""
    races = load_all_races()
    df = races_to_season_df(races)
    SEASON_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(SEASON_CSV_PATH, index=False)
    return df


def load_season_df() -> pd.DataFrame:
    """Load season CSV or return empty DataFrame with correct schema."""
    if not SEASON_CSV_PATH.exists():
        return races_to_season_df([])
    return pd.read_csv(SEASON_CSV_PATH)


# ---------- Standings saving ----------


def save_standings(
    drivers: pd.DataFrame, owners: pd.DataFrame, playoffs: pd.DataFrame
) -> None:
    """Save driver, owner, and playoff standings to data/season/ directory."""
    SEASON_DIR.mkdir(parents=True, exist_ok=True)

    drivers.to_csv(SEASON_DIR / "driver_standings.csv", index=False)
    owners.to_csv(SEASON_DIR / "owner_standings.csv", index=False)
    playoffs.to_csv(SEASON_DIR / "playoff_standings.csv", index=False)
