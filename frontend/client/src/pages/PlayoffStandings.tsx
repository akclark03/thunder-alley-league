import { useQuery } from "@tanstack/react-query";
import { useSeason } from "@/contexts/SeasonContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";
import type { PlayoffStanding } from "@/types/standings";

const TEAM_COLORS: Record<string, string> = {
  "Howitzer Racing": "bg-yellow-400",
  "Red Fury Racing": "bg-red-600",
  "Pockets Racing": "bg-green-600",
  "Quaker-Stubbs Motorsports": "bg-blue-600",
  "Mythos Motorsports": "bg-purple-600",
  "Oracle Oil Racing Team": "bg-neutral-900",
};

function teamDot(team: string) { return TEAM_COLORS[team] ?? "bg-primary"; }

function Cell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 text-sm ${className}`}>{children}</td>;
}
function HeadCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left ${className}`}>{children}</th>;
}

async function safeFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : ([] as unknown as T);
}

export default function PlayoffStandings() {
  const { viewingSeason } = useSeason();
  const { data: standings, isLoading } = useQuery<PlayoffStanding[]>({
    queryKey: ["/api/standings/playoffs", viewingSeason],
    queryFn: () => safeFetch<PlayoffStanding[]>(`/api/standings/playoffs?season=${viewingSeason}`),
  });

  const rows = Array.isArray(standings) ? standings : [];
  const cutline = 12;

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Star className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold" data-testid="text-page-title">Playoff Standings</h1>
          <p className="text-sm text-muted-foreground">Top 12 advance · Ranked by playoff points</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <Star className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No standings yet — run your first race to see results.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-playoff-standings">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <HeadCell className="w-12 text-center">Pos</HeadCell>
                    <HeadCell className="w-12 text-center">Car</HeadCell>
                    <HeadCell>Driver</HeadCell>
                    <HeadCell>Team</HeadCell>
                    <HeadCell className="text-right">Playoff Pts</HeadCell>
                    <HeadCell className="text-right">+/- Cutline</HeadCell>
                    <HeadCell className="text-right">Wins</HeadCell>
                    <HeadCell className="text-right">Top 5</HeadCell>
                    <HeadCell className="text-right">Turns Led</HeadCell>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d, idx) => {
                    const isAboveCut = idx < cutline;
                    const isCutline = idx === cutline - 1;
                    return (
                      <>
                        <tr
                          key={d.carNumber}
                          className={`border-b border-border transition-colors hover:bg-muted/20 ${isAboveCut ? "bg-green-500/3" : "bg-red-500/3 opacity-80"}`}
                          data-testid={`row-playoff-${d.carNumber}`}
                        >
                          <Cell className="text-center">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                              isAboveCut
                                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                                : "bg-red-500/10 text-muted-foreground"
                            }`}>
                              {d.position}
                            </span>
                          </Cell>
                          <Cell className="text-center">
                            <span className="tabular-nums font-mono text-xs font-semibold text-muted-foreground">#{d.carNumber}</span>
                          </Cell>
                          <Cell>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${teamDot(d.team)}`} />
                              <span className="font-semibold text-sm">{d.driver}</span>
                            </div>
                          </Cell>
                          <Cell><span className="text-xs text-muted-foreground">{d.team}</span></Cell>
                          <Cell className="text-right font-bold tabular-nums">
                            <span className={isAboveCut ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                              {d.playoffPoints}
                            </span>
                          </Cell>
                          <Cell className="text-right tabular-nums text-xs">
                            {d.margin ? (
                              <span className={String(d.margin).startsWith("+") ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-500 font-semibold"}>
                                {d.margin}
                              </span>
                            ) : "—"}
                          </Cell>
                          <Cell className="text-right tabular-nums">
                            {d.wins > 0 ? (
                              <Badge variant="outline" className="text-xs font-bold text-amber-600 border-amber-400/40 bg-amber-400/10">
                                {d.wins}
                              </Badge>
                            ) : "0"}
                          </Cell>
                          <Cell className="text-right tabular-nums">{d.top5s}</Cell>
                          <Cell className="text-right tabular-nums">{d.turnsLed}</Cell>
                        </tr>
                        {isCutline && rows.length > cutline && (
                          <tr key="cutline-sep" className="border-b-0">
                            <td colSpan={9} className="px-3 py-0">
                              <div className="flex items-center gap-2 py-1">
                                <div className="flex-1 h-px bg-red-500/40" />
                                <span className="text-xs text-red-500 font-semibold whitespace-nowrap">PLAYOFF CUTLINE</span>
                                <div className="flex-1 h-px bg-red-500/40" />
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
