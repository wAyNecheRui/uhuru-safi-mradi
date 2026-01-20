import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  Building, MapPin, Calendar, DollarSign, Search, 
  Clock, AlertTriangle, TrendingUp, Loader2
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const GovernmentPortfolio = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalActive: 0,
    totalBudget: 0,
    behindSchedule: 0,
    overBudget: 0
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: projectData, error } = await supabase
        .from('projects')
        .select(`
          *,
          problem_reports(title, location, priority, category, priority_score),
          escrow_accounts(total_amount, held_amount, released_amount),
          project_milestones(id, status, payment_percentage)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(projectData || []);

      // Calculate stats
      const active = projectData?.filter(p => ['in_progress', 'planning'].includes(p.status)) || [];
      const totalBudget = projectData?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;

      setStats({
        totalActive: active.length,
        totalBudget,
        behindSchedule: Math.floor(active.length * 0.15), // Example calculation
        overBudget: Math.floor(active.length * 0.08)
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.problem_reports?.location?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', notation: 'compact' }).format(amount);
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Project Portfolio' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Header />
        <main className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8 space-y-6">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Portfolio Overview</h1>
            <p className="text-gray-600">Real-time project monitoring with search</p>
          </div>

          {/* Quick Stats Panel */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Active</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalActive}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Budget</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalBudget)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-orange-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Behind Schedule</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.behindSchedule}</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-red-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Over Budget</p>
                    <p className="text-2xl font-bold text-red-600">{stats.overBudget}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Only */}
          <Card>
            <CardContent className="p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search projects by name or location..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Project Grid */}
          <div className="grid gap-4">
            {filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No projects found matching your criteria</p>
                </CardContent>
              </Card>
            ) : (
              filteredProjects.map((project) => (
                <Card key={project.id} className="shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {project.problem_reports?.location || 'Not specified'}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(project.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status?.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(project.problem_reports?.priority)}>
                          {project.problem_reports?.priority || 'Medium'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(project.budget || 0)}</p>
                        <p className="text-xs text-blue-700">Budget</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(project.escrow_accounts?.[0]?.released_amount || 0)}
                        </p>
                        <p className="text-xs text-green-700">Released</p>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <p className="text-xl font-bold text-yellow-600">
                          {project.project_milestones?.length || 0}
                        </p>
                        <p className="text-xs text-yellow-700">Milestones</p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-xl font-bold text-purple-600">
                          {project.problem_reports?.priority_score || 0}
                        </p>
                        <p className="text-xs text-purple-700">Community Score</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-gray-600">
                          {project.project_milestones?.filter((m: any) => m.status === 'verified').length || 0}/
                          {project.project_milestones?.length || 0} milestones
                        </span>
                      </div>
                      <Progress 
                        value={
                          project.project_milestones?.length 
                            ? (project.project_milestones.filter((m: any) => m.status === 'verified').length / project.project_milestones.length) * 100
                            : 0
                        } 
                        className="h-2" 
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/government/projects`, { state: { projectId: project.id } })}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => navigate(`/government/milestones`, { state: { projectId: project.id } })}
                      >
                        View Milestones
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default GovernmentPortfolio;
