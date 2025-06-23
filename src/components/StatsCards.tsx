
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Briefcase } from 'lucide-react';

interface StatsCardsProps {
  projectStats: {
    activeProjects: number;
    citizenReports: number;
    totalFunds: string;
  };
  getText: (en: string, sw: string) => string;
}

const StatsCards = ({ projectStats, getText }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            {getText('Active Projects', 'Miradi Inayoendelea')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{projectStats.activeProjects}</div>
          <p className="text-green-100 text-sm">
            {getText('Ongoing infrastructure work', 'Kazi za miundombinu zinazoendelea')}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Users className="h-5 w-5 mr-2" />
            {getText('Citizen Reports', 'Ripoti za Wananchi')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{projectStats.citizenReports.toLocaleString()}</div>
          <p className="text-blue-100 text-sm">
            {getText('Issues reported this month', 'Masuala yaliyoripotiwa mwezi huu')}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            {getText('Total Funds', 'Jumla ya Fedha')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{projectStats.totalFunds}</div>
          <p className="text-purple-100 text-sm">
            {getText('Allocated this fiscal year', 'Zimegawiwa mwaka huu wa fedha')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
