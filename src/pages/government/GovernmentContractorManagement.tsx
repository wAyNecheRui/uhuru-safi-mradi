import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Building, CheckCircle, XCircle, Star, 
  Clock, FileText, Award, TrendingUp,
  Loader2, Search, MapPin
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import ContractorProfileModal from '@/components/government/ContractorProfileModal';
import { isProjectEffectivelyCompleted } from '@/utils/progressCalculation';
import { fetchContractorRatingsFromVerifications } from '@/utils/contractorRatingCalculation';

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
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchContractorData();
  }, []);

  const fetchContractorData = async () => {
    try {
      // Fetch contractor profiles - government can view all via RLS
      const { data: contractorsData, error: contractorsError } = await supabase
        .from('contractor_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (contractorsError) {
        console.error('Contractors error:', contractorsError);
        throw contractorsError;
      }

      // Fetch pending credentials separately
      const { data: credentialsData, error: credentialsError } = await supabase
        .from('contractor_credentials')
        .select('*')
        .eq('verification_status', 'pending');

      if (credentialsError) {
        console.error('Credentials error:', credentialsError);
      }

      // Fetch REAL ratings from milestone verifications and quality checkpoints
      // (contractor_ratings table is empty - ratings come from citizen verifications)
      const realRatingsData = await fetchContractorRatingsFromVerifications();
      // Fetch actual project counts and contract values from projects table
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, contractor_id, budget, status')
        .not('contractor_id', 'is', null)
        .is('deleted_at', null);

      // Fetch milestones for all projects
      const projectIds = projectsData?.map(p => p.id) || [];
      const { data: milestonesData } = projectIds.length > 0 ? await supabase
        .from('project_milestones')
        .select('project_id, status')
        .in('project_id', projectIds) : { data: [] };

      // Group milestones by project
      const milestonesByProject: Record<string, {status: string}[]> = {};
      (milestonesData || []).forEach(m => {
        if (!milestonesByProject[m.project_id]) {
          milestonesByProject[m.project_id] = [];
        }
        milestonesByProject[m.project_id].push({ status: m.status });
      });

      // Fetch selected bids count
      const { data: bidsData } = await supabase
        .from('contractor_bids')
        .select('contractor_id, status')
        .eq('status', 'selected');

      // Build a map of contractor stats from real data
      const contractorStats: Record<string, { projectCount: number; totalValue: number; completedProjects: number }> = {};
      
      (projectsData || []).forEach(project => {
        if (!project.contractor_id) return;
        if (!contractorStats[project.contractor_id]) {
          contractorStats[project.contractor_id] = { projectCount: 0, totalValue: 0, completedProjects: 0 };
        }
        contractorStats[project.contractor_id].projectCount += 1;
        contractorStats[project.contractor_id].totalValue += Number(project.budget) || 0;
        
        // Use milestone-based completion detection
        if (isProjectEffectivelyCompleted(project.status, milestonesByProject[project.id] || [])) {
          contractorStats[project.contractor_id].completedProjects += 1;
        }
      });

      // Also count selected bids as potential projects
      (bidsData || []).forEach(bid => {
        if (!contractorStats[bid.contractor_id]) {
          contractorStats[bid.contractor_id] = { projectCount: 0, totalValue: 0, completedProjects: 0 };
        }
      });

      // Merge REAL ratings from verifications and real stats into contractors
      const contractorsWithRealData = (contractorsData || []).map(contractor => {
        const realRating = realRatingsData[contractor.user_id];
        const stats = contractorStats[contractor.user_id] || { projectCount: 0, totalValue: 0, completedProjects: 0 };
        
        return {
          ...contractor,
          // Use real ratings from milestone verifications & quality checkpoints
          real_average_rating: realRating?.averageRating || 0,
          real_rating_count: realRating?.totalRatings || 0,
          // Use real calculated values instead of stale profile fields
          actual_project_count: stats.projectCount,
          actual_contract_value: stats.totalValue,
          actual_completed_projects: stats.completedProjects
        };
      });

      setContractors(contractorsWithRealData);
      setCredentials(credentialsData || []);

      // Calculate AGPO stats
      const total = contractorsWithRealData.length || 1;
      const agpoContractors = contractorsWithRealData.filter(c => c.is_agpo);
      setAgpoStats({
        womenPercentage: Math.round((agpoContractors.filter(c => c.agpo_category === 'women').length / total) * 100),
        youthPercentage: Math.round((agpoContractors.filter(c => c.agpo_category === 'youth').length / total) * 100),
        pwdPercentage: Math.round((agpoContractors.filter(c => c.agpo_category === 'pwd').length / total) * 100),
        totalTarget: 30
      });
    } catch (error) {
      console.error('Error fetching contractor data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch contractor data. Please ensure you're logged in as a government user.",
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
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
              {/* Rating Explanation Card */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">How Contractor Ratings Work</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Contractor ratings come from <strong>citizen milestone verifications</strong>. When contractors complete project milestones, 
                        citizens verify the work quality and provide ratings (1-5 stars). These ratings are aggregated to show overall contractor performance.
                        <span className="block mt-2 text-blue-600 font-medium">
                          💡 Contractors with no ratings have not yet had any milestones verified by citizens.
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                          {contractor.registered_counties && contractor.registered_counties.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Service Areas: {contractor.registered_counties.slice(0, 3).join(', ')}
                              {contractor.registered_counties.length > 3 && ` +${contractor.registered_counties.length - 3} more`}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {contractor.verified ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" /> Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800" title="Contractor account awaiting credential verification by government officials">
                              <Clock className="h-3 w-3 mr-1" /> Awaiting Verification
                            </Badge>
                          )}
                          {contractor.is_agpo && (
                            <Badge className={`${
                              contractor.agpo_category === 'women' ? 'bg-pink-100 text-pink-800' :
                              contractor.agpo_category === 'youth' ? 'bg-blue-100 text-blue-800' :
                              contractor.agpo_category === 'pwd' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              <Award className="h-3 w-3 mr-1" />
                              AGPO {contractor.agpo_category ? `(${contractor.agpo_category.charAt(0).toUpperCase() + contractor.agpo_category.slice(1)})` : ''}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-center mb-1">
                            <Star className="h-5 w-5 text-yellow-500" />
                          </div>
                          <p className="text-xl font-bold text-blue-600">
                            {contractor.real_average_rating || 0}
                          </p>
                          <p className="text-xs text-blue-700">
                            {contractor.real_rating_count || 0} {contractor.real_rating_count === 1 ? 'verification' : 'verifications'}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-xl font-bold text-green-600">
                            {contractor.actual_project_count || 0}
                          </p>
                          <p className="text-xs text-green-700">Projects</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-xl font-bold text-purple-600">
                            {new Intl.NumberFormat('en-KE', { notation: 'compact' }).format(contractor.actual_contract_value || 0)}
                          </p>
                          <p className="text-xs text-purple-700">Contract Value</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-xl font-bold text-orange-600">
                            {new Intl.NumberFormat('en-KE', { notation: 'compact' }).format(contractor.max_project_capacity || 5000000)}
                          </p>
                          <p className="text-xs text-orange-700">Max Capacity</p>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <p className="text-xl font-bold text-indigo-600">
                            {contractor.is_agpo ? '+5' : '0'}
                          </p>
                          <p className="text-xs text-indigo-700">AGPO Bonus</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {contractor.specialization?.map((spec: string, i: number) => (
                          <Badge key={i} variant="outline">{spec}</Badge>
                        ))}
                        {(!contractor.specialization || contractor.specialization.length === 0) && (
                          <span className="text-sm text-gray-400 italic">No specializations listed</span>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedContractor(contractor);
                            setIsProfileModalOpen(true);
                          }}
                        >
                          View Full Profile
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
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <CheckCircle className="h-16 w-16 mx-auto text-primary/30 mb-4" />
                    <h3 className="text-lg font-semibold mb-1">All Caught Up</h3>
                    <p className="text-muted-foreground">No pending credential verifications at this time.</p>
                  </CardContent>
                </Card>
              ) : (
                credentials.map((credential) => (
                  <Card key={credential.id} className="shadow-lg border-l-4 border-l-yellow-500 overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{credential.credential_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {credential.credential_type} • {credential.issuing_authority}
                          </p>
                          {credential.credential_number && (
                            <p className="text-sm font-mono mt-1 text-muted-foreground">#{credential.credential_number}</p>
                          )}
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending Review
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div className="p-2 rounded bg-muted/30">
                          <span className="text-muted-foreground block text-xs">Issue Date</span>
                          <span className="font-medium">{credential.issue_date || 'N/A'}</span>
                        </div>
                        <div className="p-2 rounded bg-muted/30">
                          <span className="text-muted-foreground block text-xs">Expiry Date</span>
                          <span className="font-medium">{credential.expiry_date || 'N/A'}</span>
                        </div>
                      </div>

                      {credential.document_url && (
                        <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <a 
                            href={credential.document_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-2 font-medium text-sm"
                          >
                            <FileText className="h-4 w-4" />
                            View Uploaded Document
                          </a>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2 border-t">
                        <Button 
                          onClick={() => handleVerifyCredential(credential.id, 'verified')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Approve
                        </Button>
                        <Button 
                          onClick={() => handleVerifyCredential(credential.id, 'rejected')}
                          variant="outline"
                          size="sm"
                          className="border-destructive/50 text-destructive hover:bg-destructive/5"
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
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

          {/* Contractor Profile Modal */}
          <ContractorProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            contractor={selectedContractor}
            ratings={selectedContractor?.contractor_ratings || []}
            onVerificationComplete={fetchContractorData}
          />
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentContractorManagement;
