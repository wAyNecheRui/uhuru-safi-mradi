import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ContractorVerificationSystem from '@/components/ContractorVerificationSystem';
import ContractorCapacityCard from '@/components/cycles/ContractorCapacityCard';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, Clock, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchContractorRatingsFromVerifications } from '@/utils/contractorRatingCalculation';

const PIPELINE_STEPS = [
  { label: 'Registration', icon: CheckCircle, desc: 'Company & KRA PIN' },
  { label: 'Capacity Assessment', icon: Shield, desc: 'Financial & technical' },
  { label: 'Credential Verification', icon: Clock, desc: 'Documents reviewed' },
  { label: 'Accountability Rating', icon: AlertTriangle, desc: 'Performance tracked' },
];

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
      const [profileResult, activeProjectsResult, completedProjectsResult, realRatingsData] = await Promise.all([
        supabase.from('contractor_profiles').select('*').eq('user_id', user!.id).maybeSingle(),
        supabase.from('projects').select('id, budget').eq('contractor_id', user!.id).eq('status', 'in_progress'),
        supabase.from('projects').select('id').eq('contractor_id', user!.id).eq('status', 'completed'),
        fetchContractorRatingsFromVerifications([user!.id])
      ]);

      const profile = profileResult.data;
      const activeProjects = activeProjectsResult.data;
      const completedProjects = completedProjectsResult.data;

      if (profile) {
        const activeCount = activeProjects?.length || 0;
        const maxCapacity = profile.max_project_capacity || 5;
        const totalBudget = profile.total_contract_value || 0;
        const realRating = realRatingsData[user!.id];
        const avgRating = realRating?.averageRating || 0;

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
          rating: avgRating,
          completedProjects: completedProjects?.length || 0,
          totalRatings: realRating?.totalRatings || 0
        });
      }
    } catch (error) {
      console.error('Error fetching capacity data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />

          {/* ── Government Portal Hero Banner ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white mb-6 shadow-xl">
            {/* decorative grid */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />
            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-white/10 rounded-lg border border-white/20">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-blue-200 text-xs font-semibold uppercase tracking-widest">
                      Kenya Government · Public Procurement Portal
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Contractor Trust & Verification System
                  </h1>
                  <p className="text-blue-200 text-sm mt-1 max-w-xl">
                    Maintain your professional standing and credentials to remain eligible for government infrastructure contracts.
                  </p>
                </div>
                {capacityData && (
                  <Badge
                    className={`self-start sm:self-center px-4 py-2 text-sm font-semibold border flex items-center gap-2 ${capacityData.verificationStatus === 'verified'
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                        : 'bg-amber-500/20 text-amber-200 border-amber-400/30'
                      }`}
                  >
                    {capacityData.verificationStatus === 'verified'
                      ? <CheckCircle className="h-4 w-4" />
                      : <Clock className="h-4 w-4" />
                    }
                    {capacityData.verificationStatus === 'verified' ? 'VERIFIED CONTRACTOR' : 'PENDING VERIFICATION'}
                  </Badge>
                )}
              </div>

              {/* Pipeline Steps */}
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PIPELINE_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex items-center gap-2">
                      <div className="flex-1 bg-white/10 border border-white/20 rounded-xl p-3 backdrop-blur-sm">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">
                            {i + 1}
                          </div>
                          <span className="text-white text-xs font-semibold">{step.label}</span>
                        </div>
                        <p className="text-blue-200 text-[10px]">{step.desc}</p>
                      </div>
                      {i < PIPELINE_STEPS.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-blue-300 flex-shrink-0 hidden sm:block" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Financial Capacity Card ── */}
          {loading ? (
            <Card className="mb-6 border-0 shadow-sm">
              <CardContent className="p-6 flex items-center justify-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-muted-foreground text-sm">Loading capacity assessment...</span>
              </CardContent>
            </Card>
          ) : capacityData ? (
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
          ) : null}

          {/* ── Main Verification System ── */}
          <ContractorVerificationSystem />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ContractorVerification;
