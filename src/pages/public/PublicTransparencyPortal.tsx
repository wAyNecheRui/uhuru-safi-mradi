import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegionalDevelopmentStats from "@/components/cycles/RegionalDevelopmentStats";
import { 
  Loader2, Search, Building2, MapPin, Calendar, Wallet, 
  Users, TrendingUp, Eye, ExternalLink, Shield, Clock,
  CheckCircle2, XCircle, AlertCircle, ArrowLeft, Home, BarChart3, Globe, Star
} from "lucide-react";
import ContractorBanner from '@/components/contractor/ContractorBanner';
import ProjectCategoryCarousel from '@/components/citizen/ProjectCategoryCarousel';
import { format } from "date-fns";
import { isProjectEffectivelyCompleted, getEffectiveProjectStatus } from "@/utils/progressCalculation";
import { fetchContractorRatingsFromVerifications } from "@/utils/contractorRatingCalculation";

interface Project {
  id: string;
  title: string;
  description: string;
  budget: number | null;
  status: string;
  created_at: string;
  contractor_id?: string;
  report?: {
    location: string;
    category: string;
    priority: string;
    photo_urls?: string[];
  };
  escrow?: {
    total_amount: number;
    held_amount: number;
    released_amount: number;
  };
  milestones_count?: number;
  completed_milestones?: number;
  contractor?: {
    company_name: string;
    average_rating: number;
  };
}

interface Stats {
  totalProjects: number;
  totalBudget: number;
  completedProjects: number;
  activeContractors: number;
  totalReleased: number;
  averageCompletion: number;
}

