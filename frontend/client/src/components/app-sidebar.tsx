import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Star,
  Clock,
  Flag,
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

const NAV_ITEMS = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Driver Standings", href: "/standings/drivers", icon: Users },
  { title: "Owner Standings", href: "/standings/owners", icon: Trophy },
  { title: "Playoff Standings", href: "/standings/playoffs", icon: Star },
  { title: "Race History", href: "/races", icon: Clock },
  { title: "Run a Race", href: "/race/new", icon: Flag },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      {/* Logo / header */}
      <SidebarHeader className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          {/* Inline SVG checkered flag logo */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 flex-shrink-0"
            aria-label="Thunder Alley"
          >
            <rect width="32" height="32" rx="6" fill="hsl(0 78% 46%)" />
            {/* Checkered pattern */}
            <rect x="4" y="4" width="6" height="6" fill="white" />
            <rect x="10" y="4" width="6" height="6" fill="hsl(0 0% 15%)" />
            <rect x="16" y="4" width="6" height="6" fill="white" />
            <rect x="22" y="4" width="6" height="6" fill="hsl(0 0% 15%)" />
            <rect x="4" y="10" width="6" height="6" fill="hsl(0 0% 15%)" />
            <rect x="10" y="10" width="6" height="6" fill="white" />
            <rect x="16" y="10" width="6" height="6" fill="hsl(0 0% 15%)" />
            <rect x="22" y="10" width="6" height="6" fill="white" />
            {/* Bottom stripe */}
            <rect x="4" y="20" width="24" height="8" rx="2" fill="hsl(40 80% 52%)" />
            <text x="16" y="27" textAnchor="middle" fontSize="6" fontWeight="bold" fill="hsl(40 90% 10%)" fontFamily="sans-serif">THUNDER</text>
          </svg>
          <div>
            <div className="text-sm font-bold leading-tight text-sidebar-foreground">Thunder Alley</div>
            <div className="text-xs text-muted-foreground leading-tight">League Manager</div>
          </div>
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
