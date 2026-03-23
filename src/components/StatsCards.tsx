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
      gradient: 'from-green-500 to-green-600',
      iconBg: 'bg-green-400/20',
    },
    {
      icon: Users,
      title: getText('Citizen Reports', 'Ripoti za Wananchi'),
      value: projectStats.citizenReports.toLocaleString(),
      subtitle: getText('Issues reported this month', 'Masuala yaliyoripotiwa mwezi huu'),
      gradient: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-400/20',
    },
    {
      icon: Briefcase,
      title: getText('Total Funds', 'Jumla ya Fedha'),
      value: projectStats.totalFunds,
      subtitle: getText('Allocated this fiscal year', 'Zimegawiwa mwaka huu wa fedha'),
      gradient: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-400/20',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 stagger-children">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={index}
            className={cn(
              'relative bg-gradient-to-br text-white rounded-2xl overflow-hidden card-hover',
              stat.gradient,
              isMobile ? 'p-4' : 'p-5'
            )}
          >
            {/* Decorative circle */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <span className={cn(
                  'font-medium',
                  isMobile ? 'text-sm' : 'text-sm'
                )}>
                  {stat.title}
                </span>
                <div className={cn('rounded-xl p-2', stat.iconBg)}>
                  <IconComponent className="h-4 w-4" />
                </div>
              </div>
              <div className={cn(
                'font-bold tracking-tight',
                isMobile ? 'text-2xl' : 'text-3xl'
              )}>
                {stat.value}
              </div>
              <p className="text-white/70 text-xs mt-1 line-clamp-1">
                {stat.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
