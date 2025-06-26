
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Star, Upload, CheckCircle, AlertTriangle, FileText, Award, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ContractorVerificationSystem = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { toast } = useToast();

  const verificationData = {
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-600" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <Input value={verificationData.companyName} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN</label>
                  <Input value={verificationData.kraPin} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <Input value={verificationData.registrationNumber} readOnly />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
                  <Textarea value={verificationData.physicalAddress} readOnly />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Years in Business:</span>
                  <span className="font-semibold">{verificationData.yearsInBusiness} years</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-green-600" />
                  Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Overall Status:</span>
                  <Badge className={getStatusColor(verificationData.verificationStatus)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {verificationData.verificationStatus.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{verificationData.totalProjects}</div>
                    <div className="text-sm text-gray-600">Total Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{verificationData.completedProjects}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Overall Rating:</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="ml-1 font-semibold">{verificationData.overallRating}/5.0</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Specializations:</h4>
                  <div className="flex flex-wrap gap-2">
                    {verificationData.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Professional Certifications
              </CardTitle>
              <p className="text-sm text-gray-600">
                Maintain up-to-date certifications to remain eligible for government contracts.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {verificationData.certifications.map((cert, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{cert.name}</h4>
                        <p className="text-sm text-gray-600">Expires: {cert.expiryDate}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getStatusColor(cert.status)}>
                          {cert.status === 'verified' ? (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 mr-1" />
                          )}
                          {cert.status.toUpperCase()}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentUpload(cert.name)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Upload New Certification</h4>
                <div className="flex items-center space-x-3">
                  <Input placeholder="Certification name" className="flex-1" />
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          <div className="grid gap-6">
            {verificationData.recentProjects.map((project) => (
              <Card key={project.id} className="shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Project Value: </span>
                          <span className="font-semibold text-green-600">{formatAmount(project.value)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status: </span>
                          <Badge className={project.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                            {project.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        {project.status === 'completed' && (
                          <>
                            <div>
                              <span className="text-gray-600">Completion Date: </span>
                              <span className="font-medium">{project.completionDate}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Client Rating: </span>
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                                <span className="font-semibold">{project.rating}/5.0</span>
                              </div>
                            </div>
                          </>
                        )}
                        {project.status === 'in_progress' && (
                          <>
                            <div>
                              <span className="text-gray-600">Progress: </span>
                              <span className="font-semibold">{project.progress}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Expected Completion: </span>
                              <span className="font-medium">{project.expectedCompletion}</span>
                            </div>
                          </>
                        )}
                      </div>
                      {project.clientFeedback && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 italic">"{project.clientFeedback}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">98%</div>
                <div className="text-sm text-gray-600">On-Time Completion</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">4.6</div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">94%</div>
                <div className="text-sm text-gray-600">Quality Score</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractorVerificationSystem;
