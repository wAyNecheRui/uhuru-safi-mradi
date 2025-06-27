
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VerificationData } from '@/types/contractorVerification';
import CompanyProfileTab from '@/components/verification/CompanyProfileTab';
import CertificationsTab from '@/components/verification/CertificationsTab';
import ProjectsTab from '@/components/verification/ProjectsTab';
import PerformanceTab from '@/components/verification/PerformanceTab';

const ContractorVerificationSystem = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { toast } = useToast();

  const verificationData: VerificationData = {
    companyName: 'Quality Builders Ltd',
    kraPin: 'P051234567X',
    registrationNumber: 'CPL/2018/123456',
    physicalAddress: 'Mombasa Road, Industrial Area, Nairobi',
    yearsInBusiness: 8,
    verificationStatus: 'verified',
    overallRating: 4.6,
    totalProjects: 47,
    completedProjects: 44,
    activeProjects: 3,
    specializations: ['Road Construction', 'Water Infrastructure', 'Building Construction'],
    certifications: [
      { name: 'NCA Contractor Registration', status: 'verified', expiryDate: '2025-12-31' },
      { name: 'OSHA Safety Certification', status: 'verified', expiryDate: '2025-06-30' },
      { name: 'Environmental Impact Assessment', status: 'pending', expiryDate: '2024-12-31' }
    ],
    recentProjects: [
      {
        id: 1,
        title: 'Machakos Market Road Rehabilitation',
        value: 4800000,
        status: 'completed',
        rating: 4.8,
        completionDate: '2024-02-15',
        clientFeedback: 'Excellent work quality and timely completion.'
      },
      {
        id: 2,
        title: 'Kibera Water Pipeline Extension',
        value: 4200000,
        status: 'in_progress',
        progress: 65,
        startDate: '2024-01-18',
        expectedCompletion: '2024-04-25'
      }
    ]
  };

  const handleDocumentUpload = (docType: string) => {
    toast({
      title: "Document uploaded successfully",
      description: `${docType} has been submitted for verification.`,
    });
  };

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
