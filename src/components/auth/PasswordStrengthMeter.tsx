import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const checks = useMemo(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
  ], [password]);

  const strength = checks.filter(c => c.met).length;
  const strengthLabel = strength <= 1 ? 'Weak' : strength <= 2 ? 'Fair' : strength <= 3 ? 'Good' : 'Strong';
  const strengthColor = strength <= 1 ? 'bg-destructive' : strength <= 2 ? 'bg-warning' : strength <= 3 ? 'bg-primary' : 'bg-[hsl(var(--success))]';

  if (!password) return null;

  return (
    <div className="space-y-2 mt-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= strength ? strengthColor : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${
          strength <= 1 ? 'text-destructive' : strength <= 2 ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--success))]'
        }`}>
          {strengthLabel}
        </span>
      </div>
      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1">
        {checks.map((check, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {check.met ? (
              <Check className="h-3 w-3 text-[hsl(var(--success))]" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={`text-[11px] ${check.met ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthMeter;
