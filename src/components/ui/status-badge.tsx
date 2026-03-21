import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Play,
  Pause,
  Eye,
  Send,
  Wallet,
  Shield,
  Users,
} from 'lucide-react';

type StatusType = 
  | 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled'
  | 'approved' | 'under_review' | 'submitted' | 'draft'
  | 'paid' | 'unpaid' | 'processing' | 'failed'
  | 'verified' | 'unverified'
  | 'open' | 'closed'
  | 'active' | 'inactive';

interface StatusConfig {
  label: string;
  className: string;
  icon: React.ElementType;
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Play,
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle,
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
  },
  under_review: {
    label: 'Under Review',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Eye,
  },
  submitted: {
    label: 'Submitted',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Send,
  },
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Pause,
  },
  paid: {
    label: 'Paid',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: Wallet,
  },
  unpaid: {
    label: 'Unpaid',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Loader2,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
  },
  verified: {
    label: 'Verified',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: Shield,
  },
  unverified: {
    label: 'Unverified',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: AlertCircle,
  },
  open: {
    label: 'Open',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Users,
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: XCircle,
  },
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: Pause,
  },
};

interface StatusBadgeProps {
  status: StatusType | string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  customLabel?: string;
}

export function StatusBadge({
  status,
  showIcon = true,
  size = 'md',
  className,
  customLabel,
}: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_') as StatusType;
  const config = statusConfigs[normalizedStatus] || {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertCircle,
  };

  const Icon = config.icon;
  const isAnimated = normalizedStatus === 'processing';

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon className={cn(
          iconSizes[size],
          'mr-1',
          isAnimated && 'animate-spin'
        )} />
      )}
      {customLabel || config.label}
    </Badge>
  );
}

// Priority badge variant
type PriorityType = 'low' | 'medium' | 'high' | 'critical' | 'urgent';

const priorityConfigs: Record<PriorityType, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'bg-gray-100 text-gray-800 border-gray-200',
  },
  medium: {
    label: 'Medium',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  high: {
    label: 'High',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  critical: {
    label: 'Critical',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-red-100 text-red-800 border-red-200 animate-pulse',
  },
};

interface PriorityBadgeProps {
  priority: PriorityType | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriorityBadge({
  priority,
  size = 'md',
  className,
}: PriorityBadgeProps) {
  const normalizedPriority = priority.toLowerCase() as PriorityType;
  const config = priorityConfigs[normalizedPriority] || priorityConfigs.medium;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {config.label}
    </Badge>
  );
}