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
import { useProfile } from '@/hooks/useProfile';

const getRootCounty = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\s+county$/i, '')
    .replace(/\s+sub[- ]?county$/i, '')
    .replace(/\s+ward$/i, '')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
};

const Index = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { isMobile } = useResponsive();
  const { stats: projectStats, loading: statsLoading } = useProjectStats();
  const { issues: recentIssues, loading: issuesLoading } = useRecentIssues(3);
  const { userProfile } = useProfile();
  const homeCounty = userProfile?.county ? getRootCounty(userProfile.county) : 'Nairobi';

  const getText = (en: string) => en;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <ResponsiveContainer className="py-5 sm:py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
            <TabNavigation getText={getText} />

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-5 mt-0">
              {statsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : projectStats ? (
                <StatsCards projectStats={projectStats} getText={getText} />
              ) : null}

              {/* Map and Recent Issues */}
              <div className={`grid gap-5 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-base font-semibold">
                      <div className="p-1.5 rounded-lg bg-green-50 mr-2.5">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      Project Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ProjectMap selectedCounty={homeCounty} />
                  </CardContent>
                </Card>

                {issuesLoading ? (
                  <div className="bg-card border rounded-xl p-6 animate-pulse space-y-3">
                    <div className="h-5 bg-muted rounded w-1/3" />
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-muted rounded-xl" />
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
