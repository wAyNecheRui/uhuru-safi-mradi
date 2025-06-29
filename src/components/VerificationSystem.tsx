
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle, AlertTriangle, FileCheck, Users, Building, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const VerificationSystem = () => {
  const [verificationInProgress, setVerificationInProgress] = useState<string | null>(null);
  const { toast } = useToast();

  const ncaVerifications = [
    {
      contractorName: 'ABC Construction Ltd',
      ncaNumber: 'NCA/DB/8765/2023',
      category: 'Building - Class 8',
      status: 'verified',
      expiryDate: '2025-12-31',
      specializations: ['Road Construction', 'Water Infrastructure'],
      verificationDate: '2024-01-15',
      riskScore: 'Low'
    },
    {
      contractorName: 'Kenya Water Works Ltd',
      ncaNumber: 'NCA/DB/5432/2023',
      category: 'Civil Engineering - Class 7',
      status: 'verified',
      expiryDate: '2025-08-15',
      specializations: ['Water Systems', 'Pipeline Installation'],
      verificationDate: '2024-01-20',
      riskScore: 'Low'
    }
  ];

  const eaccClearances = [
    {
      contractorName: 'ABC Construction Ltd',
      clearanceNumber: 'EACC/CLR/2024/0123',
      status: 'cleared',
      issuedDate: '2024-01-10',
      validUntil: '2024-07-10',
      riskLevel: 'Low',
      pastCases: 0,
      complianceScore: 95
    },
    {
      contractorName: 'Quality Builders Ltd',
      clearanceNumber: 'EACC/CLR/2024/0089',
      status: 'under_review',
      issuedDate: 'Pending',
      validUntil: 'Pending',
      riskLevel: 'Medium',
      pastCases: 1,
      complianceScore: 78
    }
  ];

  const citizenVerifications = [
    {
      projectTitle: 'Machakos Market Road Rehabilitation',
      totalVerifications: 38,
      requiredVerifications: 30,
      verificationPercentage: 127,
      lastVerified: '2024-02-01T14:30:00Z',
      verificationMethods: ['Physical Site Visit', 'Photo Evidence', 'USSD Confirmation'],
      averageRating: 4.6,
      issues: 0
    },
    {
      projectTitle: 'Kibera Water Pipeline Extension',
      totalVerifications: 23,
      requiredVerifications: 30,
      verificationPercentage: 77,
      lastVerified: '2024-01-28T10:15:00Z',
      verificationMethods: ['Photo Evidence', 'SMS Report'],
      averageRating: 4.1,
      issues: 2
    }
  ];

  const handleVerification = async (type: string, id: string) => {
    setVerificationInProgress(`${type}-${id}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Verification Completed",
      description: `${type} verification has been successfully processed.`,
    });
    
    setVerificationInProgress(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'cleared': return 'bg-green-100 text-green-800 border-green-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card className="shadow-xl border-t-4 border-t-purple-600">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardTitle className="flex items-center text-2xl">
            <Shield className="h-6 w-6 mr-3 text-purple-600" />
            Comprehensive Verification System
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Multi-layered verification with NCA, EACC, and citizen oversight to eliminate ghost projects and ensure contractor legitimacy.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="nca" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg">
          <TabsTrigger value="nca">NCA Verification</TabsTrigger>
          <TabsTrigger value="eacc">EACC Clearance</TabsTrigger>
          <TabsTrigger value="citizen">Citizen Oversight</TabsTrigger>
        </TabsList>

        <TabsContent value="nca" className="space-y-6">
          <div className="grid gap-6">
            {ncaVerifications.map((contractor, index) => (
              <Card key={index} className="shadow-lg border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">{contractor.contractorName}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">NCA Number: </span>
                            <span className="font-medium">{contractor.ncaNumber}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Category: </span>
                            <span className="font-medium">{contractor.category}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getStatusColor(contractor.status)}>
                          {contractor.status.toUpperCase()}
                        </Badge>
                        <div className="text-sm text-gray-600">
                          Expires: {new Date(contractor.expiryDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Specializations</div>
                        <div className="space-y-1">
                          {contractor.specializations.map((spec) => (
                            <Badge key={spec} variant="outline" className="text-xs mr-1">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Risk Assessment</div>
                        <div className={`font-semibold ${getRiskColor(contractor.riskScore)}`}>
                          {contractor.riskScore} Risk
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Last Verified</div>
                        <div className="text-sm">
                          {new Date(contractor.verificationDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleVerification('NCA', contractor.ncaNumber)}
                        disabled={verificationInProgress === `NCA-${contractor.ncaNumber}`}
                      >
                        {verificationInProgress === `NCA-${contractor.ncaNumber}` ? 'Verifying...' : 'Re-verify Status'}
                      </Button>
                      <Button size="sm" variant="outline">
                        View Certificate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="eacc" className="space-y-6">
          <div className="grid gap-6">
            {eaccClearances.map((clearance, index) => (
              <Card key={index} className="shadow-lg border-l-4 border-l-orange-500">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">{clearance.contractorName}</h3>
                        <div className="text-sm text-gray-600">
                          Clearance Number: <span className="font-medium">{clearance.clearanceNumber}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge className={getStatusColor(clearance.status)}>
                          {clearance.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {clearance.validUntil !== 'Pending' && (
                          <div className="text-sm text-gray-600">
                            Valid until: {new Date(clearance.validUntil).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Risk Level</div>
                        <div className={`font-semibold ${getRiskColor(clearance.riskLevel)}`}>
                          {clearance.riskLevel}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Past Cases</div>
                        <div className="font-semibold">
                          {clearance.pastCases}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Compliance Score</div>
                        <div className="font-semibold text-blue-600">
                          {clearance.complianceScore}%
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-1">Status</div>
                        <div className="flex items-center space-x-1">
                          {clearance.status === 'cleared' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                          <span className="text-sm capitalize">
                            {clearance.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleVerification('EACC', clearance.clearanceNumber)}
                        disabled={verificationInProgress === `EACC-${clearance.clearanceNumber}`}
                      >
                        {verificationInProgress === `EACC-${clearance.clearanceNumber}` ? 'Checking...' : 'Check Status'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="citizen" className="space-y-6">
          <div className="grid gap-6">
            {citizenVerifications.map((project, index) => (
              <Card key={index} className="shadow-lg border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">{project.projectTitle}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div>Last verified: {new Date(project.lastVerified).toLocaleDateString()}</div>
                          <div>Average rating: {project.averageRating}/5.0</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {project.totalVerifications}
                        </div>
                        <div className="text-sm text-gray-600">Citizen Confirmations</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Verification Progress</span>
                          <span>{project.verificationPercentage}% of target reached</span>
                        </div>
                        <Progress value={Math.min(project.verificationPercentage, 100)} className="h-3" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Verification Methods</div>
                        <div className="space-y-1">
                          {project.verificationMethods.map((method) => (
                            <div key={method} className="flex items-center space-x-2 text-sm">
                              {method.includes('USSD') && <Smartphone className="h-3 w-3 text-green-600" />}
                              {method.includes('Photo') && <FileCheck className="h-3 w-3 text-blue-600" />}
                              {method.includes('Visit') && <Users className="h-3 w-3 text-purple-600" />}
                              <span>{method}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Quality Score</div>
                        <div className="text-2xl font-bold text-blue-600">{project.averageRating}/5</div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-500 uppercase mb-2">Issues Reported</div>
                        <div className={`text-2xl font-bold ${project.issues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {project.issues}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      {project.verificationPercentage >= 100 ? (
                        <Badge className="bg-green-100 text-green-800">Fully Verified</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          Needs {project.requiredVerifications - project.totalVerifications} more verifications
                        </Badge>
                      )}
                      
                      <div className="space-x-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Encourage Participation
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VerificationSystem;
