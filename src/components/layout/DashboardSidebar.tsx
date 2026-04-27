import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import logoImg from '@/assets/uhuru-safi-logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Settings, LogOut } from 'lucide-react';
import { dashboardNavMap, type DashboardRole } from '@/config/dashboardRoutes';
import { isRouteAllowed } from '@/config/governmentRoles';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export function DashboardSidebar() {
  const { user, signOut } = useAuth();
  const { state, isMobile: sidebarIsMobile } = useSidebar();
  // On mobile the sidebar renders as a full-width Sheet drawer,
  // so always show text labels regardless of collapsed state
  const collapsed = sidebarIsMobile ? false : state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();

  const userType = (user?.user_type || 'citizen') as DashboardRole;
  const { governmentProfile } = useProfile();
  const navGroups = dashboardNavMap[userType];

  const filteredNavGroups = useMemo(() => {
    if (userType !== 'government') return navGroups;
    // If not a gov user profile yet or pending department, show standard dashboard only
    const dept = governmentProfile?.department || 'Pending Assignment';

    return navGroups.map(group => ({
      ...group,
      items: group.items.filter(item => isRouteAllowed(dept, item.url))
    })).filter(group => group.items.length > 0);
  }, [navGroups, governmentProfile?.department, userType]);

  const resolvedType = userType === 'admin' ? 'government' : userType;
  const isActive = (url: string) => {
    if (url === `/${resolvedType}`) {
      return location.pathname === url;
    }
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="p-3">
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => navigate(`/${resolvedType}`)}
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 transition-transform group-hover:scale-105">
            <img src={logoImg} alt="Uhuru Safi" className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h2 className="font-bold text-sm text-sidebar-foreground leading-tight truncate">Uhuru Safi</h2>
              <p className="text-[10px] text-sidebar-foreground/60 leading-tight truncate">Transparency Platform</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {filteredNavGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider font-semibold text-sidebar-foreground/50">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <a
                        href={item.url}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(item.url);
                        }}
                        className={cn(
                          'flex items-center gap-2 transition-colors',
                          isActive(item.url) && 'bg-primary/10 text-primary font-medium'
                        )}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
            >
              <a
                href="/settings"
                onClick={(e) => { e.preventDefault(); navigate('/settings'); }}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {!collapsed && <span>Settings</span>}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign Out"
              onClick={() => signOut()}
              className="flex items-center gap-2 text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
