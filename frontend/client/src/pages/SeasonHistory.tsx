import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Trophy, Users, Flag } from "lucide-react";
import { useSeason, type SeasonMeta } from "@/contexts/SeasonContext";
import type { DriverStanding, OwnerStanding } from "@/types/standings";
import type { Race } from "@shared/schema";

const TEAM_COLORS: Record<string, string> = {
  "Howitzer Racing": "bg-yellow-400",
  "Red Fury Racing": "bg-red-600",
  "Pockets Racing": "bg-green-600",
  "Quaker-Stubbs Motorsports": "bg-blue-600",
  "Mythos Motorsports": "bg-purple-600",
  "Oracle Oil Racing Team": "bg-neutral-900",
};
function teamDot(team: string) { return TEAM_COLORS[team] ?? "bg-primary"; }

async function safeFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : ([] as unknown as T);
}

function PosBadge({ pos }: { pos: number }) {
  if (pos === 1) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-900 text-xs font-bold">1</span>;
  if (pos === 2) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-xs font-bold">2</span>;
  if (pos === 3) return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs font-bold">3</span>;
  return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold">{pos}</span>;
}

function SeasonCard({ meta, isActive, isSelected, onClick }: {
  meta: SeasonMeta; isActive: boolean; isSelected: boolean; onClick: () => void;
}) {
  return (
    <button
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"
      }`}
      onClick={onClick}
      data-testid={`card-season-${meta.season}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/15" : "bg-muted"}`}>
            <Flag className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Season {meta.season}</span>
              {isActive && <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-semibold text-primary border-primary/30">ACTIVE</Badge>}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {meta.raceCount === 0
                ? "No races yet"
                : `${meta.raceCount} race${meta.raceCount !== 1 ? "s" : ""}${meta.startDate ? ` · ${meta.startDate}` : ""}`}
            </div>
          </div>
        </div>
        {meta.winner && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="font-medium truncate max-w-[100px]">{meta.winner}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function DriverTable({ season }: { season: number }) {
  const { data, isLoading } = useQuery<DriverStanding[]>({
    queryKey: ["/api/standings/drivers", season],
    queryFn: () => safeFetch<DriverStanding[]>(`/api/standings/drivers?season=${season}`),
  });

  const rows = Array.isArray(data) ? data : [];

  if (isLoading) return <div className="space-y-2 p-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data for this season.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Pos","Car","Driver","Team","Pts","Behind","W","T5","T10","TL","P.Pts"].map(h => (
              <th key={h} className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left last:text-right">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((d, idx) => (
            <tr key={d.carNumber} className={`border-b border-border/60 last:border-0 hover:bg-muted/20 ${idx === 0 ? "bg-amber-400/5" : ""}`} data-testid={`row-season-driver-${d.carNumber}`}>
              <td className="px-3 py-2"><PosBadge pos={d.position} /></td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">#{d.carNumber}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${teamDot(d.team)}`} />
                  <span className="font-semibold">{d.driver}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{d.team}</td>
              <td className="px-3 py-2 font-bold tabular-nums text-primary">{d.points}</td>
              <td className="px-3 py-2 tabular-nums text-xs text-muted-foreground">{d.behind === 0 ? "—" : `-${d.behind}`}</td>
              <td className="px-3 py-2 tabular-nums">{d.wins > 0 ? <Badge variant="outline" className="text-xs font-bold text-amber-600 border-amber-400/40 bg-amber-400/10">{d.wins}</Badge> : "0"}</td>
              <td className="px-3 py-2 tabular-nums">{d.top5s}</td>
              <td className="px-3 py-2 tabular-nums">{d.top10s}</td>
              <td className="px-3 py-2 tabular-nums">{d.turnsLed}</td>
              <td className="px-3 py-2 tabular-nums text-right font-semibold text-amber-600 dark:text-yellow-400">{d.playoffPoints}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OwnerTable({ season }: { season: number }) {
  const { data, isLoading } = useQuery<OwnerStanding[]>({
    queryKey: ["/api/standings/owners", season],
    queryFn: () => safeFetch<OwnerStanding[]>(`/api/standings/owners?season=${season}`),
  });

  const rows = Array.isArray(data) ? data : [];

  if (isLoading) return <div className="space-y-2 p-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data for this season.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {["Pos","Team","Owner","Pts","Behind","W","T5","T10","TL"].map(h => (
              <th key={h} className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((o, idx) => (
            <tr key={o.team} className={`border-b border-border/60 last:border-0 hover:bg-muted/20 ${idx === 0 ? "bg-amber-400/5" : ""}`} data-testid={`row-season-owner-${o.team.replace(/\s+/g,"-")}`}>
              <td className="px-3 py-2"><PosBadge pos={o.position} /></td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${teamDot(o.team)}`} />
                  <span className="font-semibold">{o.team}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-xs text-muted-foreground">{o.owner ?? "—"}</td>
              <td className="px-3 py-2 font-bold tabular-nums text-primary">{o.points}</td>
              <td className="px-3 py-2 tabular-nums text-xs text-muted-foreground">{o.behind === 0 ? "—" : `-${o.behind}`}</td>
              <td className="px-3 py-2 tabular-nums">{o.wins > 0 ? <Badge variant="outline" className="text-xs font-bold text-amber-600 border-amber-400/40 bg-amber-400/10">{o.wins}</Badge> : "0"}</td>
              <td className="px-3 py-2 tabular-nums">{o.top5s}</td>
              <td className="px-3 py-2 tabular-nums">{o.top10s}</td>
              <td className="px-3 py-2 tabular-nums">{o.turnsLed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RaceLog({ season }: { season: number }) {
  const { data, isLoading } = useQuery<Race[]>({
    queryKey: ["/api/races", season],
    queryFn: () => safeFetch<Race[]>(`/api/races?season=${season}`),
  });

  const rows = Array.isArray(data) ? data : [];

  if (isLoading) return <div className="space-y-2 p-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No races run in this season.</p>;

  return (
    <div className="divide-y divide-border">
      {[...rows].reverse().map((r) => {
        const results = Array.isArray(r.results) ? r.results as any[] : [];
        const winner = results.find((x: any) => x.finish === 1);
        return (
          <div key={r.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/20 transition-colors" data-testid={`row-season-race-${r.id}`}>
            <div className="p-1.5 rounded bg-primary/10">
              <Flag className="w-3 h-3 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold">Race #{r.raceNum} <span className="text-muted-foreground font-normal">· {r.date}</span></div>
              <div className="text-xs text-muted-foreground">{String(r.trackId ?? "").replace(/_/g, " ")}</div>
            </div>
            {winner && (
              <div className="flex items-center gap-1.5 text-xs">
                <Trophy className="w-3 h-3 text-amber-500" />
                <div className={`w-1.5 h-1.5 rounded-full ${teamDot(winner.team)}`} />
                <span className="font-semibold">{winner.driver}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SeasonHistory() {
  const { activeSeason, seasons, isLoading: seasonsLoading } = useSeason();
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  const safeSeasons = Array.isArray(seasons) ? seasons : [];
  const viewing = selectedSeason ?? activeSeason;

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <History className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold" data-testid="text-page-title">Season History</h1>
          <p className="text-sm text-muted-foreground">All-time season records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-2">
          {seasonsLoading ? (
            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : safeSeasons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No seasons found.</p>
          ) : (
            safeSeasons.map((meta) => (
              <SeasonCard
                key={meta.season}
                meta={meta}
                isActive={meta.season === activeSeason}
                isSelected={meta.season === viewing}
                onClick={() => setSelectedSeason(meta.season)}
              />
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Season {viewing}
                {viewing === activeSeason && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-primary border-primary/30">ACTIVE</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="drivers">
                <TabsList className="mb-4">
                  <TabsTrigger value="drivers" className="text-xs gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Drivers
                  </TabsTrigger>
                  <TabsTrigger value="owners" className="text-xs gap-1.5">
                    <Trophy className="w-3.5 h-3.5" /> Owners
                  </TabsTrigger>
                  <TabsTrigger value="races" className="text-xs gap-1.5">
                    <Flag className="w-3.5 h-3.5" /> Races
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="drivers"><DriverTable season={viewing} /></TabsContent>
                <TabsContent value="owners"><OwnerTable season={viewing} /></TabsContent>
                <TabsContent value="races"><RaceLog season={viewing} /></TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
