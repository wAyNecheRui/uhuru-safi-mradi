
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, MapPin, Phone, Wifi, Users, Briefcase, Shield } from 'lucide-react';

interface TabNavigationProps {
  getText: (en: string, sw: string) => string;
}

const TabNavigation = ({ getText }: TabNavigationProps) => {
  return (
    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto p-1 bg-white shadow-lg rounded-lg">
      <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
        <TrendingUp className="h-4 w-4" />
        <span className="hidden sm:inline">{getText('Overview', 'Muhtasari')}</span>
      </TabsTrigger>
      <TabsTrigger value="simple-report" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
        <MapPin className="h-4 w-4" />
        <span className="hidden sm:inline">{getText('Quick Report', 'Ripoti Haraka')}</span>
      </TabsTrigger>
      <TabsTrigger value="sms" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
        <Phone className="h-4 w-4" />
        <span className="hidden sm:inline">{getText('SMS/USSD', 'SMS/USSD')}</span>
      </TabsTrigger>
      <TabsTrigger value="offline" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
        <Wifi className="h-4 w-4" />
        <span className="hidden sm:inline">{getText('Offline', 'Bila Mtandao')}</span>
      </TabsTrigger>
      <TabsTrigger value="voting" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
        <Users className="h-4 w-4" />
        <span className="hidden sm:inline">{getText('Community', 'Jamii')}</span>
      </TabsTrigger>
      <TabsTrigger value="bidding" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
        <Briefcase className="h-4 w-4" />
        <span className="hidden sm:inline">{getText('Contractors', 'Wakandarasi')}</span>
      </TabsTrigger>
      <TabsTrigger value="government" className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
        <Shield className="h-4 w-4" />
        <span className="hidden sm:inline">{getText('Government', 'Serikali')}</span>
      </TabsTrigger>
    </TabsList>
  );
};

export default TabNavigation;
