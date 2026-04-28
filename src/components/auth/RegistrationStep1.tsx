import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Loader2, User, Mail, Building, Shield as ShieldIcon, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import CountrySelector from './CountrySelector';
import PhoneInput from './PhoneInput';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import SocialAuthButtons from './SocialAuthButtons';
import AuthDivider from './AuthDivider';
import { KENYA_COUNTIES, GOVERNMENT_DEPARTMENTS, GOVERNMENT_POSITIONS } from '@/constants/kenyaAdministrativeUnits';
import type { AuthFormData } from '@/hooks/useAuthForm';

interface RegistrationStep1Props {
  role: 'citizen' | 'contractor' | 'government';
  formData: AuthFormData;
  isLoading: boolean;
  onInputChange: (field: string, value: string | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

const RegistrationStep1: React.FC<RegistrationStep1Props> = ({
  role, formData, isLoading, onInputChange, onSubmit, onBack
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isKenya = (formData as any).country === 'KE';
  const countyRequired = role === 'citizen' || role === 'government';

  const handleSubmit = (e: React.FormEvent) => {
    if (countyRequired && !formData.county?.trim()) {
      e.preventDefault();
      // Surface clear UX
      // eslint-disable-next-line no-alert
      alert(
        isKenya
          ? 'Please select your county. This is permanent and cannot be changed later.'
          : 'Please enter your region / state. This is permanent and cannot be changed later.'
      );
      return;
    }
    onSubmit(e);
  };

  const roleLabels = {
    citizen: { title: 'Create Your Account', subtitle: 'Quick & easy — takes under 60 seconds', icon: User, accent: 'primary' },
    contractor: { title: 'Contractor Registration', subtitle: 'Get started with your business profile', icon: Building, accent: 'accent' },
    government: { title: 'Official Registration', subtitle: 'Join with your government credentials', icon: ShieldIcon, accent: 'primary' },
  };

  const config = roleLabels[role];
  const Icon = config.icon;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Go back">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-foreground text-base">{config.title}</h2>
              <p className="text-xs text-muted-foreground">{config.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-primary" />
        <div className="flex-1 h-1.5 rounded-full bg-muted" />
        <span className="text-[11px] text-muted-foreground font-medium">Step 1 of 2</span>
      </div>

      {/* Social auth for citizens */}
      {role === 'citizen' && (
        <>
          <SocialAuthButtons disabled={isLoading} />
          <AuthDivider text="or register with email" />
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Full Name *</label>
          <Input
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {/* Contractor: Business Name */}
        {role === 'contractor' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Business / Company Name *</label>
            <Input
              placeholder="Registered business name"
              value={formData.organization}
              onChange={(e) => onInputChange('organization', e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        )}

        {/* Government: Designation & Department */}
        {role === 'government' && (
          <>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Official Designation / Job Title *</label>
              <Select value={formData.position} onValueChange={(v) => onInputChange('position', v)}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue placeholder="County Engineer, Procurement Officer…" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {GOVERNMENT_POSITIONS.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Ministry / Department / Agency *</label>
              <Select value={formData.department} onValueChange={(v) => onInputChange('department', v)}>
                <SelectTrigger disabled={isLoading}>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {GOVERNMENT_DEPARTMENTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Email */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <label className="text-sm font-medium text-foreground">Email Address *</label>
            {role === 'government' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent><p className="text-xs">Official government email preferred</p></TooltipContent>
              </Tooltip>
            )}
          </div>
          <Input
            type="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {/* Country */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Country *</label>
          <CountrySelector
            value={(formData as any).country || 'KE'}
            onChange={(code) => onInputChange('country', code)}
            disabled={isLoading}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Phone Number</label>
          <PhoneInput
            value={formData.phone}
            onChange={(v) => onInputChange('phone', v)}
            countryCode={(formData as any).country || 'KE'}
            onCountryCodeChange={(code) => onInputChange('country', code)}
            disabled={isLoading}
          />
        </div>

        {/* Region — dynamic based on country */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            {role === 'contractor'
              ? (isKenya ? 'HQ County (optional)' : 'HQ Region (optional)')
              : (isKenya ? 'County *' : 'Region / State / Province *')}
          </label>
          {isKenya ? (
            <Select value={formData.county} onValueChange={(v) => onInputChange('county', v)}>
              <SelectTrigger disabled={isLoading}>
                <SelectValue placeholder={role === 'contractor' ? 'Select HQ county' : 'Select your county'} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {KENYA_COUNTIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder={role === 'contractor' ? 'City / Region of HQ' : 'Your region or state'}
              value={formData.county}
              onChange={(e) => onInputChange('county', e.target.value)}
              disabled={isLoading}
              required={countyRequired}
            />
          )}
          {countyRequired && (
            <p className="text-[11px] text-muted-foreground">
              {role === 'government'
                ? 'Your jurisdiction. This will be locked to your account once saved.'
                : 'Your home county. This will be locked to your account once saved.'}
            </p>
          )}
          {role === 'contractor' && (
            <p className="text-[11px] text-muted-foreground">
              Informational only — you can bid on projects nationwide.
            </p>
          )}
        </div>

        {/* Passwords */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Password *</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => onInputChange('password', e.target.value)}
              disabled={isLoading}
              required
              minLength={8}
              className="pr-10"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrengthMeter password={formData.password} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Confirm Password *</label>
          <div className="relative">
            <Input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => onInputChange('confirmPassword', e.target.value)}
              disabled={isLoading}
              required
              className="pr-10"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating Account...</>
          ) : (
            'Create My Account'
          )}
        </Button>
      </form>
    </div>
  );
};

export default RegistrationStep1;
