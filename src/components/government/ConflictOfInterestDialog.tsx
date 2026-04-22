import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Scale, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface ConflictOfInterestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractorId: string;
  contractorName?: string;
  reportId?: string;
  onCleared: () => void;
}

/**
 * Mandatory Conflict of Interest declaration prompt.
 * Required by Public Procurement & Asset Disposal Act (PPADA), Section 42.
 * Must be completed by every government official before evaluating a bid.
 */
export const ConflictOfInterestDialog: React.FC<ConflictOfInterestDialogProps> = ({
  open,
  onOpenChange,
  contractorId,
  contractorName,
  reportId,
  onCleared,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hasConflict, setHasConflict] = useState<string>('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setHasConflict('');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({ title: 'Not authenticated', variant: 'destructive' });
      return;
    }
    if (!hasConflict) {
      toast({
        title: 'Declaration required',
        description: 'You must declare whether a conflict exists.',
        variant: 'destructive',
      });
      return;
    }
    const conflictExists = hasConflict === 'yes';
    if (conflictExists && description.trim().length < 20) {
      toast({
        title: 'Description too short',
        description: 'Please describe the relationship in at least 20 characters.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('conflict_declarations').insert({
        official_id: user.id,
        contractor_id: contractorId,
        report_id: reportId ?? null,
        has_conflict: conflictExists,
        relationship_description: conflictExists ? description.trim() : null,
      });

      if (error) throw error;

      if (conflictExists) {
        toast({
          title: 'Conflict declared — evaluation blocked',
          description:
            'This bid must be reassigned to another evaluator. Your declaration has been recorded.',
          variant: 'destructive',
        });
        reset();
        onOpenChange(false);
      } else {
        toast({
          title: 'Declaration recorded',
          description: 'You may now proceed to evaluate the bid.',
        });
        reset();
        onOpenChange(false);
        onCleared();
      }
    } catch (err: any) {
      console.error('COI declaration error:', err);
      toast({
        title: 'Failed to record declaration',
        description: err.message ?? 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent
        className="max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Scale className="h-6 w-6 text-primary" />
            Conflict of Interest Declaration
          </DialogTitle>
          <DialogDescription className="text-sm">
            Required under the <strong>Public Procurement & Asset Disposal Act, 2015 (Section 42)</strong>.
            False declarations are punishable under the Anti-Corruption and Economic Crimes Act.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-500/40 bg-amber-500/10">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900 dark:text-amber-200">
            Before proceeding to evaluate this bid
          </AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-200/90 text-sm">
            You are about to evaluate a bid from{' '}
            <strong>{contractorName ?? 'this contractor'}</strong>. You must declare any
            personal, family, financial, business, or other relationship that could affect your
            impartiality.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-2">
          <Label className="text-base font-semibold">
            Do you have a conflict of interest with this contractor?
          </Label>
          <RadioGroup value={hasConflict} onValueChange={setHasConflict}>
            <div className="flex items-start space-x-3 p-3 rounded-md border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="no" id="coi-no" className="mt-1" />
              <Label htmlFor="coi-no" className="cursor-pointer flex-1 font-normal">
                <span className="font-medium block">No — I have no conflict of interest</span>
                <span className="text-xs text-muted-foreground">
                  I confirm I have no personal, family, financial, or business relationship with
                  this contractor or its directors that could compromise my impartiality.
                </span>
              </Label>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-md border hover:bg-muted/50 cursor-pointer">
              <RadioGroupItem value="yes" id="coi-yes" className="mt-1" />
              <Label htmlFor="coi-yes" className="cursor-pointer flex-1 font-normal">
                <span className="font-medium block text-destructive">
                  Yes — I have a conflict and must recuse myself
                </span>
                <span className="text-xs text-muted-foreground">
                  This bid will be blocked from my evaluation and reassigned to another official.
                </span>
              </Label>
            </div>
          </RadioGroup>

          {hasConflict === 'yes' && (
            <div className="space-y-2">
              <Label htmlFor="coi-desc">Describe the relationship (required)</Label>
              <Textarea
                id="coi-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., The contractor's director is my brother-in-law / I previously worked at this firm / I hold shares in this company..."
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/1000 characters · minimum 20
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel evaluation
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !hasConflict}
            variant={hasConflict === 'yes' ? 'destructive' : 'default'}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recording...
              </>
            ) : hasConflict === 'yes' ? (
              'Recuse myself'
            ) : (
              'Submit declaration & proceed'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConflictOfInterestDialog;
