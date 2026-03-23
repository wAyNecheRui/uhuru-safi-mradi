import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon, FileX, Users, Building, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState = ({ 
  icon: Icon = FileX, 
  title, 
  description, 
  action,
  className = ""
}: EmptyStateProps) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">{description}</p>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
};

export const NoProjectsFound = ({ onCreateProject }: { onCreateProject?: () => void }) => (
  <EmptyState
    icon={Building}
    title="No Projects Found"
    description="There are no projects matching your criteria. Start by creating a new project or adjusting your filters."
    action={onCreateProject ? {
      label: "Create New Project",
      onClick: onCreateProject
    } : undefined}
  />
);

export const NoUsersFound = ({ onInviteUsers }: { onInviteUsers?: () => void }) => (
  <EmptyState
    icon={Users}
    title="No Users Found"
    description="No users have been registered yet. Invite users to join the platform."
    action={onInviteUsers ? {
      label: "Invite Users",
      onClick: onInviteUsers
    } : undefined}
  />
);

export const NoDataAvailable = () => (
  <EmptyState
    icon={AlertCircle}
    title="No Data Available"
    description="Data is not available at the moment. Please check your connection and try again."
  />
);

export const SearchNoResults = ({ searchTerm, onClearSearch }: { 
  searchTerm: string; 
  onClearSearch: () => void;
}) => (
  <EmptyState
    icon={FileX}
    title="No Results Found"
    description={`No results found for "${searchTerm}". Try adjusting your search terms or filters.`}
    action={{
      label: "Clear Search",
      onClick: onClearSearch
    }}
  />
);
