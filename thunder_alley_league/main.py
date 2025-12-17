"""Command-line entry point to run races and recalculate season standings."""

import sys

from .io_utils import load_team_owners, rebuild_season_csv_from_races, save_standings
from .race import run_race_and_save
from .standings import driver_standings, owner_standings, playoff_standings


def calculate_standings():
    """Rebuild season CSV and write driver, owner, and playoff standings files."""
    all_race_data = rebuild_season_csv_from_races()
    team_owners = load_team_owners()

    drivers = driver_standings(all_race_data)
    owners = owner_standings(all_race_data, team_owners)
    playoffs = playoff_standings(all_race_data)

    save_standings(drivers, owners, playoffs)

    return drivers, owners, playoffs


def main() -> None:
    """Interactive text menu to start races or recalculate standings."""
    while True:
        print("\n=== Main Menu ===")
        print("1) Start a race")
        print("2) Recalculate standings")
        print("3) Exit")

        choice = input("Select an option (1-3): ").strip()

        if choice == "1":
            run_race_and_save()
            rebuild_season_csv_from_races()
            print("Season CSV updated.")
            calculate_standings()
            print("Standings updated.")
            sys.exit(0)
        elif choice == "2":
            calculate_standings()
            print("Standings updated.")
            sys.exit(0)
        elif choice == "3":
            print("Goodbye!")
            sys.exit(0)
        else:
            print("Invalid choice, try again.")


if __name__ == "__main__":
    main()
