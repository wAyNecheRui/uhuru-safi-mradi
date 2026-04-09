import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Upload, HelpCircle, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { NCA_CATEGORIES, AGPO_CATEGORIES, CONTRACTOR_SPECIALIZATIONS } from '@/constants/kenyaAdministrativeUnits';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VerificationService } from '@/services/VerificationService';

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

  // Contractor fields
  const [kraPin, setKraPin] = useState('');
  const [kraPinError, setKraPinError] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [ncaNumber, setNcaNumber] = useState('');
  const [ncaClass, setNcaClass] = useState('');
  const [isAgpo, setIsAgpo] = useState(false);

  // Government fields
  const [employeeNumber, setEmployeeNumber] = useState('');

  // File states
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File | null>>({});

  const validateKraPin = (value: string) => {
    const upper = value.toUpperCase();
    setKraPin(upper);
    if (isKenya) {
      if (upper && !VerificationService.isValidKRAPin(upper)) {
        setKraPinError('Invalid format. Expected: P123456789A (letter, 9 digits, letter)');
      } else {
        setKraPinError('');
      }
    }
  };

  const handleFileChange = (fieldKey: string, file: File | null) => {
    setUploadedFiles(prev => ({ ...prev, [fieldKey]: file }));
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('contractor-documents')
      .upload(path, file, { upsert: true });
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (role === 'contractor') {
        // Validate KRA PIN format for Kenya
        if (isKenya && kraPin && !VerificationService.isValidKRAPin(kraPin)) {
          toast.error('Please enter a valid KRA PIN (e.g. P123456789A)');
          setIsSubmitting(false);
          return;
        }

        // Upload documents
        const docPaths: Record<string, string | null> = {};
        for (const [key, file] of Object.entries(uploadedFiles)) {
          if (file) {
            const path = `${user.id}/${key}-${Date.now()}.${file.name.split('.').pop()}`;
            docPaths[key] = await uploadFile(file, path);
          }
        }

        // Save contractor profile data
        const { error: profileError } = await supabase
          .from('contractor_profiles')
          .upsert({
            user_id: user.id,
            company_name: userName || 'Unknown',
            kra_pin: kraPin || null,
            specialization: specialization ? [specialization] : [],
            company_registration_number: licenseNumber || null,
            is_agpo: isAgpo,
            business_permit_url: docPaths['contractor_license'] || null,
            tax_compliance_certificate_url: docPaths['tax_compliance'] || null,
          }, { onConflict: 'user_id' });

        if (profileError) {
          console.error('Profile save error:', profileError);
          // Try insert if upsert fails
          await supabase.from('contractor_profiles').insert({
            user_id: user.id,
            company_name: userName || 'Unknown',
            kra_pin: kraPin || null,
            specialization: specialization ? [specialization] : [],
            company_registration_number: licenseNumber || null,
            is_agpo: isAgpo,
            business_permit_url: docPaths['contractor_license'] || null,
            tax_compliance_certificate_url: docPaths['tax_compliance'] || null,
          });
        }

        // Submit KRA PIN for real verification
        if (kraPin && isKenya) {
          try {
            await VerificationService.verifyKRAPin({
              pin_number: kraPin,
              taxpayer_name: userName,
            });
            toast.info('KRA PIN submitted for verification. A government official will review it within 24-48 hours.');
          } catch (err: any) {
            console.error('KRA verification submission:', err);
            // Don't block registration - the PIN is saved, verification is separate
          }
        }

        // Save NCA credentials if Kenya
        if (isKenya && ncaNumber) {
          await supabase.from('contractor_credentials').insert({
            contractor_id: user.id,
            credential_type: 'nca_license',
            credential_name: `NCA ${ncaClass || 'License'}`,
            credential_number: ncaNumber,
            issuing_authority: 'National Construction Authority',
            document_url: docPaths['nca_license'] || null,
            verification_status: 'pending',
          });
        }

        toast.success('Contractor profile saved! Your credentials are being reviewed.');
      }

      if (role === 'government') {
        // Save government profile
        const { error: govError } = await supabase
          .from('government_profiles')
          .upsert({
            user_id: user.id,
            department: 'Pending Assignment',
            position: 'Pending Verification',
            employee_number: employeeNumber || null,
          }, { onConflict: 'user_id' });

        if (govError) {
          await supabase.from('government_profiles').insert({
            user_id: user.id,
            department: 'Pending Assignment',
            position: 'Pending Verification',
            employee_number: employeeNumber || null,
          });
        }

        // Upload appointment letter
        const appointmentFile = uploadedFiles['appointment_letter'];
        if (appointmentFile) {
          const path = `${user.id}/appointment-${Date.now()}.${appointmentFile.name.split('.').pop()}`;
          const uploadedPath = await uploadFile(appointmentFile, path);
          if (uploadedPath) {
            await supabase.from('user_verifications').insert({
              user_id: user.id,
              verification_type: 'government_official',
              reference_number: employeeNumber || `GOV-${Date.now()}`,
              status: 'pending',
              document_urls: [uploadedPath],
              verification_notes: 'Government official appointment letter submitted for review.',
            });
          }
        }

        toast.success('Government profile submitted! Your verification is being processed (24-48 hours).');
      }

      // Mark profile as needing completion review
      await supabase
        .from('user_profiles')
        .update({ profile_completed: false })
        .eq('user_id', user.id);

      onComplete();
    } catch (error: any) {
      console.error('Registration Step 2 error:', error);
      toast.error(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
                    <p className="text-xs">{isKenya ? 'Your Kenya Revenue Authority PIN (e.g. P123456789A)' : 'Your country\'s business/tax identification number'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                placeholder={isKenya ? 'e.g. P123456789A' : 'e.g. EIN, CAC Number'}
                value={kraPin}
                onChange={(e) => validateKraPin(e.target.value)}
                className={kraPinError ? 'border-destructive' : ''}
                maxLength={15}
              />
              {kraPinError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {kraPinError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Primary Specialization</label>
              <Select value={specialization} onValueChange={setSpecialization}>
                <SelectTrigger><SelectValue placeholder="Select specialization" /></SelectTrigger>
                <SelectContent>
                  {CONTRACTOR_SPECIALIZATIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">License Number</label>
                <Input
                  placeholder="License number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Expiry Date</label>
                <Input
                  type="date"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                />
              </div>
            </div>

            {/* File uploads */}
            <div className="space-y-3">
              <FileUploadField
                label="Contractor License / Registration"
                fieldKey="contractor_license"
                onFileChange={handleFileChange}
                currentFile={uploadedFiles['contractor_license']}
              />
              <FileUploadField
                label="Tax Compliance Certificate"
                fieldKey="tax_compliance"
                onFileChange={handleFileChange}
                currentFile={uploadedFiles['tax_compliance']}
              />
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
                    <Input
                      placeholder="NCA registration number"
                      value={ncaNumber}
                      onChange={(e) => setNcaNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      <label className="text-sm font-medium text-foreground">NCA Class</label>
                      <Tooltip>
                        <TooltipTrigger asChild><HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" /></TooltipTrigger>
                        <TooltipContent><p className="text-xs">NCA 1 = Unlimited value projects</p></TooltipContent>
                      </Tooltip>
                    </div>
                    <Select value={ncaClass} onValueChange={setNcaClass}>
                      <SelectTrigger><SelectValue placeholder="Select NCA class" /></SelectTrigger>
                      <SelectContent>
                        {NCA_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <FileUploadField
                    label="NCA Practicing License"
                    fieldKey="nca_license"
                    onFileChange={handleFileChange}
                    currentFile={uploadedFiles['nca_license']}
                  />

                  <div className="pt-2 border-t border-primary/10">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_agpo_step2"
                        checked={isAgpo}
                        onCheckedChange={(checked) => setIsAgpo(checked === true)}
                      />
                      <label htmlFor="is_agpo_step2" className="text-sm font-medium text-foreground">AGPO Registered (Women/Youth/PWD)</label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              💡 Your KRA PIN and credentials will be verified by a government official within 24-48 hours. You'll be notified once approved.
            </p>
          </>
        )}

        {/* ─── GOVERNMENT Step 2 ─── */}
        {role === 'government' && (
          <>
            <FileUploadField
              label="Appointment Letter or Official Staff ID / Government Badge"
              fieldKey="appointment_letter"
              onFileChange={handleFileChange}
              currentFile={uploadedFiles['appointment_letter']}
            />
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <label className="text-sm font-medium text-foreground">Government Employee / Service Number</label>
                <span className="text-xs text-muted-foreground">(Optional)</span>
              </div>
              <Input
                placeholder="e.g. EMP/12345"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              🔒 Thank you for helping bring transparency! Your account will be verified by an administrator within 24-48 hours.
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
            disabled={isSubmitting || (isKenya && kraPin !== '' && !!kraPinError)}
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

// Reusable file upload component with state management
const FileUploadField: React.FC<{
  label: string;
  fieldKey: string;
  onFileChange: (key: string, file: File | null) => void;
  currentFile?: File | null;
}> = ({ label, fieldKey, onFileChange, currentFile }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-colors">
      {currentFile ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
          <span className="text-foreground truncate max-w-[200px]">{currentFile.name}</span>
        </>
      ) : (
        <>
          <Upload className="h-4 w-4" />
          <span>Click to upload PDF or JPG</span>
        </>
      )}
      <input
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => onFileChange(fieldKey, e.target.files?.[0] || null)}
      />
    </label>
  </div>
);

export default RegistrationStep2;