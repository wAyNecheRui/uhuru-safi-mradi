import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

interface ValidationTooltipProps {
  children: React.ReactNode;
  missingFields: string[];
  disabled: boolean;
}

export const ValidationTooltip: React.FC<ValidationTooltipProps> = ({ children, missingFields, disabled }) => {
  if (!disabled || missingFields.length === 0) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block w-full">{children}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-destructive text-destructive-foreground p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm mb-1">Required before submitting:</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                {missingFields.map((field, i) => (
                  <li key={i}>{field}</li>
                ))}
              </ul>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface InlineErrorProps {
  message?: string;
  show?: boolean;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, show = true }) => {
  if (!show || !message) return null;
  return (
    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
};
