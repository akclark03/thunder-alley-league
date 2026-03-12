import type { Race, InsertRace } from "@shared/schema";

export interface IStorage {
  getRaces(): Promise<Race[]>;
  getRace(id: number): Promise<Race | undefined>;
  createRace(race: InsertRace): Promise<Race>;
  getNextRaceNum(): Promise<number>;
}

export class MemStorage implements IStorage {
  private races: Map<number, Race> = new Map();
  private counter = 1;

  async getRaces(): Promise<Race[]> {
    return Array.from(this.races.values()).sort((a, b) => a.raceNum - b.raceNum);
  }

  async getRace(id: number): Promise<Race | undefined> {
    return this.races.get(id);
  }

  async createRace(data: InsertRace): Promise<Race> {
    const race: Race = { ...data, id: this.counter++ };
    this.races.set(race.id, race);
    return race;
  }

  async getNextRaceNum(): Promise<number> {
    const races = await this.getRaces();
    if (races.length === 0) return 1;
    return Math.max(...races.map((r) => r.raceNum)) + 1;
  }
}

export const storage = new MemStorage();
