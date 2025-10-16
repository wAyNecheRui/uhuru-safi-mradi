import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface VerificationStatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  className?: string;
}

export const VerificationStatusBadge = ({ status, className }: VerificationStatusBadgeProps) => {
  const configs: Record<string, {
    label: string;
    icon: any;
    variant: 'secondary' | 'default' | 'destructive';
    className?: string;
  }> = {
    pending: {
      label: 'Pending',
      icon: Clock,
      variant: 'secondary',
    },
    under_review: {
      label: 'Under Review',
      icon: AlertCircle,
      variant: 'default',
    },
    approved: {
      label: 'Approved',
      icon: CheckCircle,
      variant: 'default',
      className: 'bg-green-500 hover:bg-green-600',
    },
    rejected: {
      label: 'Rejected',
      icon: XCircle,
      variant: 'destructive',
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className || ''} ${className || ''}`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
};
