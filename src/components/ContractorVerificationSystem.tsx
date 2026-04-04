
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Shield, Loader2, Building, FileText, BarChart3, FolderOpen, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useContractorVerification } from '@/hooks/useContractorVerification';
import CompanyProfileTab from '@/components/verification/CompanyProfileTab';
import CertificationsTab from '@/components/verification/CertificationsTab';
import ProjectsTab from '@/components/verification/ProjectsTab';
import PerformanceTab from '@/components/verification/PerformanceTab';

const ContractorVerificationSystem = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { toast } = useToast();
  const { verificationData, loading, handleDocumentUpload, refetch } = useContractorVerification();

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading verification data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!verificationData) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-12 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Complete Your Profile</h3>
          <p className="text-muted-foreground">No verification data available. Please complete your contractor profile first.</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-primary/10 text-primary border-primary/20';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate verification completion
  const totalCerts = verificationData.certifications?.length || 0;
  const verifiedCerts = verificationData.certifications?.filter((c: any) => c.status === 'verified').length || 0;
  const pendingCerts = verificationData.certifications?.filter((c: any) => c.status === 'pending').length || 0;

  return (
    <div className="space-y-6">
      {/* Verification Summary Header */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                Verification Dashboard
              </h2>
              <p className="text-muted-foreground mt-1">
                Maintain your credentials and track your professional standing.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={`${getStatusColor(verificationData.verificationStatus)} px-3 py-1.5 text-sm`}>
                {verificationData.verificationStatus === 'verified' ? (
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                ) : verificationData.verificationStatus === 'pending' ? (
                  <Clock className="h-4 w-4 mr-1.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-1.5" />
                )}
                {verificationData.verificationStatus.charAt(0).toUpperCase() + verificationData.verificationStatus.slice(1)}
              </Badge>
            </div>
          </div>
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-background/80 backdrop-blur rounded-lg p-3 text-center border">
              <p className="text-2xl font-bold text-foreground">{verifiedCerts}</p>
              <p className="text-xs text-muted-foreground">Verified Credentials</p>
            </div>
            <div className="bg-background/80 backdrop-blur rounded-lg p-3 text-center border">
              <p className="text-2xl font-bold text-yellow-600">{pendingCerts}</p>
              <p className="text-xs text-muted-foreground">Pending Review</p>
            </div>
            <div className="bg-background/80 backdrop-blur rounded-lg p-3 text-center border">
              <p className="text-2xl font-bold text-foreground">{verificationData.completedProjects}</p>
              <p className="text-xs text-muted-foreground">Completed Projects</p>
            </div>
            <div className="bg-background/80 backdrop-blur rounded-lg p-3 text-center border">
              <p className="text-2xl font-bold text-foreground">
                {(verificationData.overallRating || 0).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-background border shadow-sm h-auto p-1">
          <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs sm:text-sm py-2.5">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Company</span> Profile
          </TabsTrigger>
          <TabsTrigger value="certifications" className="flex items-center gap-1.5 text-xs sm:text-sm py-2.5">
            <FileText className="h-4 w-4" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-1.5 text-xs sm:text-sm py-2.5">
            <FolderOpen className="h-4 w-4" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-1.5 text-xs sm:text-sm py-2.5">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <CompanyProfileTab 
            verificationData={verificationData} 
            getStatusColor={getStatusColor} 
          />
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6">
          <CertificationsTab 
            verificationData={verificationData} 
            getStatusColor={getStatusColor}
            handleDocumentUpload={handleDocumentUpload}
            onUploadComplete={refetch}
          />
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <ProjectsTab 
            verificationData={verificationData} 
            formatAmount={formatAmount}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractorVerificationSystem;
