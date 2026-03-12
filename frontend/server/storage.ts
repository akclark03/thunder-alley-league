import type { Race, InsertRace, CarResult, TeamResult } from "@shared/schema";
import fs from "fs";
import path from "path";

// ─── Standings types ──────────────────────────────────────────────────────────

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

export interface IStorage {
  getRaces(): Promise<Race[]>;
  getRace(id: number): Promise<Race | undefined>;
  createRace(race: InsertRace): Promise<Race>;
  getNextRaceNum(): Promise<number>;
  getDriverStandings(): Promise<DriverStanding[]>;
  getOwnerStandings(teamOwners: Record<string, string | null>): Promise<OwnerStanding[]>;
  getPlayoffStandings(): Promise<PlayoffStanding[]>;
}

// ─── Standings computation (mirrors standings.py logic) ───────────────────────

function computeDriverStandings(races: Race[]): DriverStanding[] {
  const driverMap: Record<string, {
    carNumber: number; driver: string; team: string;
    points: number; starts: number; wins: number;
    top5s: number; top10s: number; turnsLed: number; playoffPoints: number;
  }> = {};

  for (const race of races) {
    const results = race.results as CarResult[];
    for (const r of results) {
      const key = `${r.carNumber}`;
      if (!driverMap[key]) {
        driverMap[key] = {
          carNumber: r.carNumber, driver: r.driver, team: r.team,
          points: 0, starts: 0, wins: 0, top5s: 0, top10s: 0, turnsLed: 0, playoffPoints: 0,
        };
      }
      const d = driverMap[key];
      const finish = typeof r.finish === "number" ? r.finish : null;
      if (finish !== null) {
        d.starts++;
        if (finish === 1) d.wins++;
        if (finish <= 5) d.top5s++;
        if (finish <= 10) d.top10s++;
      }
      d.points += r.points ?? 0;
      d.turnsLed += r.turnsLed ?? 0;
      d.playoffPoints += r.playoffPoints ?? 0;
    }
  }

  const rows = Object.values(driverMap);
  rows.sort((a, b) =>
    b.points - a.points || b.wins - a.wins || b.top5s - a.top5s ||
    b.top10s - a.top10s || b.turnsLed - a.turnsLed
  );
  const maxPts = rows[0]?.points ?? 0;
  return rows.map((d, i) => ({ position: i + 1, behind: maxPts - d.points, ...d }));
}

function computeOwnerStandings(
  races: Race[],
  teamOwners: Record<string, string | null>
): OwnerStanding[] {
  const teamMap: Record<string, {
    points: number; wins: number; top5s: number; top10s: number; turnsLed: number;
  }> = {};

  for (const race of races) {
    const results = race.results as CarResult[];
    for (const r of results) {
      if (!teamMap[r.team]) teamMap[r.team] = { points: 0, wins: 0, top5s: 0, top10s: 0, turnsLed: 0 };
      const t = teamMap[r.team];
      const finish = typeof r.finish === "number" ? r.finish : null;
      if (finish !== null) {
        if (finish === 1) t.wins++;
        if (finish <= 5) t.top5s++;
        if (finish <= 10) t.top10s++;
      }
      t.points += r.points ?? 0;
      t.turnsLed += r.turnsLed ?? 0;
    }
  }

  const rows = Object.entries(teamMap).map(([team, stats]) => ({ team, ...stats }));
  rows.sort((a, b) =>
    b.points - a.points || b.wins - a.wins || b.top5s - a.top5s || b.top10s - a.top10s
  );
  const maxPts = rows[0]?.points ?? 0;
  return rows.map((r, i) => ({
    position: i + 1,
    owner: teamOwners[r.team] ?? null,
    team: r.team,
    points: r.points,
    behind: maxPts - r.points,
    wins: r.wins,
    top5s: r.top5s,
    top10s: r.top10s,
    turnsLed: r.turnsLed,
  }));
}

