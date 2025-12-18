import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, FileText, CheckCircle, XCircle, AlertCircle,
  Download, Eye, Lock, Calendar, ExternalLink, Loader2,
  Link2, Database
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const GovernmentCompliance = () => {
  const [loading, setLoading] = useState(true);
  const [blockchainRecords, setBlockchainRecords] = useState<any[]>([]);
  const { toast } = useToast();

  const complianceChecklist = [
    {
      category: 'Public Procurement Act',
      items: [
        { id: 'ppa1', label: 'Open tendering for projects over KES 6M', status: 'compliant' },
        { id: 'ppa2', label: 'Procurement plan published quarterly', status: 'compliant' },
        { id: 'ppa3', label: 'Bid evaluation criteria documented', status: 'compliant' },
        { id: 'ppa4', label: 'Contract awards published within 14 days', status: 'pending' }
      ]
    },
    {
      category: 'Data Protection Act (Kenya)',
      items: [
        { id: 'dpa1', label: 'Personal data encryption enabled', status: 'compliant' },
        { id: 'dpa2', label: 'Consent mechanisms in place', status: 'compliant' },
        { id: 'dpa3', label: 'Data retention policies documented', status: 'pending' },
        { id: 'dpa4', label: 'Data breach notification procedures', status: 'compliant' }
      ]
    },
    {
      category: 'AGPO Requirements',
      items: [
        { id: 'agpo1', label: '30% allocation to women/youth/PWD', status: 'compliant' },
        { id: 'agpo2', label: 'AGPO contractor registration verified', status: 'compliant' },
        { id: 'agpo3', label: 'Preferential scoring applied', status: 'compliant' }
      ]
    },
    {
      category: 'EACC Guidelines',
      items: [
        { id: 'eacc1', label: 'Conflict of interest declarations', status: 'compliant' },
        { id: 'eacc2', label: 'Asset declarations for officials', status: 'pending' },
        { id: 'eacc3', label: 'Anti-corruption training completed', status: 'compliant' },
        { id: 'eacc4', label: 'Whistleblower protection enabled', status: 'compliant' }
      ]
    }
  ];

  useEffect(() => {
    fetchBlockchainRecords();
  }, []);

  const fetchBlockchainRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('blockchain_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setBlockchainRecords(data || []);
    } catch (error) {
      console.error('Error fetching blockchain records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCompliancePercentage = () => {
    const allItems = complianceChecklist.flatMap(c => c.items);
    const compliant = allItems.filter(i => i.status === 'compliant').length;
    return Math.round((compliant / allItems.length) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'non_compliant':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Transparency & Compliance' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Header selectedCounty="Nairobi" onCountyChange={() => {}} />
        <main className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header selectedCounty="Nairobi" onCountyChange={() => {}} />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8 space-y-6">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Transparency & Compliance</h1>
              <p className="text-gray-600">Public accountability portal and policy monitoring</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview Public View
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          {/* Compliance Overview */}
          <Card className="border-t-4 border-t-green-600">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-full">
                    <Shield className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{getCompliancePercentage()}% Compliant</h2>
                    <p className="text-gray-600">Overall regulatory compliance score</p>
                  </div>
                </div>
                <Progress value={getCompliancePercentage()} className="w-48 h-3" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="checklist" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checklist">Compliance Checklist</TabsTrigger>
              <TabsTrigger value="blockchain">Blockchain Audit Trail</TabsTrigger>
              <TabsTrigger value="reports">Automated Reports</TabsTrigger>
            </TabsList>

            {/* Compliance Checklist */}
            <TabsContent value="checklist" className="space-y-6">
              {complianceChecklist.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {category.items.map((item) => (
                        <div 
                          key={item.id} 
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            item.status === 'compliant' ? 'bg-green-50' :
                            item.status === 'pending' ? 'bg-yellow-50' : 'bg-red-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(item.status)}
                            <span className="text-sm">{item.label}</span>
                          </div>
                          <Badge className={
                            item.status === 'compliant' ? 'bg-green-100 text-green-800' :
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {item.status === 'compliant' ? 'Compliant' :
                             item.status === 'pending' ? 'Pending' : 'Non-Compliant'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Blockchain Audit Trail */}
            <TabsContent value="blockchain" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    Blockchain Verification Records
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {blockchainRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <Database className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No blockchain records available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {blockchainRecords.map((record) => (
                        <div key={record.id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                            <div>
                              <p className="font-mono text-sm text-gray-600">
                                TX: {record.transaction_hash?.slice(0, 20)}...
                              </p>
                              <p className="text-sm text-gray-500">
                                Block #{record.block_number}
                              </p>
                            </div>
                            <Badge className={
                              record.network_status === 'confirmed' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }>
                              {record.network_status}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">
                              Amount: KES {record.amount?.toLocaleString()}
                            </span>
                            <span className="text-gray-500">
                              {new Date(record.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Automated Reports */}
            <TabsContent value="reports" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Calendar className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Monthly Performance</h3>
                        <p className="text-sm text-gray-500">Auto-generated</p>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <Shield className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Quarterly Compliance</h3>
                        <p className="text-sm text-gray-500">Auto-generated</p>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <FileText className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Annual Impact</h3>
                        <p className="text-sm text-gray-500">Auto-generated</p>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Open Data Portal Export</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Export data for publication on the Kenya Open Data Portal
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      Export as CSV
                    </Button>
                    <Button variant="outline">
                      Export as JSON
                    </Button>
                    <Button>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Push to Open Data
                    </Button>
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

export default GovernmentCompliance;
