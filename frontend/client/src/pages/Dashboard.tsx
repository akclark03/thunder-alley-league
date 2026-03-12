import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Users, Flag, Clock, Star, ChevronRight } from "lucide-react";
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

function teamDot(team: string) {
  return TEAM_COLORS[team] ?? "bg-primary";
}

function PosChange({ pos }: { pos: number }) {
  return (
    <span className="tabular-nums font-bold text-sm w-6 text-center inline-block text-muted-foreground">
      {pos}
    </span>
  );
}

export default function Dashboard() {
  const { data: drivers, isLoading: loadingDrivers } = useQuery<DriverStanding[]>({
    queryKey: ["/api/standings/drivers"],
  });
  const { data: owners, isLoading: loadingOwners } = useQuery<OwnerStanding[]>({
    queryKey: ["/api/standings/owners"],
  });
  const { data: races, isLoading: loadingRaces } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });

  const topDrivers = drivers?.slice(0, 5) ?? [];
  const topOwners = owners?.slice(0, 5) ?? [];
  const recentRaces = races ? [...races].reverse().slice(0, 3) : [];
  const totalRaces = races?.length ?? 0;
  const leader = drivers?.[0];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" data-testid="text-dashboard-title">Thunder Alley League</h1>
          <p className="text-sm text-muted-foreground">Season overview</p>
        </div>
        <Button asChild data-testid="button-run-race">
          <Link href="/race/new">
            <Flag className="w-4 h-4 mr-2" />
            Run a Race
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-stat-races">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Flag className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums" data-testid="text-races-count">{totalRaces}</div>
                <div className="text-xs text-muted-foreground">Races run</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-leader">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Trophy className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate" data-testid="text-leader-name">
                  {loadingDrivers ? <Skeleton className="h-4 w-20" /> : (leader?.driver ?? "—")}
                </div>
                <div className="text-xs text-muted-foreground">Points leader</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-wins">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums" data-testid="text-leader-wins">
                  {loadingDrivers ? <Skeleton className="h-6 w-8" /> : (leader?.wins ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground">Leader wins</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-stat-drivers">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums" data-testid="text-drivers-count">
                  {loadingDrivers ? <Skeleton className="h-6 w-8" /> : (drivers?.length ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground">Drivers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver standings preview */}
        <Card className="lg:col-span-1" data-testid="card-driver-standings-preview">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Driver Standings</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
              <Link href="/standings/drivers">View all <ChevronRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingDrivers ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : topDrivers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No races yet</p>
            ) : (
              <div className="space-y-1">
                {topDrivers.map((d) => (
                  <div key={d.carNumber} className="flex items-center gap-2 py-1.5" data-testid={`row-driver-preview-${d.carNumber}`}>
                    <PosChange pos={d.position} />
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${teamDot(d.team)}`} />
                    <span className="flex-1 text-sm font-medium truncate">{d.driver}</span>
                    <span className="tabular-nums text-sm font-semibold">{d.points}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner standings preview */}
        <Card className="lg:col-span-1" data-testid="card-owner-standings-preview">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Owner Standings</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
              <Link href="/standings/owners">View all <ChevronRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingOwners ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : topOwners.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No races yet</p>
            ) : (
              <div className="space-y-1">
                {topOwners.map((o) => (
                  <div key={o.team} className="flex items-center gap-2 py-1.5" data-testid={`row-owner-preview-${o.team}`}>
                    <PosChange pos={o.position} />
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${teamDot(o.team)}`} />
                    <span className="flex-1 text-sm font-medium truncate">{o.team}</span>
                    <span className="tabular-nums text-sm font-semibold">{o.points}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent races */}
        <Card className="lg:col-span-1" data-testid="card-recent-races">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Recent Races</CardTitle>
            <Button variant="ghost" size="sm" asChild className="text-xs h-7 px-2">
              <Link href="/races">View all <ChevronRight className="w-3 h-3 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            {loadingRaces ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentRaces.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No races run yet</p>
                <Button size="sm" asChild>
                  <Link href="/race/new">Start your first race</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRaces.map((r) => {
                  const results = r.results as any[];
                  const winner = results.find((x: any) => x.finish === 1);
                  return (
                    <Link key={r.id} href={`/races/${r.id}`}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" data-testid={`card-recent-race-${r.id}`}>
                        <div className="p-1.5 rounded bg-primary/10">
                          <Flag className="w-3 h-3 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold">Race #{r.raceNum}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {winner ? `Won by ${winner.driver}` : r.date}
                          </div>
                        </div>
                        <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
