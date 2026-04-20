
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { 
  Breadcrumb, 
  BreadcrumbList, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb';
import { useAuth } from '@/contexts/AuthContext';

interface BreadcrumbNavProps {
  items?: Array<{
    label: string;
    href?: string;
  }>;
}

const BreadcrumbNav = ({ items = [] }: BreadcrumbNavProps) => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // Get home path based on user type
  const getHomePath = () => {
    if (isAuthenticated && user) {
      switch (user.user_type) {
        case 'citizen':
          return '/citizen';
        case 'contractor':
          return '/contractor';
        case 'government':
          return '/government';
        default:
          return '/';
      }
    }
    return '/';
  };

  const homePath = getHomePath();
  
  const generateBreadcrumbs = () => {
    if (items.length > 0) {
      // Update the Home item to use the correct path
      return items.map(item => 
        item.label === 'Home' ? { ...item, href: homePath } : item
      );
    }
    
    const breadcrumbs = [{ label: 'Home', href: homePath }];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      const label = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return [
            <BreadcrumbItem key={`item-${index}`}>
              {breadcrumb.href ? (
                <BreadcrumbLink asChild>
                  <Link to={breadcrumb.href} className="flex items-center hover:text-primary transition-colors">
                    {index === 0 && <Home className="h-4 w-4 mr-1" />}
                    {breadcrumb.label}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-primary font-medium">
                  {breadcrumb.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>,
            !isLast && (
              <BreadcrumbSeparator key={`sep-${index}`}>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            ),
          ];
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbNav;
