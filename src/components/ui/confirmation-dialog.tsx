import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, Shield, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ConfirmationType = 'danger' | 'warning' | 'info' | 'delete';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  type?: ConfirmationType;
  isLoading?: boolean;
}

const typeConfig = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-destructive',
    iconBg: 'bg-destructive/10',
    confirmClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-600',
    iconBg: 'bg-yellow-100',
    confirmClass: 'bg-yellow-600 text-white hover:bg-yellow-700',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    confirmClass: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  delete: {
    icon: Trash2,
    iconColor: 'text-destructive',
    iconBg: 'bg-destructive/10',
    confirmClass: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
  isLoading = false,
}: ConfirmationDialogProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn('p-3 rounded-full', config.iconBg)}>
              <Icon className={cn('h-6 w-6', config.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialogTitle className="text-lg pr-8">{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4 flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={handleCancel}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn('w-full sm:w-auto', config.confirmClass)}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for easy confirmation dialog usage
 */
export function useConfirmation() {
  const [state, setState] = React.useState<{
    open: boolean;
    props: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'> | null;
  }>({
    open: false,
    props: null,
  });

  const confirm = React.useCallback((
    props: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        open: true,
        props: {
          ...props,
          onConfirm: async () => {
            await props.onConfirm?.();
            resolve(true);
          },
          onCancel: () => {
            props.onCancel?.();
            resolve(false);
          },
        },
      });
    });
  }, []);

  const dialog = state.props ? (
    <ConfirmationDialog
      open={state.open}
      onOpenChange={(open) => setState(s => ({ ...s, open }))}
      {...state.props}
    />
  ) : null;

  return { confirm, dialog };
}