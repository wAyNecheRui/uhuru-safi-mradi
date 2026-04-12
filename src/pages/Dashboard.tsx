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

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { isMobile } = useResponsive();
  const { stats: projectStats, loading: statsLoading } = useProjectStats();
  const { issues: recentIssues, loading: issuesLoading } = useRecentIssues(3);

  const getText = (en: string) => en;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <ResponsiveContainer className="py-5 sm:py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
            <TabNavigation getText={getText} />

            <TabsContent value="overview" className="space-y-5 mt-0">
              <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-lg border shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Welcome to Uhuru Safi Mradi</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Select a module from the tabs above to manage community voting, simple reports, escrow, or specific roles.
                </p>
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

export default Dashboard;
