"""Qualifying and starting grid construction logic."""

import random

import numpy as np
import pandas as pd

from .io_utils import load_drivers


def qualifying_sequence(all_race_data):
    """Generate weighted random qualifying ranks within each team based on
    historical qualifying points."""

    # If no historical data, return empty DataFrame
    if all_race_data.empty:
        return pd.DataFrame(columns=["carNumber", "driver", "team", "teamPosition"])

    qualifying_agg = (
        all_race_data.groupby(["carNumber", "driver", "team"], dropna=False, sort=False)
        .agg(qualifyingScore=("qualifyingPoints", "sum"))
        .reset_index()
    )

    # sort by team then score
    qualifying_agg = qualifying_agg.sort_values(
        by=["team", "qualifyingScore"],
        ascending=[True, False],
        kind="mergesort",
    ).reset_index(drop=True)

    # compute per-team total points and driver weight (share of team points)
    qualifying_agg["teamPoints"] = qualifying_agg.groupby("team")[
        "qualifyingScore"
    ].transform("sum")

    # if a team has 0 total points, give equal share to its drivers
    count_per_team = qualifying_agg.groupby("team")["carNumber"].transform("count")
    qualifying_agg["weight"] = np.where(
        qualifying_agg["teamPoints"] == 0,
        1.0 / count_per_team,
        qualifying_agg["qualifyingScore"] / qualifying_agg["teamPoints"],
    )

    # avoid zero or missing weights
    eps = 1e-6
    qualifying_agg["weight"] = (
        qualifying_agg["weight"].fillna(eps).clip(lower=eps, upper=1.0)
    )

    # generate weighted random score
    rng = np.random.default_rng()
    qualifying_agg["weightedRandScore"] = rng.random(len(qualifying_agg)) ** (
        1.0 / qualifying_agg["weight"]
    )

    # rank drivers within each team by WeightedRandScore (1 = best)
    qualifying_agg["teamQualifyingRank"] = (
        qualifying_agg.groupby("team")["weightedRandScore"]
        .rank(method="dense", ascending=False)
        .astype(int)
    )

    # select top 4 per team and show key columns
    # In qualifying_sequence(), replace the final selection line:
    # select top N per team based on total number of teams
    qualifiers = (
        qualifying_agg[qualifying_agg["teamQualifyingRank"] <= 4]
        .sort_values(["team", "teamQualifyingRank"])
        .reset_index(drop=True)
        .rename(columns={"teamQualifyingRank": "teamPosition"})
    )

    return qualifiers[["carNumber", "driver", "team", "teamPosition"]]


def starting_grid(teams, pole_position, qualifiers) -> pd.DataFrame:
    """Build starting grid by interleaving teams in pole order for each qualifying position."""

    # Determine cars per team based on number of teams
    num_teams = len(teams)
    if num_teams == 2:
        cars_per_team = 6
    if num_teams == 3:
        cars_per_team = 5
    elif num_teams == 4:
        cars_per_team = 4
    else:
        cars_per_team = 3

    drivers = load_drivers()

    # If no qualifiers (first race), build grid from drivers.json with random selection
    if qualifiers.empty:

        pole_teams = [
            team
            for team, _ in sorted(pole_position.items(), key=lambda kv: kv[1])
            if team in teams
        ]

        # Randomly select cars per team
        team_selections = {}
        for team in pole_teams:
            team_cars = [
                (int(car_num), info)
                for car_num, info in drivers.items()
                if info["team"] == team
            ]
            # Randomly select appropriate number of cars from this team
            selected = random.sample(team_cars, min(cars_per_team, len(team_cars)))
            team_selections[team] = selected

        # Build grid: cycle through teams for each position
        rows = []
        pos = 1
        for rank in range(cars_per_team):
            for team in pole_teams:
                if rank < len(team_selections[team]):
                    car_num, info = team_selections[team][rank]
                    rows.append(
                        {
                            "carNumber": car_num,
                            "driver": info["name"],
                            "team": team,
                            "startingPosition": pos,
                        }
                    )
                    pos += 1

        return pd.DataFrame(rows)

    # Normal case: use qualifying results, but fill gaps with random drivers
    pole_teams = [
        team
        for team, _ in sorted(pole_position.items(), key=lambda kv: kv[1])
        if team in teams
    ]

    # Build team selections: use qualifiers first, then fill gaps randomly
    team_selections = {}
    for team in pole_teams:
        # Get drivers from qualifiers for this team
        team_qualifiers = qualifiers[qualifiers["team"] == team].sort_values(
            "teamPosition"
        )

        # Get all available drivers for this team
        team_cars = [
            (int(car_num), info)
            for car_num, info in drivers.items()
            if info["team"] == team
        ]

        # Track which cars already qualified
        qualified_cars = set(team_qualifiers["carNumber"].astype(int).tolist())

        # Available cars for random selection (not already qualified)
        available_cars = [
            (car_num, info)
            for car_num, info in team_cars
            if car_num not in qualified_cars
        ]

        # Build selection list for this team
        selections = []
        for _, row in team_qualifiers.iterrows():
            selections.append((int(row["carNumber"]), {"name": row["driver"]}))

        # Fill remaining slots randomly if needed
        slots_needed = cars_per_team - len(selections)
        if slots_needed > 0 and available_cars:
            random_picks = random.sample(
                available_cars, min(slots_needed, len(available_cars))
            )
            selections.extend(random_picks)

        team_selections[team] = selections

    # Build grid: cycle through teams for each position
    rows = []
    pos = 1
    for rank in range(cars_per_team):
        for team in pole_teams:
            if rank < len(team_selections[team]):
                car_num, info = team_selections[team][rank]
                rows.append(
                    {
                        "carNumber": car_num,
                        "driver": info["name"],
                        "team": team,
                        "startingPosition": pos,
                    }
                )
                pos += 1

    return pd.DataFrame(rows)
