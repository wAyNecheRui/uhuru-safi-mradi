import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Award,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle,
  ClipboardList,
  CreditCard,
  Eye,
  FileText,
  FolderOpen,
  Landmark,
  LayoutDashboard,
  Link2,
  Map,
  MessageSquare,
  Milestone,
  Scale,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Wrench,
  BookOpen,
} from 'lucide-react';

export type DashboardRole = 'citizen' | 'contractor' | 'government' | 'admin';

export interface DashboardNavItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

export interface DashboardNavGroup {
  label: string;
  items: DashboardNavItem[];
}

export const citizenDashboardRoutes: DashboardNavGroup[] = [
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
      { title: 'System Visuals', url: '/visuals', icon: BarChart3 },
    ],
  },
  {
    label: 'Work & Skills',
    items: [
      { title: 'My Jobs', url: '/citizen/my-jobs', icon: Briefcase },
      { title: 'Skills Registration', url: '/citizen/skills', icon: Wrench },
      { title: 'Job Opportunities', url: '/citizen/workforce', icon: Briefcase },
    ],
  },
  {
    label: 'Wallet',
    items: [
      { title: 'My Wallet', url: '/wallet', icon: Wallet },
    ],
  },
  {
    label: 'Help',
    items: [
      { title: 'Citizen Guide', url: '/citizen/guide', icon: BookOpen },
    ],
  },
];

export const contractorDashboardRoutes: DashboardNavGroup[] = [
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
      { title: 'My Wallet', url: '/wallet', icon: Wallet },
      { title: 'Bid Templates', url: '/contractor/templates', icon: ClipboardList },
      { title: 'Quality', url: '/contractor/quality', icon: CheckCircle },
      { title: 'Job Postings', url: '/contractor/jobs', icon: Briefcase },
    ],
  },
  {
    label: 'Performance',
    items: [
      { title: 'Performance', url: '/contractor/performance', icon: BarChart3 },
      { title: 'System Visuals', url: '/visuals', icon: TrendingUp },
      { title: 'Communications', url: '/contractor/communications', icon: MessageSquare },
      { title: 'Verification', url: '/contractor/verification', icon: Award },
    ],
  },
];

export const governmentDashboardRoutes: DashboardNavGroup[] = [
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
      { title: 'Treasury Wallet', url: '/wallet', icon: Wallet },
      { title: 'Payment Audit', url: '/government/payments', icon: FileText },
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
      { title: 'System Visuals', url: '/visuals', icon: TrendingUp },
      { title: 'Portfolio', url: '/government/portfolio', icon: TrendingUp },
      { title: 'Benchmarks', url: '/government/benchmarks', icon: Award },
      { title: 'Compliance', url: '/government/compliance', icon: Shield },
      { title: 'User Management', url: '/government/users', icon: Users },
    ],
  },
];

export const dashboardNavMap: Record<DashboardRole, DashboardNavGroup[]> = {
  citizen: citizenDashboardRoutes,
  contractor: contractorDashboardRoutes,
  government: governmentDashboardRoutes,
  admin: governmentDashboardRoutes,
};