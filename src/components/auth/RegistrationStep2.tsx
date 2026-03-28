import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Upload, HelpCircle, Loader2, ArrowRight, FileText, Calendar } from 'lucide-react';
import { NCA_CATEGORIES, AGPO_CATEGORIES, CONTRACTOR_SPECIALIZATIONS } from '@/constants/kenyaAdministrativeUnits';

interface RegistrationStep2Props {
  role: 'contractor' | 'government';
  isKenya: boolean;
  userName: string;
  onSkip?: () => void;
  onComplete: () => void;
}

const RegistrationStep2: React.FC<RegistrationStep2Props> = ({
  role, isKenya, userName, onSkip, onComplete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    onComplete();
  };

  return (
    <div className="space-y-5">
      {/* Success celebration */}
      <div className="text-center space-y-3 py-2">
        <div className="w-14 h-14 rounded-full bg-[hsl(var(--success))]/15 flex items-center justify-center mx-auto animate-fade-in-up">
          <CheckCircle2 className="h-8 w-8 text-[hsl(var(--success))]" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-foreground text-lg">Welcome to Uhuru Safi! 🎉</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your account is created, {userName}. Just a few more details to unlock full features.
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--success))]" />
        <div className="flex-1 h-1.5 rounded-full bg-primary" />
        <span className="text-[11px] text-muted-foreground font-medium">Step 2 of 2</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[45vh] overflow-y-auto pr-1">
        {/* ─── CONTRACTOR Step 2 ─── */}
        {role === 'contractor' && (
          <>
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium text-foreground">
                  {isKenya ? 'KRA PIN' : 'Business / Tax ID'}
                </label>
                <Tooltip>
                  <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{isKenya ? 'Your Kenya Revenue Authority PIN (e.g. A0123456789B)' : 'Your country\'s business/tax identification number'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input placeholder={isKenya ? 'e.g. P000000000X' : 'e.g. EIN, CAC Number'} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Primary Specialization</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select specialization" /></SelectTrigger>
                <SelectContent>
                  {CONTRACTOR_SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">License Number</label>
                <Input placeholder="License number" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Expiry Date</label>
                <Input type="date" />
              </div>
            </div>

            {/* File uploads */}
            <div className="space-y-3">
              <FileUploadField label="Contractor License / Registration" />
              <FileUploadField label="Tax Compliance Certificate" />
            </div>

            {/* Kenya-only NCA fields */}
            {isKenya && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🇰🇪</span>
                    <span className="text-sm font-medium text-foreground">Kenya-Specific Requirements</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">NCA Registration Number</label>
                    <Input placeholder="NCA registration number" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <label className="text-sm font-medium text-foreground">NCA Class</label>
                      <Tooltip>
                        <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                        <TooltipContent><p className="text-xs">NCA 1 = Unlimited value projects</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select NCA class" /></SelectTrigger>
                      <SelectContent>
                        {NCA_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <FileUploadField label="NCA Practicing License" />

                  <div className="pt-2 border-t border-primary/10">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="is_agpo_step2" />
                      <label htmlFor="is_agpo_step2" className="text-sm font-medium text-foreground">AGPO Registered (Women/Youth/PWD)</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              💡 These details help us verify you and connect you with real government projects.
            </p>
          </>
        )}

        {/* ─── GOVERNMENT Step 2 ─── */}
        {role === 'government' && (
          <>
            <FileUploadField label="Appointment Letter or Official Staff ID / Government Badge" />
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium text-foreground">Government Employee / Service Number</label>
                <span className="text-xs text-muted-foreground">(Optional)</span>
              </div>
              <Input placeholder="e.g. EMP/12345" />
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              🔒 Thank you for helping bring transparency! Your account is being verified so only authorised officials can approve milestones and payments.
            </p>
          </>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            className="flex-1"
          >
            Save & Continue Later
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              <>Complete Setup <ArrowRight className="ml-1.5 h-4 w-4" /></>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Reusable file upload component
const FileUploadField: React.FC<{ label: string }> = ({ label }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors">
      <Upload className="h-4 w-4" />
      <span>Click to upload PDF or JPG</span>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
    </label>
  </div>
);

export default RegistrationStep2;
