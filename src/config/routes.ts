import type { DashboardRole } from '@/config/dashboardRoutes';

export interface RouteConfig {
  path: string;
  component: string;
  roles: DashboardRole[];
  title: string;
  description?: string;
}

export const routeConfigs: RouteConfig[] = [
  // Public routes
  { path: '/', component: 'Landing', roles: [], title: 'Home' },
  { path: '/about', component: 'About', roles: [], title: 'About' },
  { path: '/how-it-works', component: 'HowItWorks', roles: [], title: 'How It Works' },
  { path: '/contact', component: 'Contact', roles: [], title: 'Contact' },
  { path: '/auth', component: 'Auth', roles: [], title: 'Authentication' },
  { path: '/user-guide', component: 'UserGuide', roles: [], title: 'User Guide' },
  { path: '/terms', component: 'Terms', roles: [], title: 'Terms of Service' },
  { path: '/privacy', component: 'Privacy', roles: [], title: 'Privacy Policy' },

  // Protected routes (all roles)
  { path: '/settings', component: 'SettingsPage', roles: ['citizen', 'contractor', 'government', 'admin'], title: 'Settings' },
  { path: '/profile', component: 'ProfilePage', roles: ['citizen', 'contractor', 'government', 'admin'], title: 'Profile' },
  { path: '/wallet', component: 'WalletPage', roles: ['citizen', 'contractor', 'government', 'admin'], title: 'My Wallet' },

  // Government + Contractor routes
  { path: '/contractor-database', component: 'ContractorDatabasePage', roles: ['government', 'admin', 'contractor'], title: 'Contractor Database' },
  { path: '/workforce', component: 'WorkforcePage', roles: ['government', 'admin', 'contractor'], title: 'Workforce Platform' },
  { path: '/analytics', component: 'AnalyticsPage', roles: ['government', 'admin'], title: 'Analytics Dashboard' },

  // Citizen routes
  { path: '/citizen', component: 'CitizenDashboard', roles: ['citizen'], title: 'Citizen Dashboard' },
  { path: '/citizen/report', component: 'CitizenReportIssue', roles: ['citizen'], title: 'Report Issue' },
  { path: '/citizen/track', component: 'CitizenTrackReports', roles: ['citizen'], title: 'Track Reports' },
  { path: '/citizen/voting', component: 'CitizenCommunityVoting', roles: ['citizen'], title: 'Community Voting' },
  { path: '/citizen/skills', component: 'CitizenSkillsRegistration', roles: ['citizen'], title: 'Skills Registration' },
  { path: '/citizen/workforce', component: 'CitizenWorkforce', roles: ['citizen'], title: 'Job Opportunities' },
  { path: '/citizen/my-jobs', component: 'CitizenMyJobs', roles: ['citizen'], title: 'My Jobs' },
  { path: '/citizen/projects', component: 'CitizenProjects', roles: ['citizen'], title: 'Monitor Projects' },
  { path: '/citizen/transparency', component: 'CitizenTransparency', roles: ['citizen'], title: 'Transparency Portal' },
  { path: '/citizen/notifications', component: 'CitizenNotifications', roles: ['citizen'], title: 'Notifications' },
  { path: '/citizen/guide', component: 'CitizenGuide', roles: ['citizen'], title: 'Citizen Guide' },

  // Contractor routes
  { path: '/contractor', component: 'ContractorDashboard', roles: ['contractor'], title: 'Contractor Dashboard' },
  { path: '/contractor/bidding', component: 'ContractorBidding', roles: ['contractor'], title: 'Browse Projects' },
  { path: '/contractor/tracking', component: 'ContractorBidTracking', roles: ['contractor'], title: 'My Bids' },
  { path: '/contractor/projects', component: 'ContractorProjects', roles: ['contractor'], title: 'My Projects' },
  { path: '/contractor/financials', component: 'ContractorFinancials', roles: ['contractor'], title: 'Financials' },
  { path: '/contractor/templates', component: 'ContractorTemplates', roles: ['contractor'], title: 'Bid Templates' },
  { path: '/contractor/quality', component: 'ContractorQuality', roles: ['contractor'], title: 'Quality Management' },
  { path: '/contractor/jobs', component: 'ContractorJobsManagement', roles: ['contractor'], title: 'Job Postings' },
  { path: '/contractor/performance', component: 'ContractorPerformance', roles: ['contractor'], title: 'Performance' },
  { path: '/contractor/communications', component: 'ContractorCommunications', roles: ['contractor'], title: 'Communications' },
  { path: '/contractor/verification', component: 'ContractorVerification', roles: ['contractor'], title: 'Verification' },
  { path: '/contractor/notifications', component: 'ContractorNotifications', roles: ['contractor'], title: 'Notifications' },

  // Government routes
  { path: '/government', component: 'GovernmentDashboard', roles: ['government', 'admin'], title: 'Government Dashboard' },
  { path: '/government/projects', component: 'GovernmentProjects', roles: ['government', 'admin'], title: 'Projects' },
  { path: '/government/reports', component: 'GovernmentReports', roles: ['government', 'admin'], title: 'Reports' },
  { path: '/government/approvals', component: 'GovernmentApprovalDashboard', roles: ['government', 'admin'], title: 'Approvals' },
  { path: '/government/escrow', component: 'GovernmentEscrow', roles: ['government', 'admin'], title: 'Escrow Management' },
  { path: '/government/escrow-funding', component: 'GovernmentEscrowFunding', roles: ['government', 'admin'], title: 'Escrow Funding' },
  { path: '/government/payments', component: 'GovernmentPaymentTransparency', roles: ['government', 'admin'], title: 'Payments' },
  { path: '/government/payment-release', component: 'GovernmentPaymentRelease', roles: ['government', 'admin'], title: 'Payment Release' },
  { path: '/government/milestones', component: 'GovernmentMilestones', roles: ['government', 'admin'], title: 'Milestones' },
  { path: '/government/lpo', component: 'GovernmentLPO', roles: ['government', 'admin'], title: 'LPO Management' },
  { path: '/government/bid-approval', component: 'GovernmentBidApproval', roles: ['government', 'admin'], title: 'Bid Approval' },
  { path: '/government/contractors', component: 'GovernmentContractorManagement', roles: ['government', 'admin'], title: 'Contractor Management' },
  { path: '/government/verification', component: 'GovernmentVerification', roles: ['government', 'admin'], title: 'Verification' },
  { path: '/government/verification-requests', component: 'GovernmentVerificationRequests', roles: ['government', 'admin'], title: 'Verification Requests' },
  { path: '/government/blockchain', component: 'GovernmentBlockchain', roles: ['government', 'admin'], title: 'Blockchain' },
  { path: '/government/eacc', component: 'GovernmentEACC', roles: ['government', 'admin'], title: 'EACC Integration' },
  { path: '/government/analytics', component: 'GovernmentAnalytics', roles: ['government', 'admin'], title: 'Analytics' },
  { path: '/government/portfolio', component: 'GovernmentPortfolio', roles: ['government', 'admin'], title: 'Portfolio' },
  { path: '/government/benchmarks', component: 'GovernmentBenchmarks', roles: ['government', 'admin'], title: 'Benchmarks' },
  { path: '/government/compliance', component: 'GovernmentCompliance', roles: ['government', 'admin'], title: 'Compliance' },
  { path: '/government/users', component: 'GovernmentUserManagement', roles: ['government', 'admin'], title: 'User Management' },
  { path: '/government/notifications', component: 'GovernmentNotifications', roles: ['government', 'admin'], title: 'Notifications' },

  // Public routes
  { path: '/public/transparency', component: 'PublicTransparencyPortal', roles: [], title: 'Public Transparency' },
  { path: '/public/projects', component: 'PublicProjects', roles: [], title: 'Public Projects' },

  // Special routes
  { path: '/disputes', component: 'DisputeResolution', roles: ['citizen', 'contractor', 'government', 'admin'], title: 'Dispute Resolution' },
];