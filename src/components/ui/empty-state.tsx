
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
    <Card className={`${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 max-w-sm leading-relaxed">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="bg-blue-600 hover:bg-blue-700">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
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
    description="No users have been registered yet. Invite users to join the platform and start collaborating."
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
