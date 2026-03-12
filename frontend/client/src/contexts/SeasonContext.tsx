import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export interface SeasonMeta {
  season: number;
  raceCount: number;
  startDate: string;
  endDate: string;
  winner: string | null;
}

interface SeasonData {
  activeSeason: number;
  seasons: SeasonMeta[];
}

interface SeasonContextValue {
  activeSeason: number;
  seasons: SeasonMeta[];
  viewingSeason: number;         // the season currently being viewed (may differ from active)
  setViewingSeason: (s: number) => void;
  isCurrentSeason: boolean;
  isLoading: boolean;
  startNewSeason: () => void;
  isStartingNewSeason: boolean;
}

const SeasonContext = createContext<SeasonContextValue>({
  activeSeason: 2,
  seasons: [],
  viewingSeason: 2,
  setViewingSeason: () => {},
  isCurrentSeason: true,
  isLoading: false,
  startNewSeason: () => {},
  isStartingNewSeason: false,
});

export function SeasonProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useQuery<SeasonData>({
    queryKey: ["/api/season"],
    retry: false,
    // Never throw — degrade gracefully to season 2 defaults if the API is unreachable
    throwOnError: false,
  });

  const [viewingSeason, setViewingSeasonState] = useState<number | null>(null);

  // Keep viewingSeason in sync with activeSeason on first load
  const activeSeason = data?.activeSeason ?? 2;
  const seasons = data?.seasons ?? [];

  useEffect(() => {
    if (viewingSeason === null && activeSeason) {
      setViewingSeasonState(activeSeason);
    }
  }, [activeSeason, viewingSeason]);

  const startNewSeasonMutation = useMutation({
    mutationFn: () => apiRequest<{ season: number }>("POST", "/api/season/new"),
    onSuccess: (data) => {
      setViewingSeasonState(data.season);
      queryClient.invalidateQueries({ queryKey: ["/api/season"] });
      queryClient.invalidateQueries({ queryKey: ["/api/races"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings/drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings/owners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings/playoffs"] });
    },
  });

  const resolved = viewingSeason ?? activeSeason;

  return (
    <SeasonContext.Provider value={{
      activeSeason,
      seasons,
      viewingSeason: resolved,
      setViewingSeason: setViewingSeasonState,
      isCurrentSeason: resolved === activeSeason,
      isLoading,
      startNewSeason: () => startNewSeasonMutation.mutate(),
      isStartingNewSeason: startNewSeasonMutation.isPending,
    }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  return useContext(SeasonContext);
}
