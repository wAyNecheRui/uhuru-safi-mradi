
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, MapPin, Phone, Wifi, Users, Briefcase, Shield } from 'lucide-react';

interface TabNavigationProps {
  getText: (en: string, sw: string) => string;
}

const TabNavigation = ({ getText }: TabNavigationProps) => {
  const tabs = [
    { value: 'overview', icon: TrendingUp, en: 'Overview', sw: 'Muhtasari' },
    { value: 'simple-report', icon: MapPin, en: 'Quick Report', sw: 'Ripoti Haraka' },
    { value: 'sms', icon: Phone, en: 'SMS/USSD', sw: 'SMS/USSD' },
    { value: 'offline', icon: Wifi, en: 'Offline', sw: 'Bila Mtandao' },
    { value: 'voting', icon: Users, en: 'Community', sw: 'Jamii' },
    { value: 'bidding', icon: Briefcase, en: 'Contractors', sw: 'Wakandarasi' },
    { value: 'government', icon: Shield, en: 'Government', sw: 'Serikali' }
  ];

  return (
    <TabsList 
      className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto p-1 bg-white shadow-lg rounded-lg"
      role="tablist"
      aria-label={getText('Main navigation tabs', 'Vikundi vya urambazaji mkuu')}
    >
      {tabs.map(({ value, icon: Icon, en, sw }) => (
        <TabsTrigger 
          key={value}
          value={value} 
          className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          role="tab"
          aria-label={getText(en, sw)}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{getText(en, sw)}</span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
};

export default TabNavigation;
