import React from 'react';
import { TrendingUp, Users, Briefcase } from 'lucide-react';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/utils';

interface StatsCardsProps {
  projectStats: {
    activeProjects: number;
    citizenReports: number;
    totalFunds: string;
  };
  getText: (en: string, sw: string) => string;
}

const StatsCards = ({ projectStats, getText }: StatsCardsProps) => {
  const { isMobile } = useViewport();
  
  const stats = [
    {
      icon: TrendingUp,
      title: getText('Active Projects', 'Miradi Inayoendelea'),
      value: projectStats.activeProjects,
      subtitle: getText('Ongoing infrastructure work', 'Kazi za miundombinu zinazoendelea'),
      color: 'text-primary',
      bg: 'bg-primary/5',
      iconBg: 'bg-primary/10',
      border: 'border-primary/10',
    },
    {
      icon: Users,
      title: getText('Citizen Reports', 'Ripoti za Wananchi'),
      value: projectStats.citizenReports.toLocaleString(),
      subtitle: getText('Issues reported this month', 'Masuala yaliyoripotiwa mwezi huu'),
      color: 'text-accent-foreground',
      bg: 'bg-accent/10',
      iconBg: 'bg-accent/20',
      border: 'border-accent/15',
    },
    {
      icon: Briefcase,
      title: getText('Total Funds', 'Jumla ya Fedha'),
      value: projectStats.totalFunds,
      subtitle: getText('Allocated this fiscal year', 'Zimegawiwa mwaka huu wa fedha'),
      color: 'text-green-700',
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      border: 'border-green-100',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={index}
            className={cn(
              'relative rounded-xl border p-5 transition-all duration-200 hover:shadow-card-hover',
              stat.bg,
              stat.border
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={cn('font-medium text-sm text-muted-foreground')}>
                {stat.title}
              </span>
              <div className={cn('rounded-lg p-2', stat.iconBg)}>
                <IconComponent className={cn('h-4 w-4', stat.color)} />
              </div>
            </div>
            <div className={cn('font-bold tracking-tight', stat.color, isMobile ? 'text-2xl' : 'text-3xl')}>
              {stat.value}
            </div>
            <p className="text-muted-foreground text-xs mt-1.5 line-clamp-1">
              {stat.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
