import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wallet, Users, Calendar, ImageOff, Building, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/constants/problemReporting';

export interface ProjectCardData {
  id: string;
  title: string;
  description?: string;
  status: string;
  budget?: number | null;
  progress: number;
  photo_url?: string | null;
  location?: string | null;
  category?: string | null;
  contractor_name?: string | null;
  contractor_verified?: boolean;
  contractor_id?: string | null;
  verified_count?: number;
  created_at?: string | null;
  target_date?: string | null;
}

interface ProjectCardProps {
  project: ProjectCardData;
  onClick?: (id: string) => void;
  className?: string;
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  completed: { label: 'Completed', classes: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' },
  in_progress: { label: 'In Progress', classes: 'bg-primary/10 text-primary border-primary/20' },
  planning: { label: 'Planning', classes: 'bg-accent/15 text-accent-foreground border-accent/20' },
  pending: { label: 'Pending', classes: 'bg-muted text-muted-foreground border-border' },
  active: { label: 'Active', classes: 'bg-primary/10 text-primary border-primary/20' },
  cancelled: { label: 'Cancelled', classes: 'bg-destructive/10 text-destructive border-destructive/20' },
};

const getStatusConfig = (status: string) => {
  const key = status?.toLowerCase().replace(/\s+/g, '_');
  return statusConfig[key] || statusConfig.pending;
};

const getCategoryIcon = (category: string | null) => {
  if (!category) return '🏗️';
  const found = CATEGORIES.find(c => c.value === category || c.label === category);
  return found?.icon || '🏗️';
};

const getCategoryLabel = (category: string | null) => {
  if (!category) return 'Infrastructure';
  const found = CATEGORIES.find(c => c.value === category || c.label === category);
  return found?.label || category;
};

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick, className, compact = false }) => {
  const sc = getStatusConfig(project.status);

  return (
    <div
      className={cn(
        'group bg-card rounded-2xl border border-border/60 overflow-hidden transition-all duration-300',
        'hover:shadow-card-hover hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={() => onClick?.(project.id)}
    >
      {/* Hero Image */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
        {project.photo_url ? (
          <img
            src={project.photo_url}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/5 via-muted to-accent/5 flex items-center justify-center">
            <div className="text-4xl opacity-40">{getCategoryIcon(project.category)}</div>
          </div>
        )}
        {/* Status Badge overlay */}
        <div className="absolute top-3 left-3">
          <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md', sc.classes)}>
            {sc.label}
          </span>
        </div>
        {/* Progress pill overlay */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-card/80 text-foreground backdrop-blur-md border border-border/40">
            {project.progress}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category line */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm">{getCategoryIcon(project.category)}</span>
          <span className="text-xs font-medium text-muted-foreground">{getCategoryLabel(project.category)}</span>
        </div>

        {/* Title */}
        <h3 className="font-display font-semibold text-foreground text-sm leading-snug line-clamp-2 mb-2 min-h-[2.5rem]">
          {project.title}
        </h3>

        {/* Location */}
        {project.location && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${project.progress}%`,
                background: project.progress >= 100
                  ? 'hsl(var(--success))'
                  : project.progress >= 50
                    ? 'hsl(var(--primary))'
                    : 'hsl(var(--accent))',
              }}
            />
          </div>
        </div>

        {/* Metadata row */}
        <div className="flex items-center justify-between gap-2">
          {project.budget != null && project.budget > 0 && (
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Wallet className="h-3 w-3" />
              KES {(project.budget / 1000000).toFixed(1)}M
            </span>
          )}
          {project.verified_count != null && project.verified_count > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {project.verified_count} verified
            </span>
          )}
        </div>

        {/* Contractor badge */}
        {!compact && project.contractor_name && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building className="h-3 w-3 text-primary" />
            </div>
            <span className="text-xs font-medium text-foreground truncate">{project.contractor_name}</span>
            {project.contractor_verified && (
              <ShieldCheck className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
            )}
          </div>
        )}

        {/* Date footer */}
        {!compact && project.created_at && (
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{new Date(project.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;