function computePlayoffStandings(races: Race[]): PlayoffStanding[] {
  const map: Record<string, {
    carNumber: number; driver: string; team: string;
    playoffPoints: number; wins: number; top5s: number; turnsLed: number;
  }> = {};

  for (const race of races) {
    const results = race.results as CarResult[];
    for (const r of results) {
      const key = `${r.carNumber}`;
      if (!map[key]) map[key] = {
        carNumber: r.carNumber, driver: r.driver, team: r.team,
        playoffPoints: 0, wins: 0, top5s: 0, turnsLed: 0,
      };
      const d = map[key];
      const finish = typeof r.finish === "number" ? r.finish : null;
      if (finish !== null) {
        if (finish === 1) d.wins++;
        if (finish <= 5) d.top5s++;
      }
      d.playoffPoints += r.playoffPoints ?? 0;
      d.turnsLed += r.turnsLed ?? 0;
    }
  }

  const rows = Object.values(map);
  rows.sort((a, b) =>
    b.playoffPoints - a.playoffPoints || b.wins - a.wins ||
    b.top5s - a.top5s || b.turnsLed - a.turnsLed
  );

  const cutline12 = rows[11]?.playoffPoints ?? 0;
  const cutline13 = rows[12]?.playoffPoints ?? null;

  return rows.slice(0, 24).map((d, i) => {
    let margin = "";
    if (rows.length >= 13 && cutline13 !== null) {
      const delta = i < 12
        ? d.playoffPoints - cutline13
        : d.playoffPoints - cutline12;
      margin = `${delta >= 0 ? "+" : ""}${delta}`;
    }
    return { position: i + 1, ...d, margin };
  });
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const DATA_DIR = path.resolve(process.cwd(), "../thunder-alley-league/data/raw");

export class MemStorage implements IStorage {
  private races: Map<number, Race> = new Map();
  private counter = 1;

  constructor() {
    this._loadExistingRaces();
  }

  private _loadExistingRaces() {
    if (!fs.existsSync(DATA_DIR)) return;
    const files = fs.readdirSync(DATA_DIR)
      .filter((f) => f.startsWith("race_") && f.endsWith(".json"))
      .sort();
    for (const file of files) {
      try {
        const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
        const obj = JSON.parse(raw);
        const race: Race = {
          id: this.counter++,
          date: obj.date,
          raceNum: obj.raceNum,
          trackId: obj.trackId,
          results: obj.results,
          teamResults: obj.teamResults ?? [],
        };
        this.races.set(race.id, race);
      } catch {}
    }
  }

  async getRaces(): Promise<Race[]> {
    return Array.from(this.races.values()).sort((a, b) => a.raceNum - b.raceNum);
  }

  async getRace(id: number): Promise<Race | undefined> {
    return this.races.get(id);
  }

  async createRace(data: InsertRace): Promise<Race> {
    const race: Race = { ...data, id: this.counter++ };
    this.races.set(race.id, race);
    // Persist to disk
    this._persistRace(race);
    return race;
  }

  private _persistRace(race: Race) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const fname = `race_${race.date}_r${race.raceNum}.json`;
      fs.writeFileSync(
        path.join(DATA_DIR, fname),
        JSON.stringify({ date: race.date, raceNum: race.raceNum, trackId: race.trackId, results: race.results, teamResults: race.teamResults }, null, 2)
      );
    } catch {}
  }

  async getNextRaceNum(): Promise<number> {
    const races = await this.getRaces();
    if (races.length === 0) return 1;
    return Math.max(...races.map((r) => r.raceNum)) + 1;
  }

  async getDriverStandings(): Promise<DriverStanding[]> {
    const races = await this.getRaces();
    return computeDriverStandings(races);
  }

  async getOwnerStandings(teamOwners: Record<string, string | null>): Promise<OwnerStanding[]> {
    const races = await this.getRaces();
    return computeOwnerStandings(races, teamOwners);
  }

  async getPlayoffStandings(): Promise<PlayoffStanding[]> {
    const races = await this.getRaces();
    return computePlayoffStandings(races);
  }
}

export const storage = new MemStorage();
