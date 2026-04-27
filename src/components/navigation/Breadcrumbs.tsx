import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useViewport } from '@/hooks/useViewport';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

// Route label mappings
const routeLabels: Record<string, string> = {
  // Citizen routes
  'citizen': 'Dashboard',
  'report-issue': 'Report Issue',
  'track-reports': 'Track Reports',
  'community-voting': 'Community Voting',
  'skills-registration': 'Skills Registration',
  'workforce': 'Workforce',
  
  'projects': 'Projects',
  'transparency': 'Transparency',
  'notifications': 'Notifications',
  'guide': 'User Guide',
  
  // Contractor routes
  'contractor': 'Dashboard',
  'bidding': 'Find Projects',
  'verification': 'Verification',
  'templates': 'Templates',
  'bid-tracking': 'My Bids',
  'financials': 'Financials',
  'quality': 'Quality',
  'performance': 'Performance',
  'communications': 'Messages',
  
  // Government routes
  'government': 'Dashboard',
  'reports': 'Problem Reports',
  'escrow': 'Escrow',
  'payment-transparency': 'Payment Transparency',
  'blockchain': 'Blockchain',
  'eacc': 'EACC Integration',
  'benchmarks': 'Benchmarks',
  'verification-requests': 'Verification Requests',
  'portfolio': 'Project Portfolio',
  'approval-dashboard': 'Approvals',
  'contractor-management': 'Contractors',
  'analytics': 'Analytics',
  'compliance': 'Compliance',
  'user-management': 'User Management',
  'bid-approval': 'Bid Approval',
  'milestones': 'Milestones',
  'withdrawals': 'Withdrawals Queue',
  'lpo': 'Purchase Orders',
};

// Get the base home path for each user type
const getHomePath = (pathname: string): { path: string; label: string } => {
  if (pathname.startsWith('/citizen')) {
    return { path: '/citizen', label: 'Citizen Portal' };
  }
  if (pathname.startsWith('/contractor')) {
    return { path: '/contractor', label: 'Contractor Portal' };
  }
  if (pathname.startsWith('/government')) {
    return { path: '/government', label: 'Government Portal' };
  }
  return { path: '/', label: 'Home' };
};

export function Breadcrumbs({ items, showHome = true, className }: BreadcrumbsProps) {
  const location = useLocation();
  const { isMobile } = useViewport();

  // Auto-generate breadcrumbs from current path if items not provided
  const breadcrumbItems = React.useMemo(() => {
    if (items) return items;

    const pathSegments = location.pathname.split('/').filter(Boolean);
    const generatedItems: BreadcrumbItem[] = [];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      // Only add as link if not the last segment
      generatedItems.push({
        label,
        path: index < pathSegments.length - 1 ? currentPath : undefined,
      });
    });

    return generatedItems;
  }, [items, location.pathname]);

  // On mobile, show only last 2 items
  const displayItems = isMobile 
    ? breadcrumbItems.slice(-2)
    : breadcrumbItems;

  const { path: homePath, label: homeLabel } = getHomePath(location.pathname);

  if (breadcrumbItems.length <= 1 && !showHome) {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn('flex items-center text-sm', className)}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {showHome && (
          <>
            <li>
              <Link
                to={homePath}
                className={cn(
                  'flex items-center gap-1 text-muted-foreground hover:text-foreground',
                  'transition-colors touch-target'
                )}
                aria-label={homeLabel}
              >
                <Home className="h-4 w-4" />
                {!isMobile && <span>{homeLabel}</span>}
              </Link>
            </li>
            {displayItems.length > 0 && (
              <li className="text-muted-foreground">
                <ChevronRight className="h-4 w-4" />
              </li>
            )}
          </>
        )}
        
        {isMobile && breadcrumbItems.length > 2 && (
          <>
            <li className="text-muted-foreground">...</li>
            <li className="text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
            </li>
          </>
        )}

        {displayItems.map((item, index) => (
          <React.Fragment key={index}>
            <li>
              {item.path ? (
                <Link
                  to={item.path}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
            {index < displayItems.length - 1 && (
              <li className="text-muted-foreground">
                <ChevronRight className="h-4 w-4" />
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}