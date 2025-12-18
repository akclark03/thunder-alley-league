"""Driver, owner, and playoff standings computation from season race data."""

import numpy as np
import pandas as pd


def driver_standings(all_race_data):
    """Aggregate driver stats and rank by points with tie-breakers."""
    driver_agg = (
        all_race_data.groupby(["carNumber", "driver", "team"], dropna=False, sort=False)
        .agg(
            points=("points", "sum"),
            starts=("finish", lambda s: np.sum(s != "DNQ")),
            wins=("finish", lambda s: np.sum(s == "1")),
            top5s=("finish", lambda s: np.sum(pd.to_numeric(s, errors="coerce") <= 5)),
            top10s=(
                "finish",
                lambda s: np.sum(pd.to_numeric(s, errors="coerce") <= 10),
            ),
            turnsLed=("turnsLed", "sum"),
            playoffPoints=("playoffPoints", "sum"),
        )
        .reset_index()
    )

    driver_agg["behind"] = driver_agg["points"].max() - driver_agg["points"]

    cols = [
        "carNumber",
        "driver",
        "team",
        "points",
        "behind",
        "starts",
        "wins",
        "top5s",
        "top10s",
        "turnsLed",
        "playoffPoints",
    ]
    driver_agg = driver_agg[cols]

    driver_agg = driver_agg.sort_values(
        by=["points", "wins", "top5s", "top10s", "turnsLed"],
        ascending=[False, False, False, False, False],
        kind="mergesort",
    )

    driver_agg.insert(0, "position", range(1, len(driver_agg) + 1))

    return driver_agg.reset_index(drop=True)


def owner_standings(all_race_data, team_owners):
    """Aggregate team stats, map to owners, and rank by points."""
    owner_agg = (
        all_race_data.groupby(["team"], dropna=False, sort=False)
        .agg(
            points=("points", "sum"),
            wins=("finish", lambda s: np.sum(s == "1")),
            top5s=("finish", lambda s: np.sum(pd.to_numeric(s, errors="coerce") <= 5)),
            top10s=(
                "finish",
                lambda s: np.sum(pd.to_numeric(s, errors="coerce") <= 10),
            ),
        )
        .reset_index()
    )

    owner_agg["behind"] = owner_agg["points"].max() - owner_agg["points"]

    owner_agg = owner_agg.sort_values(
        by=["points", "wins", "top5s", "top10s"],
        ascending=[False, False, False, False],
        kind="mergesort",
    ).reset_index(drop=True)

    owner_agg.insert(0, "position", range(1, len(owner_agg) + 1))
    owner_agg.insert(1, "owner", owner_agg["team"].map(team_owners))

    owner_standings_df = owner_agg[
        ["position", "owner", "team", "points", "behind", "wins", "top5s", "top10s"]
    ].reset_index(drop=True)
    return owner_standings_df


def playoff_standings(all_race_data):
    """Rank drivers by playoff points with +/- relative to 12th place cutline."""
    playoff_agg = (
        all_race_data.groupby(["carNumber", "driver", "team"], dropna=False, sort=False)
        .agg(
            playoffPoints=("playoffPoints", "sum"),
            wins=("finish", lambda s: np.sum(s == "1")),
            top5s=("finish", lambda s: np.sum(pd.to_numeric(s, errors="coerce") <= 5)),
            top10s=(
                "finish",
                lambda s: np.sum(pd.to_numeric(s, errors="coerce") <= 10),
            ),
            turnsLed=("turnsLed", "sum"),
        )
        .reset_index()
    )

    playoff_agg = playoff_agg.sort_values(
        by=["playoffPoints", "wins", "top5s", "top10s", "turnsLed"],
        ascending=[False, False, False, False, False],
        kind="mergesort",
    )

    playoff_agg.insert(0, "position", range(1, len(playoff_agg) + 1))

    if len(playoff_agg) < 13:  # Changed from 12 to 13
        playoff_agg["margin"] = ""
    else:
        pts_12 = playoff_agg.iloc[11]["playoffPoints"]
        pts_13 = playoff_agg.iloc[12]["playoffPoints"]

        def _pm(row):
            if pd.isna(row["playoffPoints"]):
                return ""
            if row["position"] <= 12:
                # Above cutline: show gap to 13th place
                delta = row["playoffPoints"] - pts_13
            else:
                # Below cutline: show gap to 12th place
                delta = row["playoffPoints"] - pts_12
            return f"{int(delta):+d}"

        playoff_agg["margin"] = playoff_agg.apply(_pm, axis=1)

    return playoff_agg.head(24).reset_index(drop=True)


def team_race_results(race_df: pd.DataFrame) -> pd.DataFrame:
    """Calculate total points, turns led, and average finish per team for a single race."""
    # Filter out DNQ for average finish calculation
    finishers = race_df[race_df["finish"] != "DNQ"].copy()
    finishers["finish"] = pd.to_numeric(finishers["finish"])

    team_results = (
        race_df.groupby("team", dropna=False)
        .agg(
            totalPoints=("points", "sum"),
            turnsLed=("turnsLed", "sum"),
            drivers=("driver", "count"),
        )
        .reset_index()
    )

    # get the team name that led the most turns (first occurrence on ties)
    team_with_most_led = team_results.loc[team_results["turnsLed"].idxmax(), "team"]
    team_results.loc[team_results["team"] == team_with_most_led, "totalPoints"] += 1

    # Calculate average finish for each team (only counting finishers)
    avg_finish = finishers.groupby("team")["finish"].mean().round(2)
    team_results["avgFinish"] = team_results["team"].map(avg_finish).fillna(0)

    # Sort by total points descending
    team_results = team_results.sort_values("totalPoints", ascending=False).reset_index(
        drop=True
    )
    team_results.insert(0, "position", range(1, len(team_results) + 1))

    return team_results[
        ["position", "team", "totalPoints", "turnsLed", "avgFinish", "drivers"]
    ]
