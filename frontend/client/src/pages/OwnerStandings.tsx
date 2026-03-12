import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import type { OwnerStanding } from "@/types/standings";

const TEAM_COLORS: Record<string, string> = {
  "Howitzer Racing": "bg-red-600",
  "Red Fury Racing": "bg-rose-500",
  "Pockets Racing": "bg-blue-600",
  "Quaker-Stubbs Motorsports": "bg-amber-500",
  "Mythos Motorsports": "bg-purple-600",
  "Oracle Oil Racing Team": "bg-emerald-600",
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

export default function OwnerStandings() {
  const { data: standings, isLoading } = useQuery<OwnerStanding[]>({
    queryKey: ["/api/standings/owners"],
  });

  return (
    <div className="p-6 max-w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold" data-testid="text-page-title">Owner Standings</h1>
          <p className="text-sm text-muted-foreground">Team / owner season points</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : !standings || standings.length === 0 ? (
            <div className="py-16 text-center">
              <Trophy className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No standings yet — run your first race to see results.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="table-owner-standings">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <HeadCell className="w-12 text-center">Pos</HeadCell>
                    <HeadCell>Team</HeadCell>
                    <HeadCell>Owner</HeadCell>
                    <HeadCell className="text-right">Points</HeadCell>
                    <HeadCell className="text-right">Behind</HeadCell>
                    <HeadCell className="text-right">Wins</HeadCell>
                    <HeadCell className="text-right">Top 5</HeadCell>
                    <HeadCell className="text-right">Top 10</HeadCell>
                    <HeadCell className="text-right">Turns Led</HeadCell>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((o, idx) => (
                    <tr
                      key={o.team}
                      className={`border-b border-border last:border-0 transition-colors hover:bg-muted/20 ${idx === 0 ? "bg-amber-400/5" : ""}`}
                      data-testid={`row-owner-${o.team.replace(/\s+/g, "-")}`}
                    >
                      <Cell className="text-center">
                        <PosBadge pos={o.position} />
                      </Cell>
                      <Cell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${teamDot(o.team)}`} />
                          <span className="font-semibold text-sm">{o.team}</span>
                        </div>
                      </Cell>
                      <Cell>
                        <span className="text-xs text-muted-foreground">{o.owner ?? <span className="italic">—</span>}</span>
                      </Cell>
                      <Cell className="text-right font-bold tabular-nums text-primary">
                        {o.points}
                      </Cell>
                      <Cell className="text-right tabular-nums text-muted-foreground text-xs">
                        {o.behind === 0 ? <span className="text-primary font-semibold">—</span> : `-${o.behind}`}
                      </Cell>
                      <Cell className="text-right tabular-nums">
                        {o.wins > 0 ? (
                          <Badge variant="outline" className="text-xs font-bold text-amber-600 border-amber-400/40 bg-amber-400/10">
                            {o.wins}
                          </Badge>
                        ) : "0"}
                      </Cell>
                      <Cell className="text-right tabular-nums">{o.top5s}</Cell>
                      <Cell className="text-right tabular-nums">{o.top10s}</Cell>
                      <Cell className="text-right tabular-nums">{o.turnsLed}</Cell>
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
