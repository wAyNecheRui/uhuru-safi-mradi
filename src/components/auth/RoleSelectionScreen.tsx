import React from 'react';
import { Users, Briefcase, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoleSelectionScreenProps {
  onSelectRole: (role: 'citizen' | 'contractor' | 'government') => void;
}

const roles = [
  {
    value: 'citizen' as const,
    title: 'Citizen',
    description: 'Report issues, verify projects, and register your skills',
    icon: Users,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    borderHover: 'hover:border-primary/40',
    badge: null,
  },
  {
    value: 'contractor' as const,
    title: 'Contractor',
    description: 'Bid on verified projects and receive guaranteed payments',
    icon: Briefcase,
    iconBg: 'bg-accent/15',
    iconColor: 'text-accent-foreground',
    borderHover: 'hover:border-accent/40',
    badge: null,
  },
  {
    value: 'government' as const,
    title: 'Government Official',
    description: 'Oversee projects, manage budgets, and ensure transparency',
    icon: Shield,
    iconBg: 'bg-[hsl(var(--info))]/10',
    iconColor: 'text-[hsl(var(--info))]',
    borderHover: 'hover:border-[hsl(var(--info))]/40',
    badge: null,
  },
];

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onSelectRole }) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-display font-semibold text-foreground">Join Uhuru Safi</h2>
        <p className="text-sm text-muted-foreground">Choose how you'd like to participate in building a better future</p>
      </div>

      {/* Flagship badge */}
      <div className="flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/8 px-3 py-1.5 rounded-full border border-primary/15">
          <span className="text-base leading-none">🇰🇪</span>
          Kenya — Flagship Market
        </span>
      </div>

      <div className="space-y-3">
        {roles.map(role => {
          const Icon = role.icon;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => onSelectRole(role.value)}
              className={`w-full group relative rounded-xl border border-border bg-card p-5 text-left transition-all duration-200 ${role.borderHover} hover:shadow-card-hover active:scale-[0.99]`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${role.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-6 w-6 ${role.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-foreground text-base mb-0.5">{role.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{role.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all mt-1 shrink-0" />
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <span className="text-primary font-medium cursor-pointer">Sign in instead</span>
      </p>
    </div>
  );
};

export default RoleSelectionScreen;
