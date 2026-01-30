import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ContractorVerificationSystem from '@/components/ContractorVerificationSystem';
import ContractorCapacityCard from '@/components/cycles/ContractorCapacityCard';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const ContractorVerification = () => {
  const { user } = useAuth();
  const [capacityData, setCapacityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'Verification System' }
  ];

  useEffect(() => {
    if (user) {
      fetchCapacityData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCapacityData = async () => {
    try {
      // Fetch contractor profile
      const { data: profile } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      // Fetch active projects count
      const { data: activeProjects } = await supabase
        .from('projects')
        .select('id, budget')
        .eq('contractor_id', user!.id)
        .eq('status', 'in_progress');

      // Fetch completed projects count
      const { data: completedProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('contractor_id', user!.id)
        .eq('status', 'completed');

      if (profile) {
        const activeCount = activeProjects?.length || 0;
        const maxCapacity = profile.max_project_capacity || 5;
        const totalBudget = profile.total_contract_value || 0;
        
        // Calculate qualification based on total contract value
        let qualifiedSize: 'small' | 'medium' | 'large' | 'mega' = 'small';
        if (totalBudget >= 1000000000) qualifiedSize = 'mega';
        else if (totalBudget >= 100000000) qualifiedSize = 'large';
        else if (totalBudget >= 10000000) qualifiedSize = 'medium';

        setCapacityData({
          companyName: profile.company_name,
          financialCapacity: totalBudget,
          currentActiveProjects: activeCount,
          maxConcurrentProjects: maxCapacity,
          availableCapacity: Math.max(0, maxCapacity - activeCount) * (totalBudget / maxCapacity || 1000000),
          qualifiedForProjectSize: qualifiedSize,
          verificationStatus: profile.verified ? 'verified' : 'pending',
          rating: profile.average_rating || 0,
          completedProjects: completedProjects?.length || 0
        });
      }
    } catch (error) {
      console.error('Error fetching capacity data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          {/* Contractor Trust & Verification Cycle Banner */}
          <Card className="mb-6 border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-transparent">
            <CardContent className="p-4">
              <h2 className="font-semibold text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Contractor Trust & Verification Cycle
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Complete your verification to access government projects. This includes credential validation, 
                financial capacity assessment, and building your accountability rating through project performance.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Registration
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Capacity Assessment
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Credential Verification
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Accountability Rating
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          {/* Financial Capacity Assessment Card */}
          {loading ? (
            <Card className="mb-6">
              <CardContent className="p-6 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading capacity data...</span>
              </CardContent>
            </Card>
          ) : capacityData && (
            <div className="mb-6">
              <ContractorCapacityCard
                contractorId={user?.id || ''}
                companyName={capacityData.companyName}
                financialCapacity={capacityData.financialCapacity}
                currentActiveProjects={capacityData.currentActiveProjects}
                maxConcurrentProjects={capacityData.maxConcurrentProjects}
                availableCapacity={capacityData.availableCapacity}
                qualifiedForProjectSize={capacityData.qualifiedForProjectSize}
                verificationStatus={capacityData.verificationStatus}
                rating={capacityData.rating}
                completedProjects={capacityData.completedProjects}
              />
            </div>
          )}
          
          <ContractorVerificationSystem />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ContractorVerification;
