"""Race scoring and points calculation logic."""

from typing import Any, cast

import pandas as pd


def calc_qualifying_points(
    finish: int, starting_pos: int, points_structure: dict
) -> int:
    """Calculate qualifying points from structure plus pole position bonus."""
    qual_def = points_structure.get("qualifyingPoints", {}) or {}
    points = int(qual_def.get(str(finish), 0))

    if starting_pos == 1:
        points += 4

    return points


def _calculate_team_stats(
    results: list[dict], grid_idx: pd.DataFrame
) -> tuple[dict[str, list[int]], str | None]:
    """Calculate team finishes and identify team with most turns led."""
    team_finishes: dict[str, list[int]] = {}
    team_turns_led: dict[str, int] = {}

    for result in results:
        if result["finish"] != "DNQ":
            car = int(result["carNumber"])
            row = grid_idx.loc[car]
            team = str(row["team"])
            finish_pos = int(result["finish"])
            turns_led = int(result.get("turnsLed", 0))

            if team not in team_finishes:
                team_finishes[team] = []
                team_turns_led[team] = 0

            team_finishes[team].append(finish_pos)
            team_turns_led[team] += turns_led

    # Sort each team's finishes
    for team, finishes in team_finishes.items():
        finishes.sort()

    # Find team with most turns led
    team_with_most_led = (
        max(team_turns_led, key=lambda t: team_turns_led[t]) if team_turns_led else None
    )

    return team_finishes, team_with_most_led


def _build_dnq_result(
    car: int, row: Any, pts_def: dict, po_def: dict, qual_def: dict
) -> dict:
    """Build result dict for DNQ car."""
    return {
        "finish": "DNQ",
        "carNumber": car,
        "driver": str(row["driver"]),
        "team": str(row["team"]),
        "startingPos": "DNQ",
        "turnsLed": 0,
        "points": int(pts_def.get("DNQ", 0)),
        "playoffPoints": int(po_def.get("DNQ", 0)),
        "relativeFinish": 0,
        "qualifyingPoints": int(qual_def.get("DNQ", 0)),
    }


def _build_finisher_result(
    result: dict,
    row: Any,
    team: str,
    pts_def: dict,
    po_def: dict,
    points_structure: dict,
    team_finishes: dict[str, list[int]],
) -> dict:
    """Build result dict for finishing car."""
    finish_pos = int(result["finish"])
    starting_pos = int(cast(Any, row["startingPosition"]))
    turns_led = int(result.get("turnsLed", 0))

    race_points = int(pts_def.get(str(finish_pos), 0))
    playoff_points = int(po_def.get(str(finish_pos), 0))
    qualifying_points = calc_qualifying_points(
        finish_pos, starting_pos, points_structure
    )

    total_points = race_points + turns_led
    relative_finish = team_finishes[team].index(finish_pos) + 1

    return {
        "finish": finish_pos,
        "carNumber": int(result["carNumber"]),
        "driver": str(row["driver"]),
        "team": team,
        "startingPos": starting_pos,
        "turnsLed": turns_led,
        "points": total_points,
        "playoffPoints": playoff_points,
        "relativeFinish": relative_finish,
        "qualifyingPoints": qualifying_points,
    }


def build_race_results(
    results: list[dict],
    grid: pd.DataFrame,
    points_structure: dict,
) -> pd.DataFrame:
    """Combine starting grid + race results into scored DataFrame."""
    grid_idx = grid.set_index("carNumber")

    pts_def = points_structure.get("points", {}) or {}
    po_def = points_structure.get("playoffPoints", {}) or {}
    qual_def = points_structure.get("qualifyingPoints", {}) or {}

    team_finishes, team_with_most_led = _calculate_team_stats(results, grid_idx)

    rows: list[dict] = []
    for result in results:
        car = int(result["carNumber"])
        row = grid_idx.loc[car]
        team = str(row["team"])

        if result["finish"] == "DNQ":
            rows.append(_build_dnq_result(car, row, pts_def, po_def, qual_def))
        else:
            rows.append(
                _build_finisher_result(
                    result,
                    row,
                    team,
                    pts_def,
                    po_def,
                    points_structure,
                    team_finishes,
                    team_with_most_led,
                )
            )

    return pd.DataFrame(rows)
