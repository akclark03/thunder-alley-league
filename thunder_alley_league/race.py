"""Race orchestration: qualifying, grid setup, interactive results, scoring, and persistence."""

import pandas as pd

from .io_utils import (
    load_points_structure,
    load_pole_position,
    load_season_df,
    load_team_owners,
    load_tracks,
    save_race,
)
from .qualifying import qualifying_sequence, starting_grid
from .scoring import build_race_results
from .standings import team_race_results


def _input_int(prompt: str, min_value: int | None = None) -> int:
    """Prompt for integer input with optional minimum value validation."""
    while True:
        try:
            val = int(input(prompt).strip())
            if min_value is not None and val < min_value:
                raise ValueError
            return val
        except (ValueError, EOFError):
            print("Invalid number, try again.")


def _select_num_players() -> int:
    """Prompt user to select number of players (2-7)."""
    while True:
        try:
            num_players = int(input("\nEnter number of players (2-7): ").strip())
            if 2 <= num_players <= 7:
                return num_players
            print("Number must be between 2 and 7.")
        except (ValueError, EOFError):
            print("Invalid number, try again.")


def _select_teams(available_teams: list[str], num_players: int) -> list[str]:
    """Prompt user to select teams for the race."""
    remaining_teams = available_teams.copy()
    selected_teams = []

    for i in range(1, num_players + 1):
        print("\nAvailable teams:")
        for idx, team in enumerate(remaining_teams, 1):
            print(f"{idx}) {team}")

        while True:
            try:
                choice = input(
                    f"\nSelect team {i}/{num_players} (1-{len(remaining_teams)}): "
                ).strip()
                team_idx = int(choice) - 1

                if team_idx < 0 or team_idx >= len(remaining_teams):
                    print(
                        f"Invalid choice. Enter a number between 1 and {len(remaining_teams)}."
                    )
                    continue

                team = remaining_teams[team_idx]
                selected_teams.append(team)
                remaining_teams.remove(team)
                break

            except (ValueError, EOFError):
                print("Invalid input. Enter a number.")

    return selected_teams


def _select_track(tracks: dict) -> str:
    """Prompt user to select a track."""
    track_list = list(tracks.items())

    print("\nAvailable tracks:")
    for idx, (track_id, track_info) in enumerate(track_list, 1):
        print(f"{idx}) {track_info['name']}")

    while True:
        try:
            choice = input(f"\nSelect track (1-{len(track_list)}): ").strip()
            track_idx = int(choice) - 1

            if track_idx < 0 or track_idx >= len(track_list):
                print(
                    f"Invalid choice. Enter a number between 1 and {len(track_list)}."
                )
                continue

            track_id, _ = track_list[track_idx]
            return track_id

        except (ValueError, EOFError):
            print("Invalid input. Enter a number.")


def _collect_finishers_interactive(grid: pd.DataFrame) -> list[dict]:
    """Collect finishing order and turns led from user input."""
    car_numbers = grid["carNumber"].astype(int)
    available = set(car_numbers.tolist())
    total_cars = len(car_numbers)
    all_results: list[dict] = []

    # Collect finishers for all cars
    print(f"\nEnter finishing positions for all {total_cars} cars:")
    for pos in range(1, total_cars + 1):
        while True:
            try:
                car_input = input(f"Enter car number for position {pos}: ").strip()

                car = int(car_input)
                if car not in available:
                    print("Car not in starting grid or already chosen, try again.")
                    continue

                turns_led = _input_int(
                    f"Enter number of turns led for car {car} (0 if none): ",
                    min_value=0,
                )

                all_results.append(
                    {"carNumber": car, "finish": pos, "turnsLed": turns_led}
                )
                available.remove(car)

                print()
                break

            except ValueError:
                print("Invalid number, try again.")

    return all_results


def run_race_and_save() -> None:
    """Execute full race workflow: qualifying, grid, results input, scoring, and save."""
    all_race_data = load_season_df()
    pole_position = load_pole_position()
    points_structure = load_points_structure()

    # Load available teams and tracks
    team_owners = load_team_owners()
    tracks = load_tracks()

    # User selections
    num_players = _select_num_players()
    selected_teams = _select_teams(list(team_owners.keys()), num_players)
    track_id = _select_track(tracks)

    # Get teams in pole order, filtered by selected teams
    pole_items = sorted(pole_position.items(), key=lambda kv: kv[1])
    teams_in_pole_order = [team for team, _ in pole_items if team in selected_teams]

    # Build qualifying and starting grid
    qualifiers = qualifying_sequence(all_race_data)
    grid = starting_grid(teams_in_pole_order, pole_position, qualifiers)

    print("\nStarting Grid:")
    print(grid.to_string(index=False))

    if grid.empty:
        print("No starters for this race.")
        return

    # Collect race results and score
    finishers = _collect_finishers_interactive(grid)
    new_race_df = build_race_results(finishers, grid, points_structure)

    team_results = team_race_results(new_race_df)
    print("\n=== Team Race Results ===")
    print(team_results.to_string(index=False))

    # Determine next race number
    next_race_num = (
        1 if all_race_data.empty else int(all_race_data["raceNum"].max()) + 1
    )

    # Build and save race object with team results
    race_obj = {
        "date": pd.Timestamp.now().strftime("%Y-%m-%d"),
        "raceNum": next_race_num,
        "trackId": track_id,
        "results": new_race_df.to_dict("records"),
        "teamResults": team_results.to_dict("records"),
    }

    path = save_race(race_obj)
    print(f"\nSaved race to {path}")
