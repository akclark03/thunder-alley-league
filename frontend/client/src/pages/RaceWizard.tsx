import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Flag,
  Users,
  MapPin,
  LayoutGrid,
  Trophy,
  ChevronRight,
  ChevronLeft,
  Check,
  Car,
} from "lucide-react";
import type { GridRow, Track } from "@shared/schema";

// ─── Step config ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Players", icon: Users },
  { id: 2, label: "Teams", icon: Flag },
  { id: 3, label: "Track", icon: MapPin },
  { id: 4, label: "Grid", icon: LayoutGrid },
  { id: 5, label: "Results", icon: Car },
  { id: 6, label: "Summary", icon: Trophy },
];

// ─── Team color map ───────────────────────────────────────────────────────────
const TEAM_COLORS: Record<string, string> = {
  "Howitzer Racing": "bg-yellow-400",
  "Red Fury Racing": "bg-red-600",
  "Pockets Racing": "bg-green-600",
  "Quaker-Stubbs Motorsports": "bg-blue-600",
  "Mythos Motorsports": "bg-purple-600",
  "Oracle Oil Racing Team": "bg-neutral-900",
};

function teamColor(team: string) {
  return TEAM_COLORS[team] ?? "bg-primary";
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-8" data-testid="step-bar">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const state = current === step.id ? "active" : current > step.id ? "done" : "future";
        return (
          <div key={step.id} className="flex items-center gap-1 flex-1">
            <div className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  state === "active" ? "step-active ring-2 ring-primary/30" :
                  state === "done" ? "step-done" : "step-future"
                }`}
                data-testid={`step-${step.id}`}
              >
                {state === "done" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                state === "active" ? "text-primary" :
                state === "done" ? "text-primary/70" : "text-muted-foreground"
              }`}>{step.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mb-5 transition-all ${current > step.id ? "bg-primary/40" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Players ──────────────────────────────────────────────────────────
function StepPlayers({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const options = [2, 3, 4, 5, 6, 7];
  const carsMap: Record<number, number> = { 2: 6, 3: 5, 4: 4, 5: 3, 6: 3, 7: 3 };
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">How many players are racing today?</p>
      <div className="grid grid-cols-3 gap-3" data-testid="player-count-grid">
        {options.map((n) => (
          <button
            key={n}
            data-testid={`player-option-${n}`}
            onClick={() => onChange(n)}
            className={`rounded-lg border-2 p-4 text-center transition-all hover-elevate ${
              value === n
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/50"
            }`}
          >
            <div className="text-2xl font-bold">{n}</div>
            <div className="text-xs text-muted-foreground mt-1">{carsMap[n]} cars/team</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Teams ────────────────────────────────────────────────────────────
function StepTeams({
  numPlayers,
  selected,
  onSelect,
  onDeselect,
}: {
  numPlayers: number;
  selected: string[];
  onSelect: (t: string) => void;
  onDeselect: (t: string) => void;
}) {
  const { data: teams = [], isLoading } = useQuery<string[]>({
    queryKey: ["/api/config/teams"],
  });

  if (isLoading) return <div className="text-muted-foreground">Loading teams…</div>;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Select <span className="font-semibold text-foreground">{numPlayers}</span> teams to race.{" "}
        <span className="text-xs">({selected.length}/{numPlayers} selected)</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="team-grid">
        {teams.map((team) => {
          const isSelected = selected.includes(team);
          const isFull = selected.length >= numPlayers && !isSelected;
          return (
            <button
              key={team}
              data-testid={`team-option-${team.replace(/\s+/g, "-")}`}
              disabled={isFull}
              onClick={() => isSelected ? onDeselect(team) : onSelect(team)}
              className={`flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all hover-elevate disabled:opacity-40 disabled:cursor-not-allowed ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${teamColor(team)}`} />
              <span className="font-medium text-sm">{team}</span>
              {isSelected && (
                <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3: Track ────────────────────────────────────────────────────────────
function StepTrack({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ["/api/config/tracks"],
  });

  if (isLoading) return <div className="text-muted-foreground">Loading tracks…</div>;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">Choose the track for this race.</p>
      <div className="grid grid-cols-1 gap-3" data-testid="track-grid">
        {tracks.map((track) => (
          <button
            key={track.id}
            data-testid={`track-option-${track.id}`}
            onClick={() => onChange(track.id)}
            className={`flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-all hover-elevate ${
              value === track.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <MapPin className={`w-5 h-5 flex-shrink-0 ${value === track.id ? "text-primary" : "text-muted-foreground"}`} />
            <span className="font-medium">{track.name}</span>
            {value === track.id && <Check className="w-4 h-4 text-primary ml-auto" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Grid ─────────────────────────────────────────────────────────────
function StepGrid({ grid, onRegenerate, isLoading }: { grid: GridRow[]; onRegenerate: () => void; isLoading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">Starting grid — generated by qualifying weights.</p>
        <Button variant="outline" size="sm" onClick={onRegenerate} disabled={isLoading} data-testid="button-regenerate-grid">
          Regenerate
        </Button>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden" data-testid="grid-table">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">Pos</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">#</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Driver</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Team</th>
              </tr>
            </thead>
            <tbody>
              {grid.map((row, i) => (
                <tr key={row.carNumber} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-3 py-2 font-mono font-bold text-muted-foreground">{row.startingPosition}</td>
                  <td className="px-3 py-2">
                    <span className="font-mono font-bold text-primary">{row.carNumber}</span>
                  </td>
                  <td className="px-3 py-2 font-medium">{row.driver}</td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${teamColor(row.team)}`} />
                      <span className="text-muted-foreground text-xs">{row.team}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Results entry ────────────────────────────────────────────────────
interface FinishEntry { carNumber: number; finish: number; turnsLed: number }

function StepResults({
  grid,
  entries,
  onUpdate,
}: {
  grid: GridRow[];
  entries: FinishEntry[];
  onUpdate: (entries: FinishEntry[]) => void;
}) {
  const usedFinishes = entries.filter((e) => e.finish > 0).map((e) => e.finish);

  const setFinish = (carNumber: number, finish: number) => {
    onUpdate(entries.map((e) => e.carNumber === carNumber ? { ...e, finish } : e));
  };
  const setTurnsLed = (carNumber: number, turnsLed: number) => {
    onUpdate(entries.map((e) => e.carNumber === carNumber ? { ...e, turnsLed } : e));
  };

  const allFilled = entries.every((e) => e.finish > 0);
  const hasDuplicates = new Set(usedFinishes).size !== usedFinishes.length;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Enter the finishing position and turns led for each car.
      </p>
      {hasDuplicates && (
        <div className="text-destructive text-xs bg-destructive/10 rounded-lg px-3 py-2" data-testid="error-duplicate-positions">
          Duplicate finishing positions — each car must have a unique finish.
        </div>
      )}
      <div className="rounded-lg border border-border overflow-hidden" data-testid="results-table">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-12">#</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Driver</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-24">Finish</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground w-24">Turns Led</th>
            </tr>
          </thead>
          <tbody>
            {grid.map((row, i) => {
              const entry = entries.find((e) => e.carNumber === row.carNumber);
              const isDuplicate =
                entry && entry.finish > 0 && usedFinishes.filter((f) => f === entry.finish).length > 1;
              return (
                <tr key={row.carNumber} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-3 py-2 font-mono font-bold text-primary">{row.carNumber}</td>
                  <td className="px-3 py-2">
                    <div>
                      <div className="font-medium">{row.driver}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${teamColor(row.team)}`} />
                        {row.team}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={1}
                      max={grid.length}
                      data-testid={`input-finish-${row.carNumber}`}
                      value={entry?.finish || ""}
                      onChange={(e) => setFinish(row.carNumber, parseInt(e.target.value) || 0)}
                      className={`w-16 h-8 text-center font-mono ${isDuplicate ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      placeholder={String(i + 1)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      data-testid={`input-turns-${row.carNumber}`}
                      value={entry?.turnsLed ?? ""}
                      onChange={(e) => setTurnsLed(row.carNumber, parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center font-mono"
                      placeholder="0"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {allFilled && !hasDuplicates && (
        <div className="text-xs text-primary bg-primary/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <Check className="w-3.5 h-3.5" />
          All results entered — ready to score.
        </div>
      )}
    </div>
  );
}

// ─── Step 6: Summary ──────────────────────────────────────────────────────────
function StepSummary({ race }: { race: any }) {
  const results: any[] = race.results ?? [];
  const teamResults: any[] = race.teamResults ?? [];
  const sorted = [...results].sort((a, b) => (a.finish as number) - (b.finish as number));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">🏁</div>
        <h2 className="text-xl font-bold">Race {race.raceNum} Complete!</h2>
        <p className="text-muted-foreground text-sm">{race.trackId.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())} · {race.date}</p>
      </div>

      {/* Winner callout */}
      {sorted[0] && (
        <div className="rounded-xl border-2 border-accent bg-accent/10 p-4 flex items-center gap-4" data-testid="winner-card">
          <Trophy className="w-8 h-8 text-accent flex-shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Race Winner</div>
            <div className="font-bold text-lg">{sorted[0].driver}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className={`w-2 h-2 rounded-full ${teamColor(sorted[0].team)}`} />
              {sorted[0].team}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="font-bold text-primary text-lg">{sorted[0].points} pts</div>
            <div className="text-xs text-muted-foreground">{sorted[0].turnsLed} turns led</div>
          </div>
        </div>
      )}

      {/* Driver results table */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Driver Results</h3>
        <div className="rounded-lg border border-border overflow-hidden" data-testid="summary-driver-table">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Pos</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Driver</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Pts</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground hidden sm:table-cell">Led</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={r.carNumber} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-3 py-2 font-bold text-muted-foreground">{r.finish}</td>
                  <td className="px-3 py-2 font-mono font-bold text-primary">{r.carNumber}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{r.driver}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${teamColor(r.team)}`} />
                      {r.team}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-bold">{r.points}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground hidden sm:table-cell">{r.turnsLed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team results */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Team Results</h3>
        <div className="rounded-lg border border-border overflow-hidden" data-testid="summary-team-table">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Pos</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Team</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Pts</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground hidden sm:table-cell">Led</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground hidden sm:table-cell">Avg Fin</th>
              </tr>
            </thead>
            <tbody>
              {teamResults.map((r, i) => (
                <tr key={r.team} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-3 py-2 font-bold text-muted-foreground">{r.position}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${teamColor(r.team)}`} />
                      <span className="font-medium">{r.team}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-bold">{r.totalPoints}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground hidden sm:table-cell">{r.turnsLed}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground hidden sm:table-cell">{r.avgFinish}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────
export default function RaceWizard() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [numPlayers, setNumPlayers] = useState(4);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [trackId, setTrackId] = useState("");
  const [grid, setGrid] = useState<GridRow[]>([]);
  const [finishEntries, setFinishEntries] = useState<FinishEntry[]>([]);
  const [savedRace, setSavedRace] = useState<any>(null);

  // Grid generation
  const gridMutation = useMutation({
    mutationFn: (teams: string[]) =>
      apiRequest<GridRow[]>("POST", "/api/grid", { selectedTeams: teams }),
    onSuccess: (data) => {
      setGrid(data);
      setFinishEntries(data.map((r) => ({ carNumber: r.carNumber, finish: 0, turnsLed: 0 })));
    },
    onError: () => toast({ title: "Failed to generate grid", variant: "destructive" }),
  });

  // Race save
  const raceMutation = useMutation({
    mutationFn: (payload: { trackId: string; grid: GridRow[]; finishers: FinishEntry[] }) =>
      apiRequest<any>("POST", "/api/race", payload),
    onSuccess: (data) => {
      setSavedRace(data);
      setStep(6);
    },
    onError: () => toast({ title: "Failed to save race", variant: "destructive" }),
  });

  const canAdvance = () => {
    if (step === 1) return numPlayers >= 2 && numPlayers <= 7;
    if (step === 2) return selectedTeams.length === numPlayers;
    if (step === 3) return !!trackId;
    if (step === 4) return grid.length > 0;
    if (step === 5) {
      const usedFinishes = finishEntries.filter((e) => e.finish > 0).map((e) => e.finish);
      const allFilled = finishEntries.every((e) => e.finish > 0);
      return allFilled && new Set(usedFinishes).size === usedFinishes.length;
    }
    return false;
  };

  const handleNext = () => {
    if (step === 3) {
      // Generate grid when moving to step 4
      gridMutation.mutate(selectedTeams);
      setStep(4);
    } else if (step === 5) {
      // Score and save race
      raceMutation.mutate({
        trackId,
        grid,
        finishers: finishEntries.filter((e) => e.finish > 0),
      });
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => s - 1);

  const handleReset = () => {
    setStep(1);
    setNumPlayers(4);
    setSelectedTeams([]);
    setTrackId("");
    setGrid([]);
    setFinishEntries([]);
    setSavedRace(null);
  };

  const titles: Record<number, string> = {
    1: "Number of Players",
    2: "Select Teams",
    3: "Select Track",
    4: "Starting Grid",
    5: "Race Results",
    6: "Race Summary",
  };

  return (
    <div className="flex-1 flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-xl">
          <StepBar current={step} />

          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg" data-testid="step-title">{titles[step]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && <StepPlayers value={numPlayers} onChange={setNumPlayers} />}
              {step === 2 && (
                <StepTeams
                  numPlayers={numPlayers}
                  selected={selectedTeams}
                  onSelect={(t) => setSelectedTeams((prev) => [...prev, t])}
                  onDeselect={(t) => setSelectedTeams((prev) => prev.filter((x) => x !== t))}
                />
              )}
              {step === 3 && <StepTrack value={trackId} onChange={setTrackId} />}
              {step === 4 && (
                <StepGrid
                  grid={grid}
                  onRegenerate={() => gridMutation.mutate(selectedTeams)}
                  isLoading={gridMutation.isPending}
                />
              )}
              {step === 5 && (
                <StepResults
                  grid={grid}
                  entries={finishEntries}
                  onUpdate={setFinishEntries}
                />
              )}
              {step === 6 && savedRace && <StepSummary race={savedRace} />}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                {step === 6 ? (
                  <Button onClick={handleReset} className="w-full" data-testid="button-new-race">
                    Start New Race
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      onClick={handleBack}
                      disabled={step === 1}
                      data-testid="button-back"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!canAdvance() || raceMutation.isPending}
                      data-testid="button-next"
                    >
                      {raceMutation.isPending
                        ? "Saving…"
                        : step === 5
                        ? "Score Race"
                        : <>Next <ChevronRight className="w-4 h-4 ml-1" /></>}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
