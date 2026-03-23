import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, MapPin, Wifi, Users, Briefcase, Shield } from 'lucide-react';
import { useViewport } from '@/hooks/useViewport';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface TabNavigationProps {
  getText: (en: string, sw: string) => string;
}

const TabNavigation = ({ getText }: TabNavigationProps) => {
  const { isMobile, isTablet } = useViewport();
  
  const tabs = [
    { value: 'overview', icon: TrendingUp, en: 'Overview', sw: 'Muhtasari' },
    { value: 'simple-report', icon: MapPin, en: 'Quick Report', sw: 'Ripoti Haraka' },
    { value: 'offline', icon: Wifi, en: 'Offline', sw: 'Bila Mtandao' },
    { value: 'voting', icon: Users, en: 'Community', sw: 'Jamii' },
    { value: 'bidding', icon: Briefcase, en: 'Contractors', sw: 'Wakandarasi' },
    { value: 'government', icon: Shield, en: 'Government', sw: 'Serikali' }
  ];

  if (isMobile) {
    return (
      <ScrollArea className="w-full whitespace-nowrap">
        <TabsList 
          className="inline-flex h-auto p-1 bg-card border shadow-sm rounded-xl w-max min-w-full"
          role="tablist"
        >
          {tabs.map(({ value, icon: Icon, en, sw }) => (
            <TabsTrigger 
              key={value}
              value={value} 
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2.5 min-w-[68px] rounded-lg',
                'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm',
                'transition-all duration-200',
                'touch-target'
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="text-[10px] font-medium truncate max-w-[60px]">{getText(en, sw)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    );
  }

  return (
    <TabsList 
      className={cn(
        'h-auto p-1 bg-card border shadow-sm rounded-xl',
        isTablet ? 'grid w-full grid-cols-4 gap-0.5' : 'grid w-full grid-cols-6'
      )}
      role="tablist"
    >
      {tabs.map(({ value, icon: Icon, en, sw }) => (
        <TabsTrigger 
          key={value}
          value={value} 
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg transition-all duration-200',
            isTablet ? 'py-2.5' : 'py-2.5',
            'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm'
          )}
        >
          <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium">{getText(en, sw)}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
};

export default TabNavigation;
