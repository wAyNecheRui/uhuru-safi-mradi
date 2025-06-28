
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { MapPin } from 'lucide-react';
import ProjectMap from '@/components/ProjectMap';
import ContractorBidding from '@/components/ContractorBidding';
import GovernmentDashboard from '@/components/GovernmentDashboard';
import CommunityVoting from '@/components/CommunityVoting';
import EscrowManagement from '@/components/EscrowManagement';
import SimplifiedReporting from '@/components/SimplifiedReporting';
import SMSIntegration from '@/components/SMSIntegration';
import OfflineSupport from '@/components/OfflineSupport';
import Header from '@/components/Header';
import StatsCards from '@/components/StatsCards';
import RecentIssues from '@/components/RecentIssues';
import AppFooter from '@/components/AppFooter';
import TabNavigation from '@/components/TabNavigation';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useResponsive } from '@/hooks/useResponsive';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCounty, setSelectedCounty] = useState('Nairobi');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const { isMobile } = useResponsive();

  const getText = (en: string, sw: string = '') => {
    return currentLanguage === 'sw' ? sw : en;
  };

  // Mock data for demonstration
  const projectStats = {
    totalProjects: 1247,
    activeProjects: 89,
    completedProjects: 892,
    totalFunds: 'KES 2.4B',
    citizenReports: 3456,
    verifiedContractors: 234
  };

  const recentIssues = [
    {
      id: 1,
      title: 'Pothole on Mombasa Road',
      location: 'Nairobi County',
      votes: 156,
      status: 'Under Review',
      urgency: 'High',
      reportedAt: '2 hours ago'
    },
    {
      id: 2,
      title: 'Broken Street Light - Kasarani',
      location: 'Nairobi County',
      votes: 89,
      status: 'Contractor Assigned',
      urgency: 'Medium',
      reportedAt: '5 hours ago'
    },
    {
      id: 3,
      title: 'Water Pipeline Leak',
      location: 'Kiambu County',
      votes: 234,
      status: 'In Progress',
      urgency: 'Critical',
      reportedAt: '1 day ago'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header 
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        selectedCounty={selectedCounty}
        onCountyChange={setSelectedCounty}
        getText={getText}
      />

      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabNavigation getText={getText} />

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <StatsCards projectStats={projectStats} getText={getText} />

              {/* Map and Recent Issues */}
              <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                      {getText(`Project Map - ${selectedCounty}`, `Ramani ya Miradi - ${selectedCounty}`)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ProjectMap selectedCounty={selectedCounty} />
                  </CardContent>
                </Card>

                <RecentIssues issues={recentIssues} getText={getText} />
              </div>
            </TabsContent>

            <TabsContent value="simple-report">
              <SimplifiedReporting />
            </TabsContent>

            <TabsContent value="sms">
              <SMSIntegration />
            </TabsContent>

            <TabsContent value="offline">
              <OfflineSupport />
            </TabsContent>

            <TabsContent value="voting">
              <CommunityVoting />
            </TabsContent>

            <TabsContent value="bidding">
              <ContractorBidding />
            </TabsContent>

            <TabsContent value="government">
              <GovernmentDashboard />
            </TabsContent>

            <TabsContent value="escrow">
              <EscrowManagement />
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>

      <AppFooter getText={getText} />
    </div>
  );
};

export default Dashboard;
