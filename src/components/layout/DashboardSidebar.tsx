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
import {
  LayoutDashboard, AlertTriangle, FileText, Users, Map, Wallet, Wrench, Briefcase, Eye, BookOpen,
  Award, TrendingUp, CheckCircle, MessageSquare, BarChart3, ClipboardList,
  Shield, Building2, CreditCard, Link2, Landmark, UserCheck, FolderOpen,
  Scale, Bell, Settings, LogOut, Milestone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const citizenNav: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { title: 'Dashboard', url: '/citizen', icon: LayoutDashboard },
      { title: 'Report Issue', url: '/citizen/report', icon: AlertTriangle },
      { title: 'Track Reports', url: '/citizen/track', icon: FileText },
      { title: 'Monitor Projects', url: '/citizen/projects', icon: Map },
    ],
  },
  {
    label: 'Community',
    items: [
      { title: 'Community Voting', url: '/citizen/voting', icon: Users },
      { title: 'Transparency', url: '/citizen/transparency', icon: Eye },
    ],
  },
  {
    label: 'Work & Skills',
    items: [
      { title: 'My Jobs', url: '/citizen/my-jobs', icon: Wallet },
      { title: 'Skills Registration', url: '/citizen/skills', icon: Wrench },
      { title: 'Job Opportunities', url: '/citizen/workforce', icon: Briefcase },
    ],
  },
  {
    label: 'Help',
    items: [
      { title: 'Citizen Guide', url: '/citizen/guide', icon: BookOpen },
    ],
  },
];

const contractorNav: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { title: 'Dashboard', url: '/contractor', icon: LayoutDashboard },
      { title: 'Browse Projects', url: '/contractor/bidding', icon: Briefcase },
      { title: 'My Bids', url: '/contractor/tracking', icon: Eye },
      { title: 'My Projects', url: '/contractor/projects', icon: FolderOpen },
    ],
  },
  {
    label: 'Operations',
    items: [
      { title: 'Financials', url: '/contractor/financials', icon: Wallet },
      { title: 'Bid Templates', url: '/contractor/templates', icon: ClipboardList },
      { title: 'Quality', url: '/contractor/quality', icon: CheckCircle },
      { title: 'Job Postings', url: '/contractor/jobs', icon: Briefcase },
    ],
  },
  {
    label: 'Performance',
    items: [
      { title: 'Performance', url: '/contractor/performance', icon: BarChart3 },
      { title: 'Communications', url: '/contractor/communications', icon: MessageSquare },
      { title: 'Verification', url: '/contractor/verification', icon: Award },
    ],
  },
];

const governmentNav: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { title: 'Dashboard', url: '/government', icon: LayoutDashboard },
      { title: 'Projects', url: '/government/projects', icon: FolderOpen },
      { title: 'Reports', url: '/government/reports', icon: FileText },
      { title: 'Approvals', url: '/government/approvals', icon: CheckCircle },
    ],
  },
  {
    label: 'Finance',
    items: [
      { title: 'Escrow', url: '/government/escrow', icon: Shield },
      { title: 'Escrow Funding', url: '/government/escrow-funding', icon: CreditCard },
      { title: 'Payments', url: '/government/payments', icon: Wallet },
      { title: 'Payment Release', url: '/government/payment-release', icon: CreditCard },
      { title: 'Milestones', url: '/government/milestones', icon: Milestone },
      { title: 'LPO', url: '/government/lpo', icon: ClipboardList },
    ],
  },
  {
    label: 'Oversight',
    items: [
      { title: 'Bid Approval', url: '/government/bid-approval', icon: Scale },
      { title: 'Contractors', url: '/government/contractors', icon: Building2 },
      { title: 'Verification', url: '/government/verification', icon: UserCheck },
      { title: 'Verification Requests', url: '/government/verification-requests', icon: UserCheck },
      { title: 'Blockchain', url: '/government/blockchain', icon: Link2 },
      { title: 'EACC', url: '/government/eacc', icon: Landmark },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { title: 'Analytics', url: '/government/analytics', icon: BarChart3 },
      { title: 'Portfolio', url: '/government/portfolio', icon: TrendingUp },
      { title: 'Benchmarks', url: '/government/benchmarks', icon: Award },
      { title: 'Compliance', url: '/government/compliance', icon: Shield },
      { title: 'User Management', url: '/government/users', icon: Users },
    ],
  },
];

export function DashboardSidebar() {
  const { user, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();

  const userType = (user?.user_type || 'citizen') as string;
  const navGroups = userType === 'government' || userType === 'admin'
    ? governmentNav
    : userType === 'contractor'
      ? contractorNav
      : citizenNav;

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
          onClick={() => navigate(`/${userType === 'admin' ? 'government' : userType}`)}
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
        {navGroups.map((group) => (
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
