export interface DriverStanding {
  position: number;
  carNumber: number;
  driver: string;
  team: string;
  points: number;
  behind: number;
  starts: number;
  wins: number;
  top5s: number;
  top10s: number;
  turnsLed: number;
  playoffPoints: number;
}

export interface OwnerStanding {
  position: number;
  owner: string | null;
  team: string;
  points: number;
  behind: number;
  wins: number;
  top5s: number;
  top10s: number;
  turnsLed: number;
}

export interface PlayoffStanding {
  position: number;
  carNumber: number;
  driver: string;
  team: string;
  playoffPoints: number;
  wins: number;
  top5s: number;
  turnsLed: number;
  margin: string;
}
