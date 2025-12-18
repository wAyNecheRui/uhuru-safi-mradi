import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Building, CheckCircle, XCircle, AlertCircle, Star, 
  Clock, FileText, Shield, Award, Users, TrendingUp,
  Loader2, Search, Filter
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

const GovernmentContractorManagement = () => {
  const [contractors, setContractors] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [agpoStats, setAgpoStats] = useState({
    womenPercentage: 0,
    youthPercentage: 0,
    pwdPercentage: 0,
    totalTarget: 30
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchContractorData();
  }, []);

  const fetchContractorData = async () => {
    try {
      const [contractorsRes, credentialsRes] = await Promise.all([
        supabase
          .from('contractor_profiles')
          .select(`
            *,
            contractor_ratings(rating, work_quality, completion_timeliness),
            contractor_credentials(*)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('contractor_credentials')
          .select('*')
          .eq('verification_status', 'pending')
      ]);

      if (contractorsRes.error) throw contractorsRes.error;
      if (credentialsRes.error) throw credentialsRes.error;

      setContractors(contractorsRes.data || []);
      setCredentials(credentialsRes.data || []);

      // Calculate AGPO stats (example calculations)
      const total = contractorsRes.data?.length || 1;
      setAgpoStats({
        womenPercentage: Math.round((total * 0.22) / total * 100),
        youthPercentage: Math.round((total * 0.15) / total * 100),
        pwdPercentage: Math.round((total * 0.05) / total * 100),
        totalTarget: 30
      });
    } catch (error) {
      console.error('Error fetching contractor data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contractor data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCredential = async (credentialId: string, status: 'verified' | 'rejected') => {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('contractor_credentials')
        .update({
          verification_status: status,
          verified_at: new Date().toISOString(),
          verified_by: userData.user?.id
        })
        .eq('id', credentialId);

      if (error) throw error;

      toast({
        title: status === 'verified' ? "Credential Verified" : "Credential Rejected",
        description: `The credential has been ${status}`
      });

      fetchContractorData();
    } catch (error) {
      console.error('Error verifying credential:', error);
      toast({
        title: "Error",
        description: "Failed to update credential",
        variant: "destructive"
      });
    }
  };

  const getAverageRating = (ratings: any[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / ratings.length).toFixed(1);
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Contractor Management' }
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
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contractor Management</h1>
            <p className="text-gray-600">Evaluate contractors, verify credentials, and monitor AGPO compliance</p>
          </div>

          <Tabs defaultValue="evaluation" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="evaluation">Contractor Evaluation</TabsTrigger>
              <TabsTrigger value="verification">
                Pending Verification ({credentials.length})
              </TabsTrigger>
              <TabsTrigger value="agpo">AGPO Compliance</TabsTrigger>
            </TabsList>

            {/* Contractor Evaluation Tab */}
            <TabsContent value="evaluation" className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Search contractors..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid gap-4">
                {contractors.filter(c => 
                  c.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((contractor) => (
                  <Card key={contractor.id} className="shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-xl font-semibold">{contractor.company_name}</h3>
                          <p className="text-sm text-gray-500">
                            {contractor.years_in_business} years in business • {contractor.number_of_employees || 0} employees
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {contractor.verified ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" /> Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" /> Pending
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <Star className="h-5 w-5 text-yellow-500" />
                          </div>
                          <p className="text-xl font-bold text-blue-600">
                            {getAverageRating(contractor.contractor_ratings)}
                          </p>
                          <p className="text-xs text-blue-700">Average Rating</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-xl font-bold text-green-600">
                            {contractor.previous_projects_count || 0}
                          </p>
                          <p className="text-xs text-green-700">Projects Completed</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-xl font-bold text-purple-600">
                            {new Intl.NumberFormat('en-KE', { notation: 'compact' }).format(contractor.total_contract_value || 0)}
                          </p>
                          <p className="text-xs text-purple-700">Total Contract Value</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-xl font-bold text-orange-600">
                            {contractor.contractor_credentials?.filter((c: any) => c.verification_status === 'verified').length || 0}
                          </p>
                          <p className="text-xs text-orange-700">Verified Credentials</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {contractor.specialization?.map((spec: string, i: number) => (
                          <Badge key={i} variant="outline">{spec}</Badge>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                        <Button size="sm">
                          Performance Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Pending Verification Tab */}
            <TabsContent value="verification" className="space-y-6">
              {credentials.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-gray-600">No pending credential verifications</p>
                  </CardContent>
                </Card>
              ) : (
                credentials.map((credential) => (
                  <Card key={credential.id} className="shadow-lg border-l-4 border-l-yellow-500">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{credential.credential_name}</h3>
                          <p className="text-sm text-gray-500">
                            {credential.credential_type} • {credential.issuing_authority}
                          </p>
                          {credential.credential_number && (
                            <p className="text-sm font-mono mt-1">#{credential.credential_number}</p>
                          )}
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-gray-600">Issue Date:</span>
                          <span className="ml-2">{credential.issue_date || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Expiry Date:</span>
                          <span className="ml-2">{credential.expiry_date || 'N/A'}</span>
                        </div>
                      </div>

                      {credential.document_url && (
                        <div className="mb-4">
                          <a 
                            href={credential.document_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            View Document
                          </a>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleVerifyCredential(credential.id, 'verified')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Verify
                        </Button>
                        <Button 
                          onClick={() => handleVerifyCredential(credential.id, 'rejected')}
                          variant="outline"
                          className="border-red-500 text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* AGPO Compliance Tab */}
            <TabsContent value="agpo" className="space-y-6">
              <Card className="border-t-4 border-t-green-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    AGPO Compliance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Women Contractors</span>
                        <span className="text-sm text-gray-600">{agpoStats.womenPercentage}%</span>
                      </div>
                      <Progress value={agpoStats.womenPercentage} className="h-3" />
                      <p className="text-xs text-gray-500">Target: 30%</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Youth Contractors</span>
                        <span className="text-sm text-gray-600">{agpoStats.youthPercentage}%</span>
                      </div>
                      <Progress value={agpoStats.youthPercentage} className="h-3" />
                      <p className="text-xs text-gray-500">Target: 30%</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">PWD Contractors</span>
                        <span className="text-sm text-gray-600">{agpoStats.pwdPercentage}%</span>
                      </div>
                      <Progress value={agpoStats.pwdPercentage} className="h-3" />
                      <p className="text-xs text-gray-500">Target: 30%</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      AGPO Bonus Points System
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Women-owned: +5 points in bid evaluation
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Youth-owned: +5 points in bid evaluation
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        PWD-owned: +5 points in bid evaluation
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Local contractor preference: +3 points
                      </li>
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <Button>
                      Generate AGPO Report
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

export default GovernmentContractorManagement;
