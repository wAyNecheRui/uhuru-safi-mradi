import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, CheckCircle, AlertTriangle, Clock, FileText, 
  ClipboardCheck, AlertCircle, RefreshCw, Loader2, Building2
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface QualityCheckpoint {
  id: string;
  projectName: string;
  checkpointName: string;
  inspectionDate: string;
  inspectorType: string;
  passed: boolean | null;
  score: number | null;
  findings: string | null;
  correctiveActions: string | null;
}

interface ComplianceItem {
  id: string;
  name: string;
  category: string;
  status: 'compliant' | 'pending' | 'expired' | 'non-compliant';
  expiryDate?: string;
  lastChecked: string;
}

const ContractorQuality = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checkpoints, setCheckpoints] = useState<QualityCheckpoint[]>([]);
  const [defects, setDefects] = useState<any[]>([]);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'Quality & Compliance' }
  ];

  // Quality standards for different project types
  const qualityStandards = {
    roads: [
      { id: 'r1', name: 'KeNHA Road Standards Compliance', checked: true },
      { id: 'r2', name: 'Proper Base Course Installation', checked: true },
      { id: 'r3', name: 'Drainage System Implementation', checked: false },
      { id: 'r4', name: 'Road Marking & Signage', checked: false },
      { id: 'r5', name: 'Traffic Management Plan', checked: true },
    ],
    buildings: [
      { id: 'b1', name: 'NCA Building Code Compliance', checked: true },
      { id: 'b2', name: 'Structural Integrity Certification', checked: true },
      { id: 'b3', name: 'Fire Safety Systems', checked: false },
      { id: 'b4', name: 'Electrical Installation Standards', checked: true },
      { id: 'b5', name: 'Plumbing & Water Systems', checked: false },
    ],
    water: [
      { id: 'w1', name: 'WASREB Water Standards', checked: true },
      { id: 'w2', name: 'Pipeline Pressure Testing', checked: true },
      { id: 'w3', name: 'Water Quality Certification', checked: true },
      { id: 'w4', name: 'Connection Point Standards', checked: false },
      { id: 'w5', name: 'Meter Installation Compliance', checked: false },
    ]
  };

  useEffect(() => {
    if (user) {
      fetchQualityData();
    }
  }, [user]);

  const fetchQualityData = async () => {
    try {
      setLoading(true);
      
      // Fetch quality checkpoints
      const { data: qualityData } = await supabase
        .from('quality_checkpoints')
        .select(`
          id, checkpoint_name, inspection_date, inspector_type, passed, score, findings, corrective_actions,
          projects(title)
        `)
        .order('inspection_date', { ascending: false })
        .limit(10);

      const formattedCheckpoints: QualityCheckpoint[] = qualityData?.map(q => ({
        id: q.id,
        projectName: q.projects?.title || 'Unknown Project',
        checkpointName: q.checkpoint_name,
        inspectionDate: q.inspection_date,
        inspectorType: q.inspector_type,
        passed: q.passed,
        score: q.score,
        findings: q.findings,
        correctiveActions: q.corrective_actions
      })) || [];

      // Generate compliance items (would be fetched from DB in production)
      const compliance: ComplianceItem[] = [
        { id: '1', name: 'NCA License', category: 'Licensing', status: 'compliant', expiryDate: '2025-12-31', lastChecked: new Date().toISOString() },
        { id: '2', name: 'KRA Tax Compliance', category: 'Tax', status: 'compliant', expiryDate: '2025-06-30', lastChecked: new Date().toISOString() },
        { id: '3', name: 'AGPO Registration', category: 'Certification', status: 'compliant', lastChecked: new Date().toISOString() },
        { id: '4', name: 'Public Liability Insurance', category: 'Insurance', status: 'pending', expiryDate: '2025-02-28', lastChecked: new Date().toISOString() },
        { id: '5', name: 'EACC Clearance', category: 'Compliance', status: 'compliant', lastChecked: new Date().toISOString() },
        { id: '6', name: 'Safety Training Certificate', category: 'Safety', status: 'compliant', expiryDate: '2025-08-15', lastChecked: new Date().toISOString() },
      ];

      setCheckpoints(formattedCheckpoints);
      setComplianceItems(compliance);

    } catch (error) {
      console.error('Error fetching quality data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': case 'non-compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPassedColor = (passed: boolean | null) => {
    if (passed === null) return 'bg-gray-100 text-gray-800';
    return passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Header selectedCounty="Nairobi" onCountyChange={() => {}} />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading quality data...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Header selectedCounty="Nairobi" onCountyChange={() => {}} />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Quality & Compliance</h1>
            <p className="text-gray-600">Maintain quality standards and regulatory compliance for all projects.</p>
          </div>

          {/* Compliance Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-lg border-l-4 border-l-green-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Compliant Items</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {complianceItems.filter(c => c.status === 'compliant').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-l-4 border-l-yellow-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Review</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {complianceItems.filter(c => c.status === 'pending').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-l-4 border-l-blue-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Quality Score</p>
                    <p className="text-2xl font-bold text-gray-900">92%</p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-l-4 border-l-red-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open Defects</p>
                    <p className="text-2xl font-bold text-gray-900">{defects.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="standards" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg">
              <TabsTrigger value="standards" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Quality Standards
              </TabsTrigger>
              <TabsTrigger value="inspections" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Inspections
              </TabsTrigger>
              <TabsTrigger value="compliance" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                Regulatory Compliance
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                Audit Trail
              </TabsTrigger>
            </TabsList>

            <TabsContent value="standards" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(qualityStandards).map(([category, items]) => (
                  <Card key={category} className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center capitalize">
                        <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                        {category === 'roads' ? 'Road Construction' : category === 'buildings' ? 'Building Construction' : 'Water Projects'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-3">
                            <Checkbox id={item.id} checked={item.checked} />
                            <label htmlFor={item.id} className="text-sm cursor-pointer">
                              {item.name}
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Compliance</span>
                          <span className="font-bold">{Math.round((items.filter(i => i.checked).length / items.length) * 100)}%</span>
                        </div>
                        <Progress value={(items.filter(i => i.checked).length / items.length) * 100} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="inspections" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClipboardCheck className="h-5 w-5 mr-2 text-green-600" />
                    Quality Inspections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {checkpoints.length === 0 ? (
                    <div className="text-center py-8">
                      <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No quality inspections recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {checkpoints.map((checkpoint) => (
                        <div key={checkpoint.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{checkpoint.checkpointName}</h4>
                              <p className="text-sm text-gray-500">{checkpoint.projectName}</p>
                            </div>
                            <Badge className={getPassedColor(checkpoint.passed)}>
                              {checkpoint.passed === null ? 'Pending' : checkpoint.passed ? 'Passed' : 'Failed'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Inspector:</span>
                              <p className="font-medium">{checkpoint.inspectorType}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <p className="font-medium">{new Date(checkpoint.inspectionDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Score:</span>
                              <p className="font-medium">{checkpoint.score || 'N/A'}%</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Status:</span>
                              <p className="font-medium">{checkpoint.findings ? 'Has Findings' : 'Clear'}</p>
                            </div>
                          </div>
                          {checkpoint.findings && (
                            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                              <p className="text-sm text-yellow-800"><strong>Findings:</strong> {checkpoint.findings}</p>
                            </div>
                          )}
                          {checkpoint.correctiveActions && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800"><strong>Corrective Actions:</strong> {checkpoint.correctiveActions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-purple-600" />
                    Regulatory Compliance Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          {item.status === 'compliant' ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : item.status === 'pending' ? (
                            <Clock className="h-6 w-6 text-yellow-600" />
                          ) : (
                            <AlertCircle className="h-6 w-6 text-red-600" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {item.expiryDate && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Expires</p>
                              <p className="text-sm font-medium">{new Date(item.expiryDate).toLocaleDateString()}</p>
                            </div>
                          )}
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-orange-600" />
                    Audit Trail
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4 py-2">
                      <p className="font-medium text-gray-900">Quality Inspection Passed</p>
                      <p className="text-sm text-gray-500">Road construction checkpoint - Phase 2</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleString()}</p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-medium text-gray-900">Document Uploaded</p>
                      <p className="text-sm text-gray-500">NCA License renewal certificate</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(Date.now() - 86400000).toLocaleString()}</p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4 py-2">
                      <p className="font-medium text-gray-900">Compliance Review Initiated</p>
                      <p className="text-sm text-gray-500">Annual safety compliance check</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(Date.now() - 172800000).toLocaleString()}</p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                      <p className="font-medium text-gray-900">AGPO Report Submitted</p>
                      <p className="text-sm text-gray-500">Quarterly women/youth employment report</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(Date.now() - 259200000).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ContractorQuality;
