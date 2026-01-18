import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, MapPin, Phone, Wifi, Users, Briefcase, Shield } from 'lucide-react';
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
    { value: 'sms', icon: Phone, en: 'SMS/USSD', sw: 'SMS/USSD' },
    { value: 'offline', icon: Wifi, en: 'Offline', sw: 'Bila Mtandao' },
    { value: 'voting', icon: Users, en: 'Community', sw: 'Jamii' },
    { value: 'bidding', icon: Briefcase, en: 'Contractors', sw: 'Wakandarasi' },
    { value: 'government', icon: Shield, en: 'Government', sw: 'Serikali' }
  ];

  // Mobile: Horizontal scrollable tabs
  if (isMobile) {
    return (
      <ScrollArea className="w-full whitespace-nowrap">
        <TabsList 
          className="inline-flex h-auto p-1 bg-card shadow-lg rounded-lg w-max min-w-full"
          role="tablist"
          aria-label={getText('Main navigation tabs', 'Vikundi vya urambazaji mkuu')}
        >
          {tabs.map(({ value, icon: Icon, en, sw }) => (
            <TabsTrigger 
              key={value}
              value={value} 
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 min-w-[70px]',
                'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'touch-target'
              )}
              role="tab"
              aria-label={getText(en, sw)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs truncate max-w-[60px]">{getText(en, sw)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    );
  }

  // Tablet: Wrapped grid
  if (isTablet) {
    return (
      <TabsList 
        className="grid w-full grid-cols-4 h-auto p-1 bg-card shadow-lg rounded-lg gap-1"
        role="tablist"
        aria-label={getText('Main navigation tabs', 'Vikundi vya urambazaji mkuu')}
      >
        {tabs.map(({ value, icon: Icon, en, sw }) => (
          <TabsTrigger 
            key={value}
            value={value} 
            className={cn(
              'flex items-center justify-center gap-2 py-2.5',
              'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
            )}
            role="tab"
            aria-label={getText(en, sw)}
          >
            <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm truncate">{getText(en, sw)}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    );
  }

  // Desktop: Full row
  return (
    <TabsList 
      className="grid w-full grid-cols-7 h-auto p-1 bg-card shadow-lg rounded-lg"
      role="tablist"
      aria-label={getText('Main navigation tabs', 'Vikundi vya urambazaji mkuu')}
    >
      {tabs.map(({ value, icon: Icon, en, sw }) => (
        <TabsTrigger 
          key={value}
          value={value} 
          className={cn(
            'flex items-center justify-center gap-2 py-3',
            'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
          )}
          role="tab"
          aria-label={getText(en, sw)}
        >
          <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
          <span>{getText(en, sw)}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
};

export default TabNavigation;
