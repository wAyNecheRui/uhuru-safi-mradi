import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      subtitleColor: 'text-green-100'
    },
    {
      icon: Users,
      title: getText('Citizen Reports', 'Ripoti za Wananchi'),
      value: projectStats.citizenReports.toLocaleString(),
      subtitle: getText('Issues reported this month', 'Masuala yaliyoripotiwa mwezi huu'),
      gradient: 'from-blue-500 to-blue-600',
      subtitleColor: 'text-blue-100'
    },
    {
      icon: Briefcase,
      title: getText('Total Funds', 'Jumla ya Fedha'),
      value: projectStats.totalFunds,
      subtitle: getText('Allocated this fiscal year', 'Zimegawiwa mwaka huu wa fedha'),
      gradient: 'from-purple-500 to-purple-600',
      subtitleColor: 'text-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card 
            key={index} 
            className={cn(
              'bg-gradient-to-br text-white',
              stat.gradient
            )}
          >
            <CardHeader className={cn(
              'pb-1 sm:pb-2',
              isMobile ? 'p-3' : 'p-4 sm:p-6'
            )}>
              <CardTitle className={cn(
                'font-medium flex items-center',
                isMobile ? 'text-sm' : 'text-base lg:text-lg'
              )}>
                <IconComponent className={cn(
                  'mr-2 flex-shrink-0',
                  isMobile ? 'h-4 w-4' : 'h-5 w-5'
                )} />
                <span className="truncate">{stat.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? 'p-3 pt-0' : 'p-4 sm:p-6 pt-0'}>
              <div className={cn(
                'font-bold',
                isMobile ? 'text-2xl' : 'text-2xl sm:text-3xl'
              )}>
                {stat.value}
              </div>
              <p className={cn(
                stat.subtitleColor,
                isMobile ? 'text-xs line-clamp-1' : 'text-sm line-clamp-2'
              )}>
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsCards;
