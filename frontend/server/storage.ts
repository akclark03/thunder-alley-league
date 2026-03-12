import type { Race, InsertRace, CarResult } from "@shared/schema";
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

export interface SeasonMeta {
  season: number;
  raceCount: number;
  startDate: string;
  endDate: string;
  winner: string | null; // driver name with most points
}

export interface IStorage {
  // Season management
  getActiveSeason(): Promise<number>;
  setActiveSeason(season: number): Promise<void>;
  getAllSeasons(): Promise<SeasonMeta[]>;
  startNewSeason(): Promise<number>;

  // Races
  getRaces(season?: number): Promise<Race[]>;
  getRace(id: number): Promise<Race | undefined>;
  createRace(race: InsertRace): Promise<Race>;
  getNextRaceNum(season?: number): Promise<number>;

  // Standings (scoped to a season)
  getDriverStandings(season?: number): Promise<DriverStanding[]>;
  getOwnerStandings(teamOwners: Record<string, string | null>, season?: number): Promise<OwnerStanding[]>;
  getPlayoffStandings(season?: number): Promise<PlayoffStanding[]>;
}

// ─── Standings computation ───────────────────────────────────────────────────

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

// ─── Persistence paths ───────────────────────────────────────────────────────

const DATA_DIR = path.resolve(process.cwd(), "../thunder-alley-league/data/raw");
const SEASON_STATE_FILE = path.resolve(process.cwd(), "../thunder-alley-league/data/season_state.json");

// ─── Storage ─────────────────────────────────────────────────────────────────

export class MemStorage implements IStorage {
  private races: Map<number, Race> = new Map();
  private counter = 1;
  private activeSeason = 2;

  constructor() {
    this._loadSeasonState();
    this._loadExistingRaces();
  }

  // ── Season state persistence ──────────────────────────────────────────────

  private _loadSeasonState() {
    try {
      if (fs.existsSync(SEASON_STATE_FILE)) {
        const raw = fs.readFileSync(SEASON_STATE_FILE, "utf-8");
        const obj = JSON.parse(raw);
        if (typeof obj.activeSeason === "number") {
          this.activeSeason = obj.activeSeason;
        }
      }
    } catch {}
  }

  private _persistSeasonState() {
    try {
      fs.mkdirSync(path.dirname(SEASON_STATE_FILE), { recursive: true });
      fs.writeFileSync(SEASON_STATE_FILE, JSON.stringify({ activeSeason: this.activeSeason }, null, 2));
    } catch {}
  }

  // ── Race file loading ─────────────────────────────────────────────────────

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
          season: obj.season ?? 2, // backfill: existing races without season field → season 2
          date: obj.date,
          raceNum: obj.raceNum,
          trackId: obj.trackId,
          results: obj.results,
          teamResults: obj.teamResults ?? [],
        };
        this.races.set(race.id, race);
        // Backfill season field in the file if missing
        if (obj.season === undefined) {
          this._persistRace(race);
        }
      } catch {}
    }
  }

  private _persistRace(race: Race) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const fname = `race_${race.date}_r${race.raceNum}.json`;
      fs.writeFileSync(
        path.join(DATA_DIR, fname),
        JSON.stringify({
          season: race.season,
          date: race.date,
          raceNum: race.raceNum,
          trackId: race.trackId,
          results: race.results,
          teamResults: race.teamResults,
        }, null, 2)
      );
    } catch {}
  }

  // ── Season management ─────────────────────────────────────────────────────

  async getActiveSeason(): Promise<number> {
    return this.activeSeason;
  }

  async setActiveSeason(season: number): Promise<void> {
    this.activeSeason = season;
    this._persistSeasonState();
  }

  async getAllSeasons(): Promise<SeasonMeta[]> {
    const allRaces = Array.from(this.races.values());
    const bySeasonMap = new Map<number, Race[]>();

    for (const r of allRaces) {
      const s = r.season ?? 2;
      if (!bySeasonMap.has(s)) bySeasonMap.set(s, []);
      bySeasonMap.get(s)!.push(r);
    }

    // Always include activeSeason even if it has no races yet
    if (!bySeasonMap.has(this.activeSeason)) {
      bySeasonMap.set(this.activeSeason, []);
    }

    const seasons: SeasonMeta[] = [];
    for (const [season, races] of bySeasonMap) {
      const sorted = races.sort((a, b) => a.raceNum - b.raceNum);
      const standings = computeDriverStandings(races);
      seasons.push({
        season,
        raceCount: races.length,
        startDate: sorted[0]?.date ?? "",
        endDate: sorted[sorted.length - 1]?.date ?? "",
        winner: standings[0]?.driver ?? null,
      });
    }

    return seasons.sort((a, b) => a.season - b.season);
  }

  async startNewSeason(): Promise<number> {
    const allSeasons = await this.getAllSeasons();
    const maxSeason = allSeasons.reduce((m, s) => Math.max(m, s.season), 1);
    const newSeason = maxSeason + 1;
    this.activeSeason = newSeason;
    this._persistSeasonState();
    return newSeason;
  }

  // ── Races ─────────────────────────────────────────────────────────────────

  async getRaces(season?: number): Promise<Race[]> {
    const targetSeason = season ?? this.activeSeason;
    return Array.from(this.races.values())
      .filter((r) => (r.season ?? 2) === targetSeason)
      .sort((a, b) => a.raceNum - b.raceNum);
  }

  async getRace(id: number): Promise<Race | undefined> {
    return this.races.get(id);
  }

  async createRace(data: InsertRace): Promise<Race> {
    const race: Race = { ...data, season: data.season ?? this.activeSeason, id: this.counter++ };
    this.races.set(race.id, race);
    this._persistRace(race);
    return race;
  }

  async getNextRaceNum(season?: number): Promise<number> {
    const races = await this.getRaces(season);
    if (races.length === 0) return 1;
    return Math.max(...races.map((r) => r.raceNum)) + 1;
  }

  // ── Standings ─────────────────────────────────────────────────────────────

  async getDriverStandings(season?: number): Promise<DriverStanding[]> {
    const races = await this.getRaces(season);
    return computeDriverStandings(races);
  }

  async getOwnerStandings(teamOwners: Record<string, string | null>, season?: number): Promise<OwnerStanding[]> {
    const races = await this.getRaces(season);
    return computeOwnerStandings(races, teamOwners);
  }

  async getPlayoffStandings(season?: number): Promise<PlayoffStanding[]> {
    const races = await this.getRaces(season);
    return computePlayoffStandings(races);
  }
}

export const storage = new MemStorage();
