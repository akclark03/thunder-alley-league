import { CSSProperties } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SeasonProvider, useSeason } from "@/contexts/SeasonContext";

import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import DriverStandings from "@/pages/DriverStandings";
import OwnerStandings from "@/pages/OwnerStandings";
import PlayoffStandings from "@/pages/PlayoffStandings";
import RaceHistory from "@/pages/RaceHistory";
import SeasonHistory from "@/pages/SeasonHistory";
import RaceWizard from "@/pages/RaceWizard";

function SeasonBadge() {
  const { viewingSeason, isCurrentSeason } = useSeason();
  return (
    <span className="text-xs font-medium text-muted-foreground">
      Season {viewingSeason}
      {!isCurrentSeason && <span className="ml-1 text-amber-500 font-semibold">(viewing past)</span>}
    </span>
  );
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/standings/drivers" component={DriverStandings} />
      <Route path="/standings/owners" component={OwnerStandings} />
      <Route path="/standings/playoffs" component={PlayoffStandings} />
      <Route path="/races" component={RaceHistory} />
      <Route path="/seasons" component={SeasonHistory} />
      <Route path="/race/new" component={RaceWizard} />
      <Route component={NotFound} />
    </Switch>
  );
}

const sidebarStyle: CSSProperties = {
  "--sidebar-width": "16rem",
  "--sidebar-width-icon": "3.5rem",
} as CSSProperties;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SeasonProvider>
          <SidebarProvider style={sidebarStyle}>
            <div className="flex h-screen w-full overflow-hidden">
              <Router hook={useHashLocation}>
                <AppSidebar />
                <div className="flex flex-col flex-1 min-w-0">
                  <header className="flex items-center gap-2 h-12 px-4 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
                    <SidebarTrigger data-testid="button-sidebar-toggle" className="-ml-1" />
                    <div className="h-4 w-px bg-border" />
                    <SeasonBadge />
                  </header>
                  <main className="flex-1 overflow-y-auto">
                    <AppRouter />
                  </main>
                </div>
              </Router>
            </div>
          </SidebarProvider>
        </SeasonProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
