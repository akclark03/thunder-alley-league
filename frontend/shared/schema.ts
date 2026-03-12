import { pgTable, text, integer, jsonb, varchar, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ─── Race Results ────────────────────────────────────────────────────────────

export const races = pgTable("races", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  raceNum: integer("race_num").notNull(),
  trackId: text("track_id").notNull(),
  results: jsonb("results").notNull(),       // CarResult[]
  teamResults: jsonb("team_results").notNull(), // TeamResult[]
});

export const insertRaceSchema = createInsertSchema(races).omit({ id: true });
export type InsertRace = z.infer<typeof insertRaceSchema>;
export type Race = typeof races.$inferSelect;

// ─── Shared domain types (not DB tables) ────────────────────────────────────

export interface Driver {
  carNumber: number;
  driver: string;
  team: string;
}

export interface Track {
  id: string;
  name: string;
}

export interface GridRow {
  carNumber: number;
  driver: string;
  team: string;
  startingPosition: number;
}

export interface CarResult {
  finish: number | "DNQ";
  carNumber: number;
  driver: string;
  team: string;
  startingPos: number | "DNQ";
  turnsLed: number;
  points: number;
  playoffPoints: number;
  relativeFinish: number;
  qualifyingPoints: number;
}

export interface TeamResult {
  position: number;
  team: string;
  totalPoints: number;
  turnsLed: number;
  avgFinish: number;
  drivers: number;
}
