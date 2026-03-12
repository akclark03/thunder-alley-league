import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Star,
  Clock,
  Flag,
  History,
  ChevronDown,
  PlusCircle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useSeason } from "@/contexts/SeasonContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const NAV_ITEMS = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Driver Standings", href: "/standings/drivers", icon: Users },
  { title: "Owner Standings", href: "/standings/owners", icon: Trophy },
  { title: "Playoff Standings", href: "/standings/playoffs", icon: Star },
  { title: "Race History", href: "/races", icon: Clock },
  { title: "Season History", href: "/seasons", icon: History },
  { title: "Run a Race", href: "/race/new", icon: Flag },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { activeSeason, seasons, viewingSeason, setViewingSeason, isCurrentSeason, startNewSeason, isStartingNewSeason } = useSeason();

  return (
    <Sidebar>
      {/* Logo / header */}
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 flex-shrink-0"
            aria-label="Thunder Alley"
          >
            <rect width="32" height="32" rx="6" fill="hsl(0 78% 46%)" />
            <rect x="4" y="4" width="6" height="6" fill="white" />
            <rect x="10" y="4" width="6" height="6" fill="hsl(0 0% 15%)" />
            <rect x="16" y="4" width="6" height="6" fill="white" />
            <rect x="22" y="4" width="6" height="6" fill="hsl(0 0% 15%)" />
            <rect x="4" y="10" width="6" height="6" fill="hsl(0 0% 15%)" />
            <rect x="10" y="10" width="6" height="6" fill="white" />
            <rect x="16" y="10" width="6" height="6" fill="hsl(0 0% 15%)" />
            <rect x="22" y="10" width="6" height="6" fill="white" />
            <rect x="4" y="20" width="24" height="8" rx="2" fill="hsl(40 80% 52%)" />
            <text x="16" y="27" textAnchor="middle" fontSize="6" fontWeight="bold" fill="hsl(40 90% 10%)" fontFamily="sans-serif">THUNDER</text>
          </svg>
          <div>
            <div className="text-sm font-bold leading-tight text-sidebar-foreground">Thunder Alley</div>
            <div className="text-xs text-muted-foreground leading-tight">League Manager</div>
          </div>
        </div>

        {/* Season selector */}
        <div className="mt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground text-xs font-medium transition-colors"
                data-testid="button-season-selector"
              >
                <span>
                  Season {viewingSeason}
                  {!isCurrentSeason && <span className="ml-1 text-muted-foreground">(past)</span>}
                  {isCurrentSeason && <span className="ml-1 text-primary font-semibold">· Active</span>}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel className="text-xs">View Season</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {seasons.map((s) => (
                <DropdownMenuItem
                  key={s.season}
                  onClick={() => setViewingSeason(s.season)}
                  className="flex items-center justify-between text-xs"
                  data-testid={`menu-item-season-${s.season}`}
                >
                  <div className="flex items-center gap-2">
                    {s.season === viewingSeason && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />}
                    {s.season !== viewingSeason && <span className="w-1.5 h-1.5 inline-block" />}
                    <span className="font-medium">Season {s.season}</span>
                    {s.season === activeSeason && <span className="text-primary text-[10px] font-semibold">ACTIVE</span>}
                  </div>
                  <span className="text-muted-foreground">{s.raceCount}R</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-xs text-primary focus:text-primary"
                    data-testid="menu-item-new-season"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-2" />
                    Start Season {activeSeason + 1}
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Start Season {activeSeason + 1}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will archive Season {activeSeason} and begin Season {activeSeason + 1}. All future races will be recorded under the new season. Past seasons remain fully accessible.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={startNewSeason}
                      disabled={isStartingNewSeason}
                      data-testid="button-confirm-new-season"
                    >
                      Start Season {activeSeason + 1}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === "/"
                  ? location === "/"
                  : location.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <Link href={item.href} className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t border-sidebar-border">
        <a
          href="https://www.perplexity.ai/computer"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Created with Perplexity Computer
        </a>
      </SidebarFooter>
    </Sidebar>
  );
}