export default function PublicTransparencyPortal() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [blockchainRecords, setBlockchainRecords] = useState<any[]>([]);
  const [contractorRatings, setContractorRatings] = useState<Record<string, { averageRating: number; totalRatings: number }>>({});

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    try {
      // Fetch all projects (public data)
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Enrich with related data
      const enrichedProjects = await Promise.all(
        (projectsData || []).map(async (project) => {
          // Get report details
          let report = null;
          if (project.report_id) {
            const { data } = await supabase
              .from('problem_reports')
              .select('location, category, priority, photo_urls')
              .eq('id', project.report_id)
              .maybeSingle();
            report = data;
          }

          // Get escrow
          const { data: escrow } = await supabase
            .from('escrow_accounts')
            .select('total_amount, held_amount, released_amount')
            .eq('project_id', project.id)
            .maybeSingle();

          // Get milestones
          const { data: milestones } = await supabase
            .from('project_milestones')
            .select('id, status')
            .eq('project_id', project.id);

          // Get contractor basic info (NOT using stale average_rating)
          let contractor = null;
          if (project.contractor_id) {
            const { data } = await supabase
              .from('contractor_profiles')
              .select('company_name')
              .eq('user_id', project.contractor_id)
              .maybeSingle();
            contractor = data ? { ...data, average_rating: 0 } : null;
          }

          // Format milestones for the utility function
          const formattedMilestones = (milestones || []).map(m => ({ status: m.status }));
          const effectiveStatus = getEffectiveProjectStatus(project.status, formattedMilestones);
          
          return {
            ...project,
            status: effectiveStatus, // Use effective status based on milestones
            report,
            escrow,
            contractor,
            milestones_count: milestones?.length || 0,
            completed_milestones: milestones?.filter(m => 
              m.status === 'paid' || m.status === 'completed' || m.status === 'verified'
            ).length || 0
          };
        })
      );

      // Fetch REAL contractor ratings from milestone verifications
      const realRatings = await fetchContractorRatingsFromVerifications();
      setContractorRatings(realRatings);

      // Calculate stats - now uses milestone-based completion detection
      const totalBudget = enrichedProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const totalReleased = enrichedProjects.reduce((sum, p) => sum + (p.escrow?.released_amount || 0), 0);
      
      // Count projects that are effectively completed (all milestones done OR status = completed)
      const completedProjects = enrichedProjects.filter(p => p.status === 'completed').length;
      const activeContractors = new Set(enrichedProjects.filter(p => p.contractor_id).map(p => p.contractor_id)).size;

      // Calculate average completion based on milestone progress
      const projectsWithMilestones = enrichedProjects.filter(p => p.milestones_count! > 0);
      const averageCompletion = projectsWithMilestones.length > 0 
        ? projectsWithMilestones.reduce((sum, p) => {
            return sum + (p.completed_milestones! / p.milestones_count!) * 100;
          }, 0) / projectsWithMilestones.length
        : 0;

      setStats({
        totalProjects: enrichedProjects.length,
        totalBudget,
        completedProjects,
        activeContractors,
        totalReleased,
        averageCompletion
      });

      // Fetch blockchain records
      const { data: blockchain } = await supabase
        .from('blockchain_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setBlockchainRecords(blockchain || []);
      setProjects(enrichedProjects);
    } catch (error) {
      console.error("Failed to fetch public data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'planning': return 'bg-yellow-500';
      case 'bidding': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.report?.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading transparency data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <div className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-10 w-10" />
            <h1 className="text-4xl font-bold">Public Transparency Portal</h1>
          </div>
          <p className="text-lg opacity-90 max-w-2xl">
            Track government infrastructure projects, fund allocation, and contractor performance. 
            All data is public and verified on the blockchain.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary" className="bg-white/20">
              <Globe className="h-3 w-3 mr-1" />
              Accountability & Transparency Cycle
            </Badge>
            <Badge variant="secondary" className="bg-white/20">
              <BarChart3 className="h-3 w-3 mr-1" />
              Community Impact Measurement
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Building2 className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
                <p className="text-xs text-muted-foreground">Total Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Wallet className="h-6 w-6 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</p>
                <p className="text-xs text-muted-foreground">Total Budget</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-6 w-6 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{stats.completedProjects}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{stats.activeContractors}</p>
                <p className="text-xs text-muted-foreground">Contractors</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(stats.totalReleased)}</p>
                <p className="text-xs text-muted-foreground">Funds Released</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold">{stats.averageCompletion.toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Avg Completion</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search projects by name, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs defaultValue="projects">
          <TabsList className="mb-6">
            <TabsTrigger value="projects">Projects ({filteredProjects.length})</TabsTrigger>
            <TabsTrigger value="regional">Regional Impact</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain Records ({blockchainRecords.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            {/* Category Carousel View */}
            {filteredProjects.length > 0 && (
              <div className="mb-6">
                <ProjectCategoryCarousel
                  projects={filteredProjects.map(p => ({
                    id: p.id,
                    title: p.title,
                    description: p.description,
                    status: p.status,
                    budget: p.budget || 0,
                    contractor_id: p.contractor_id || null,
                    category: p.report?.category || null,
                    progress: p.milestones_count ? Math.round((p.completed_milestones! / p.milestones_count) * 100) : 0,
                    photo_url: p.report?.photo_urls?.[0] || null,
                  }))}
                  onSelectProject={(projectId) => {
                    const proj = filteredProjects.find(p => p.id === projectId);
                    if (proj) setSelectedProject(proj);
                  }}
                />
              </div>
            )}

            <div className="grid gap-4">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow overflow-hidden">
                  {/* Hero Photo */}
                  {project.report?.photo_urls?.[0] && (
                    <div className="w-full h-[200px] sm:h-[240px] overflow-hidden">
                      <img 
                        src={project.report.photo_urls[0]} 
                        alt={project.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <ContractorBanner contractorId={project.contractor_id || null} />
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
                          <h3 className="font-semibold text-lg">{project.title}</h3>
                          <Badge variant="outline">{project.status}</Badge>
                        </div>
                        
                        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                          {project.description}
                        </p>

                        <div className="flex flex-wrap gap-4 text-sm">
                          {project.report?.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {project.report.location}
                            </span>
                          )}
                          {project.report?.category && (
                            <Badge variant="secondary">{project.report.category}</Badge>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(project.created_at), 'PP')}
                          </span>
                        </div>
                      </div>

                      <div className="w-full lg:w-64 space-y-3">
                        {project.budget && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Budget</span>
                              <span className="font-semibold">{formatCurrency(project.budget)}</span>
                            </div>
                          </div>
                        )}
                        
                        {project.escrow && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Released</span>
                              <span className="text-green-600">
                                {formatCurrency(project.escrow.released_amount)}
                              </span>
                            </div>
                            <Progress 
                              value={(project.escrow.released_amount / project.escrow.total_amount) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}

                        {project.milestones_count! > 0 && (
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{project.completed_milestones}/{project.milestones_count} milestones</span>
                            </div>
                            <Progress 
                              value={(project.completed_milestones! / project.milestones_count!) * 100} 
                              className="h-2"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredProjects.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No projects found matching your search</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="regional">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Regional Development Statistics
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Community impact measurements showing regional development from infrastructure projects.
                </p>
              </CardHeader>
            </Card>
            <RegionalDevelopmentStats />
          </TabsContent>

          <TabsContent value="blockchain">
            <div className="space-y-3">
              {blockchainRecords.map((record) => (
                <Card key={record.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-mono text-sm truncate max-w-xs">
                            {record.transaction_hash}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Block #{record.block_number} • {format(new Date(record.created_at), 'PPpp')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(record.amount)}</p>
                        <Badge variant={record.network_status === 'confirmed' ? 'default' : 'secondary'}>
                          {record.network_status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {blockchainRecords.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No blockchain records yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="bg-muted py-8 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground">
            Government Project Transparency & Accountability System
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            All transactions are recorded and verified for public transparency
          </p>
        </div>
      </div>
    </div>
  );
}
