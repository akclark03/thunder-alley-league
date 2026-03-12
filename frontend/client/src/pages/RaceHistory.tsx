import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSeason } from "@/contexts/SeasonContext";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Clock, ChevronDown, ChevronUp, Trophy, Flag, Car } from "lucide-react";
import type { Race } from "@shared/schema";

const TEAM_COLORS: Record<string, string> = {
  "Howitzer Racing": "bg-yellow-400",
  "Red Fury Racing": "bg-red-600",
  "Pockets Racing": "bg-green-600",
  "Quaker-Stubbs Motorsports": "bg-blue-600",
  "Mythos Motorsports": "bg-purple-600",
  "Oracle Oil Racing Team": "bg-neutral-900",
};

function teamDot(team: string) {
  return TEAM_COLORS[team] ?? "bg-primary";
}

type CarResult = {
  finish: number;
  carNumber: number;
  driver: string;
  team: string;
  startingPos: number;
  turnsLed: number;
  points: number;
  playoffPoints: number;
  qualifyingPoints: number;
};

type TeamResult = {
  position: number;
  team: string;
  totalPoints: number;
  turnsLed: number;
  avgFinish: number;
  drivers: number;
};

function RaceCard({ race }: { race: Race }) {
  const [expanded, setExpanded] = useState(false);
  const results = (race.results as CarResult[]).sort((a, b) => a.finish - b.finish);
  const teamResults = (race.teamResults as TeamResult[]).sort((a, b) => a.position - b.position);
  const winner = results[0];

  return (
    <Card className="overflow-hidden" data-testid={`card-race-${race.id}`}>
      {/* Race header — always visible */}
      <button
        className="w-full text-left"
        onClick={() => setExpanded((v) => !v)}
        data-testid={`button-expand-race-${race.id}`}
      >
        <CardHeader className="pb-3 hover:bg-muted/20 transition-colors">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <Flag className="w-4 h-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Race #{race.raceNum}</CardTitle>
                <div className="text-xs text-muted-foreground mt-0.5">{race.date} · Track: {race.trackId}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {winner && (
                <div className="flex items-center gap-2 text-xs">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <div className={`w-1.5 h-1.5 rounded-full ${teamDot(winner.team)}`} />
                  <span className="font-semibold">{winner.driver}</span>
                  <span className="text-muted-foreground hidden sm:inline">({winner.team})</span>
                </div>
              )}
              <div className="text-muted-foreground">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </CardHeader>
      </button>

      {/* Expanded results */}
      {expanded && (
        <CardContent className="pt-0 border-t border-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {/* Car results */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> Driver Results
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-1.5 px-2 text-left text-muted-foreground">Pos</th>
                      <th className="py-1.5 px-2 text-left text-muted-foreground">Car</th>
                      <th className="py-1.5 px-2 text-left text-muted-foreground">Driver</th>
                      <th className="py-1.5 px-2 text-left text-muted-foreground">Team</th>
                      <th className="py-1.5 px-2 text-right text-muted-foreground">Start</th>
                      <th className="py-1.5 px-2 text-right text-muted-foreground">Turns Led</th>
                      <th className="py-1.5 px-2 text-right text-muted-foreground">Pts</th>
                      <th className="py-1.5 px-2 text-right text-muted-foreground">P.Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr key={r.carNumber} className="border-b border-border/50 last:border-0 hover:bg-muted/10" data-testid={`row-result-${race.id}-${r.carNumber}`}>
                        <td className="py-1.5 px-2 font-bold tabular-nums">
                          {r.finish === 1 ? <span className="text-amber-500">🏆 1</span> : r.finish}
                        </td>
                        <td className="py-1.5 px-2 font-mono text-muted-foreground">#{r.carNumber}</td>
                        <td className="py-1.5 px-2 font-semibold">{r.driver}</td>
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${teamDot(r.team)}`} />
                            <span className="text-muted-foreground truncate max-w-[100px]">{r.team}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">{r.startingPos}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums">{r.turnsLed}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums font-semibold text-primary">{r.points}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-amber-600 dark:text-yellow-400 font-semibold">{r.playoffPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team results */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" /> Team Results
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-1.5 px-2 text-left text-muted-foreground">Pos</th>
                      <th className="py-1.5 px-2 text-left text-muted-foreground">Team</th>
                      <th className="py-1.5 px-2 text-right text-muted-foreground">Pts</th>
                      <th className="py-1.5 px-2 text-right text-muted-foreground">Turns Led</th>
                      <th className="py-1.5 px-2 text-right text-muted-foreground">Avg Fin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamResults.map((t) => (
                      <tr key={t.team} className="border-b border-border/50 last:border-0 hover:bg-muted/10" data-testid={`row-team-result-${race.id}-${t.team.replace(/\s+/g, "-")}`}>
                        <td className="py-1.5 px-2 font-bold tabular-nums">{t.position}</td>
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${teamDot(t.team)}`} />
                            <span className="font-semibold truncate max-w-[120px]">{t.team}</span>
                          </div>
                        </td>
                        <td className="py-1.5 px-2 text-right tabular-nums font-semibold text-primary">{t.totalPoints}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums">{t.turnsLed}</td>
                        <td className="py-1.5 px-2 text-right tabular-nums text-muted-foreground">{t.avgFinish}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function RaceHistory() {
  const { viewingSeason, isCurrentSeason } = useSeason();
  const { data: races, isLoading } = useQuery<Race[]>({
    queryKey: ["/api/races", viewingSeason],
    queryFn: () => fetch(`/api/races?season=${viewingSeason}`).then(r => r.json()),
  });

  const sorted = races ? [...races].reverse() : [];

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold" data-testid="text-page-title">Race History</h1>
            <p className="text-sm text-muted-foreground">
              Season {viewingSeason} · {isLoading ? "Loading…" : `${races?.length ?? 0} race${(races?.length ?? 0) !== 1 ? "s" : ""} run`}{!isCurrentSeason && " (past season)"}
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href="/race/new">
            <Flag className="w-4 h-4 mr-2" />
            Run a Race
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="py-20 text-center">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground/25 mb-4" />
          <p className="text-muted-foreground mb-4">No races have been run yet.</p>
          <Button asChild>
            <Link href="/race/new">Run your first race</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4" data-testid="list-race-history">
          {sorted.map((race) => (
            <RaceCard key={race.id} race={race} />
          ))}
        </div>
      )}
    </div>
  );
}
