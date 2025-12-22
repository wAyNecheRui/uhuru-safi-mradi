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
import { useProjectStats } from '@/hooks/useProjectStats';
import { useRecentIssues } from '@/hooks/useRecentIssues';

const Index = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { isMobile } = useResponsive();
  const { stats: projectStats, loading: statsLoading } = useProjectStats();
  const { issues: recentIssues, loading: issuesLoading } = useRecentIssues(3);

  const getText = (en: string) => en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header />

      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabNavigation getText={getText} />

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              {statsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : projectStats ? (
                <StatsCards projectStats={projectStats} getText={getText} />
              ) : null}

              {/* Map and Recent Issues */}
              <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg sm:text-xl">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                      Project Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ProjectMap selectedCounty="Nairobi" />
                  </CardContent>
                </Card>

                {issuesLoading ? (
                  <div className="bg-white p-6 rounded-lg shadow animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="border-b pb-3 mb-3 last:border-b-0">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <RecentIssues issues={recentIssues} getText={getText} />
                )}
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

export default Index;
