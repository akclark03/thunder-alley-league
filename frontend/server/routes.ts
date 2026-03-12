import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRaceSchema } from "@shared/schema";
import type { GridRow, Driver, Track } from "@shared/schema";
import fs from "fs";
import path from "path";

// ─── Config paths ─────────────────────────────────────────────────────────────
// process.cwd() = project root (thunder-alley-ui) in both dev and prod
const CONFIG_DIR = path.resolve(process.cwd(), "../thunder-alley-league/config");

function loadConfig<T>(file: string): T {
  const raw = fs.readFileSync(path.join(CONFIG_DIR, file), "utf-8");
  return JSON.parse(raw);
}

// ─── Grid logic (mirrors qualifying.py / starting_grid) ──────────────────────

function buildGrid(
  selectedTeams: string[],
  polePosition: Record<string, number>,
  drivers: Record<string, { carNumber: number; driver: string; team: string }>,
  allRaceData: { team: string; carNumber: number; qualifyingPoints: number }[]
): GridRow[] {
  const numTeams = selectedTeams.length;
  let carsPerTeam: number;
  if (numTeams === 2) carsPerTeam = 6;
  else if (numTeams === 3) carsPerTeam = 5;
  else if (numTeams === 4) carsPerTeam = 4;
  else carsPerTeam = 3;

  // Sort teams by pole position (ascending = first on pole)
  const poleTeams = Object.entries(polePosition)
    .filter(([team]) => selectedTeams.includes(team))
    .sort((a, b) => a[1] - b[1])
    .map(([team]) => team);

  // Build per-team driver lists
  const allDrivers = Object.values(drivers);
  const teamSelections: Record<string, { carNumber: number; driver: string }[]> = {};

  for (const team of poleTeams) {
    const teamDrivers = allDrivers.filter((d) => d.team === team);

    if (allRaceData.length === 0) {
      // First race: random selection
      const shuffled = [...teamDrivers].sort(() => Math.random() - 0.5);
      teamSelections[team] = shuffled
        .slice(0, Math.min(carsPerTeam, shuffled.length))
        .map((d) => ({ carNumber: d.carNumber, driver: d.driver }));
    } else {
      // Weighted qualifying: aggregate points per driver
      const scores: Record<number, number> = {};
      for (const row of allRaceData) {
        if (row.team === team) {
          scores[row.carNumber] = (scores[row.carNumber] || 0) + row.qualifyingPoints;
        }
      }
      const teamTotal = Object.values(scores).reduce((a, b) => a + b, 0);

      // Weighted random (Gumbel-max / exponential trick)
      const weighted = teamDrivers.map((d) => {
        const score = scores[d.carNumber] || 0;
        const weight = teamTotal === 0 ? 1 / teamDrivers.length : score / teamTotal;
        const clipped = Math.max(weight, 1e-6);
        const randScore = Math.random() ** (1 / clipped);
        return { ...d, randScore };
      });
      weighted.sort((a, b) => b.randScore - a.randScore);
      teamSelections[team] = weighted
        .slice(0, Math.min(carsPerTeam, weighted.length))
        .map((d) => ({ carNumber: d.carNumber, driver: d.driver }));
    }
  }

  // Interleave: cycle through teams for each rank slot
  const rows: GridRow[] = [];
  let pos = 1;
  for (let rank = 0; rank < carsPerTeam; rank++) {
    for (const team of poleTeams) {
      const sel = teamSelections[team];
      if (rank < sel.length) {
        rows.push({
          carNumber: sel[rank].carNumber,
          driver: sel[rank].driver,
          team,
          startingPosition: pos++,
        });
      }
    }
  }
  return rows;
}

// ─── Scoring logic (mirrors scoring.py) ──────────────────────────────────────

