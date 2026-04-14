import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield, Loader2, Building, FileText, BarChart3, FolderOpen,
  CheckCircle, Clock, AlertTriangle, Star, TrendingUp, Award
} from 'lucide-react';
import { useContractorVerification } from '@/hooks/useContractorVerification';
import CompanyProfileTab from '@/components/verification/CompanyProfileTab';
import CertificationsTab from '@/components/verification/CertificationsTab';
import ProjectsTab from '@/components/verification/ProjectsTab';
import PerformanceTab from '@/components/verification/PerformanceTab';

const statusConfig = {
  verified: {
    icon: CheckCircle,
    label: 'VERIFIED',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    barColor: 'bg-emerald-500',
  },
  pending: {
    icon: Clock,
    label: 'PENDING REVIEW',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    barColor: 'bg-amber-400',
  },
  expired: {
    icon: AlertTriangle,
    label: 'ACTION REQUIRED',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    barColor: 'bg-red-500',
  },
};

const ContractorVerificationSystem = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { verificationData, loading, handleDocumentUpload, refetch } = useContractorVerification();

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground text-sm font-medium">Loading verification data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!verificationData) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Complete Your Profile</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            No verification data found. Please complete your contractor registration to proceed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const status = verificationData.verificationStatus as keyof typeof statusConfig;
  const cfg = statusConfig[status] || statusConfig.pending;
  const StatusIcon = cfg.icon;

  // Credential completion percentage
  const totalCerts = verificationData.certifications?.length || 0;
  const verifiedCerts = verificationData.certifications?.filter((c: any) => c.status === 'verified').length || 0;
  const pendingCerts = verificationData.certifications?.filter((c: any) => c.status === 'pending').length || 0;
  const completionPct = totalCerts > 0 ? Math.round((verifiedCerts / totalCerts) * 100) : 0;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);

  const getStatusColor = (s: string) => {
    if (s === 'verified') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (s === 'pending') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const kpiCards = [
    {
      label: 'Verified Credentials',
      value: verifiedCerts,
      sub: `of ${totalCerts} total`,
      icon: Award,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Pending Review',
      value: pendingCerts,
      sub: 'awaiting government approval',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Completed Projects',
      value: verificationData.completedProjects,
      sub: `${verificationData.activeProjects || 0} active`,
      icon: FolderOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Accountability Rating',
      value: (verificationData.overallRating || 0).toFixed(1),
      sub: verificationData.totalRatings > 0 ? `${verificationData.totalRatings} citizen reviews` : 'No ratings yet',
      icon: Star,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-100',
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Status Header ── */}
      <Card className={`border ${cfg.border} shadow-sm overflow-hidden`}>
        <div className={`${cfg.bg} px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${cfg.border} border bg-white shadow-sm`}>
              <StatusIcon className={`h-5 w-5 ${cfg.text}`} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Verification Status
              </p>
              <p className={`text-lg font-bold ${cfg.text}`}>{cfg.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground mb-1">Credential Completion</p>
              <p className={`text-sm font-bold ${cfg.text}`}>{completionPct}%</p>
            </div>
            <div className="w-32">
              <Progress value={completionPct} className="h-2" />
            </div>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 border-t">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${kpi.bg} ${kpi.border} border flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground leading-tight">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground font-medium leading-tight">{kpi.label}</p>
                  <p className="text-[10px] text-muted-foreground/60 truncate">{kpi.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Rated Stars visual if any ── */}
      {verificationData.overallRating > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100">
          <CardContent className="py-3 px-5 flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-5 w-5 ${s <= Math.round(verificationData.overallRating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-yellow-200 fill-yellow-100'
                    }`}
                />
              ))}
            </div>
            <div>
              <span className="font-bold text-yellow-800 text-lg">
                {verificationData.overallRating.toFixed(1)}
              </span>
              <span className="text-yellow-700 text-sm ml-1">/ 5.0 Accountability Score</span>
            </div>
            {verificationData.totalRatings > 0 && (
              <Badge className="ml-auto bg-yellow-100 text-yellow-800 border-yellow-200 border text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                {verificationData.totalRatings} citizen verification{verificationData.totalRatings !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tabbed Detail Sections ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full bg-white border shadow-sm h-12 p-1 rounded-xl grid grid-cols-4">
          {[
            { value: 'profile', label: 'Company', icon: Building },
            { value: 'certifications', label: 'Credentials', icon: FileText },
            { value: 'projects', label: 'Projects', icon: FolderOpen },
            { value: 'performance', label: 'Performance', icon: BarChart3 },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-blue-700 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-lg transition-all"
            >
              <Icon className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden xs:inline sm:inline">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="space-y-5 mt-0">
          <CompanyProfileTab verificationData={verificationData} getStatusColor={getStatusColor} />
        </TabsContent>

        <TabsContent value="certifications" className="space-y-5 mt-0">
          <CertificationsTab
            verificationData={verificationData}
            getStatusColor={getStatusColor}
            handleDocumentUpload={handleDocumentUpload}
            onUploadComplete={refetch}
          />
        </TabsContent>

        <TabsContent value="projects" className="space-y-5 mt-0">
          {verificationData.recentProjects?.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h4 className="font-semibold text-foreground mb-1">No Projects Yet</h4>
                <p className="text-sm text-muted-foreground">
                  Projects you are awarded will appear here with their ratings.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ProjectsTab verificationData={verificationData} formatAmount={formatAmount} />
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-5 mt-0">
          <PerformanceTab />
        </TabsContent>
      </Tabs>

      {/* ── Regulatory Footer Note ── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-start gap-3">
        <Shield className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500">
          All verifications are subject to the <strong>Public Procurement and Asset Disposal Act, 2015</strong> (PPADA).
          Credentials are validated by respective regulatory authorities. Falsification of records may result in deregistration.
        </p>
      </div>
    </div>
  );
};

export default ContractorVerificationSystem;
