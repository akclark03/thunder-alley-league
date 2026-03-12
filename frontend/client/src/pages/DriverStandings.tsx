import { useQuery } from "@tanstack/react-query";
import { useSeason } from "@/contexts/SeasonContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import type { DriverStanding } from "@/types/standings";

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

function PosBadge({ pos }: { pos: number }) {
  if (pos === 1) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-900 text-xs font-bold">1</span>;
  if (pos === 2) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-800 text-xs font-bold">2</span>;
  if (pos === 3) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-amber-100 text-xs font-bold">3</span>;
  return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground text-xs font-bold">{pos}</span>;
}

function Cell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 text-sm ${className}`}>{children}</td>;
}
function HeadCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left ${className}`}>{children}</th>;
}

export default function DriverStandings() {
  const { viewingSeason } = useSeason();
  const { data: standings, isLoading } = useQuery<DriverStanding[]>({
    queryKey: ["/api/standings/drivers", viewingSeason],
    queryFn: () => fetch(`/api/standings/drivers?season=${viewingSeason}`).then(r => r.json()),
  });

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold" data-testid="text-page-title">Driver Standings</h1>
          <p className="text-sm text-muted-foreground">Season points standings</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !standings || standings.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No standings yet — run your first race to see results.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-driver-standings">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <HeadCell className="w-12 text-center">Pos</HeadCell>
                    <HeadCell className="w-12 text-center">Car</HeadCell>
                    <HeadCell>Driver</HeadCell>
                    <HeadCell>Team</HeadCell>
                    <HeadCell className="text-right">Points</HeadCell>
                    <HeadCell className="text-right">Behind</HeadCell>
                    <HeadCell className="text-right">Starts</HeadCell>
                    <HeadCell className="text-right">Wins</HeadCell>
                    <HeadCell className="text-right">Top 5</HeadCell>
                    <HeadCell className="text-right">Top 10</HeadCell>
                    <HeadCell className="text-right">Turns Led</HeadCell>
                    <HeadCell className="text-right">Playoff Pts</HeadCell>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((d, idx) => (
                    <tr
                      key={d.carNumber}
                      className={`border-b border-border last:border-0 transition-colors hover:bg-muted/20 ${idx === 0 ? "bg-amber-400/5" : ""}`}
                      data-testid={`row-driver-${d.carNumber}`}
                    >
                      <Cell className="text-center">
                        <PosBadge pos={d.position} />
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
                      <Cell>
                        <span className="text-xs text-muted-foreground">{d.team}</span>
                      </Cell>
                      <Cell className="text-right font-bold tabular-nums text-primary">
                        {d.points}
                      </Cell>
                      <Cell className="text-right tabular-nums text-muted-foreground text-xs">
                        {d.behind === 0 ? <span className="text-primary font-semibold">—</span> : `-${d.behind}`}
                      </Cell>
                      <Cell className="text-right tabular-nums">{d.starts}</Cell>
                      <Cell className="text-right tabular-nums">
                        {d.wins > 0 ? (
                          <Badge variant="outline" className="text-xs font-bold text-amber-600 border-amber-400/40 bg-amber-400/10">
                            {d.wins}
                          </Badge>
                        ) : "0"}
                      </Cell>
                      <Cell className="text-right tabular-nums">{d.top5s}</Cell>
                      <Cell className="text-right tabular-nums">{d.top10s}</Cell>
                      <Cell className="text-right tabular-nums">{d.turnsLed}</Cell>
                      <Cell className="text-right tabular-nums">
                        <span className="font-semibold text-accent-foreground dark:text-yellow-400">{d.playoffPoints}</span>
                      </Cell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