function scoreRace(
  finishers: { carNumber: number; finish: number; turnsLed: number }[],
  grid: GridRow[],
  pointsStructure: {
    points: Record<string, number>;
    playoffPoints: Record<string, number>;
    qualifyingPoints: Record<string, number>;
  }
) {
  const gridIdx = Object.fromEntries(grid.map((r) => [r.carNumber, r]));

  // Team finishes map for relativeFinish
  const teamFinishes: Record<string, number[]> = {};
  for (const r of finishers) {
    const row = gridIdx[r.carNumber];
    if (!row) continue;
    if (!teamFinishes[row.team]) teamFinishes[row.team] = [];
    teamFinishes[row.team].push(r.finish);
  }
  for (const team in teamFinishes) teamFinishes[team].sort((a, b) => a - b);

  const results = finishers.map((r) => {
    const row = gridIdx[r.carNumber];
    const team = row.team;
    const finishPos = r.finish;
    const startingPos = row.startingPosition;
    const turnsLed = r.turnsLed;

    const racePoints = pointsStructure.points[String(finishPos)] ?? 0;
    const playoffPoints = pointsStructure.playoffPoints[String(finishPos)] ?? 0;

    // Qualifying points + pole bonus
    const qualBase = pointsStructure.qualifyingPoints[String(finishPos)] ?? 0;
    const qualPoints = qualBase + (startingPos === 1 ? 4 : 0);

    const totalPoints = racePoints + turnsLed;
    const relativeFinish = (teamFinishes[team]?.indexOf(finishPos) ?? 0) + 1;

    return {
      finish: finishPos,
      carNumber: r.carNumber,
      driver: row.driver,
      team,
      startingPos,
      turnsLed,
      points: totalPoints,
      playoffPoints,
      relativeFinish,
      qualifyingPoints: qualPoints,
    };
  });

  // Team results
  const teamMap: Record<string, { totalPoints: number; turnsLed: number; finishes: number[]; drivers: number }> = {};
  for (const r of results) {
    if (!teamMap[r.team]) teamMap[r.team] = { totalPoints: 0, turnsLed: 0, finishes: [], drivers: 0 };
    teamMap[r.team].totalPoints += r.points;
    teamMap[r.team].turnsLed += r.turnsLed;
    teamMap[r.team].finishes.push(r.finish as number);
    teamMap[r.team].drivers += 1;
  }

  // +1 to team with most turns led
  let maxLed = -1;
  let leadingTeam = "";
  for (const [team, stats] of Object.entries(teamMap)) {
    if (stats.turnsLed > maxLed) {
      maxLed = stats.turnsLed;
      leadingTeam = team;
    }
  }
  if (leadingTeam) teamMap[leadingTeam].totalPoints += 1;

  const teamResults = Object.entries(teamMap)
    .map(([team, stats]) => ({
      team,
      totalPoints: stats.totalPoints,
      turnsLed: stats.turnsLed,
      avgFinish: stats.finishes.length
        ? Math.round((stats.finishes.reduce((a, b) => a + b, 0) / stats.finishes.length) * 100) / 100
        : 0,
      drivers: stats.drivers,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((r, i) => ({ position: i + 1, ...r }));

  return { results, teamResults };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // Config endpoints
  app.get("/api/config/teams", (_req, res) => {
    const { teamOwners } = loadConfig<{ teamOwners: Record<string, string | null> }>("team_owners.json");
    res.json(Object.keys(teamOwners));
  });

  app.get("/api/config/tracks", (_req, res) => {
    const { tracks } = loadConfig<{ tracks: Record<string, { name: string }> }>("tracks.json");
    const list: Track[] = Object.entries(tracks).map(([id, t]) => ({ id, name: t.name }));
    res.json(list);
  });

  app.get("/api/config/drivers", (_req, res) => {
    const { drivers } = loadConfig<{ drivers: Record<string, Driver> }>("drivers.json");
    res.json(drivers);
  });

  // Generate starting grid
  app.post("/api/grid", async (req, res) => {
    try {
      const { selectedTeams } = req.body as { selectedTeams: string[] };
      const { polePosition } = loadConfig<{ polePosition: Record<string, number> }>("pole_position.json");
      const { drivers } = loadConfig<{ drivers: Record<string, Driver> }>("drivers.json");

      // Load season data for qualifying weights (from existing race records)
      const races = await storage.getRaces();
      const allRaceData: { team: string; carNumber: number; qualifyingPoints: number }[] = [];
      for (const race of races) {
        const results = race.results as { team: string; carNumber: number; qualifyingPoints: number }[];
        allRaceData.push(...results);
      }

      const grid = buildGrid(selectedTeams, polePosition, drivers, allRaceData);
      res.json(grid);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Score + save race
  app.post("/api/race", async (req, res) => {
    try {
      const { trackId, grid, finishers } = req.body as {
        trackId: string;
        grid: GridRow[];
        finishers: { carNumber: number; finish: number; turnsLed: number }[];
      };

      const pointsStructure = loadConfig<{
        points: Record<string, number>;
        playoffPoints: Record<string, number>;
        qualifyingPoints: Record<string, number>;
      }>("points_structure.json");

      const { results, teamResults } = scoreRace(finishers, grid, pointsStructure);
      const raceNum = await storage.getNextRaceNum();
      const date = new Date().toISOString().slice(0, 10);

      const saved = await storage.createRace(
        insertRaceSchema.parse({ date, raceNum, trackId, results, teamResults })
      );
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all races
  app.get("/api/races", async (_req, res) => {
    const races = await storage.getRaces();
    res.json(races);
  });

  // Get a single race by id
  app.get("/api/races/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
    const race = await storage.getRace(id);
    if (!race) return res.status(404).json({ error: "Race not found" });
    res.json(race);
  });

  // Standings endpoints
  app.get("/api/standings/drivers", async (_req, res) => {
    try {
      const standings = await storage.getDriverStandings();
      res.json(standings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/standings/owners", async (_req, res) => {
    try {
      const { teamOwners } = loadConfig<{ teamOwners: Record<string, string | null> }>("team_owners.json");
      const standings = await storage.getOwnerStandings(teamOwners);
      res.json(standings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/standings/playoffs", async (_req, res) => {
    try {
      const standings = await storage.getPlayoffStandings();
      res.json(standings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return httpServer;
}
