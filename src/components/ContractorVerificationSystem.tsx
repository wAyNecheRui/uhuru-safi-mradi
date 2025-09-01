
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useContractorVerification } from '@/hooks/useContractorVerification';
import CompanyProfileTab from '@/components/verification/CompanyProfileTab';
import CertificationsTab from '@/components/verification/CertificationsTab';
import ProjectsTab from '@/components/verification/ProjectsTab';
import PerformanceTab from '@/components/verification/PerformanceTab';

const ContractorVerificationSystem = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { toast } = useToast();
  const { verificationData, loading, handleDocumentUpload } = useContractorVerification();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="shadow-xl border-t-4 border-t-blue-600">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading verification data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verificationData) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="shadow-xl border-t-4 border-t-blue-600">
          <CardContent className="p-6 text-center">
            <p>No verification data available. Please complete your profile first.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="flex items-center text-2xl">
            <Shield className="h-6 w-6 mr-3 text-blue-600" />
            Contractor Verification System
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Maintain professional credentials, track performance, and build trust with the community.
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg">
          <TabsTrigger value="profile">Company Profile</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="projects">Project History</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
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
