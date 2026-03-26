import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Search, MapPin, Wallet, ArrowLeft, ImageOff, Building, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import logoImg from '@/assets/uhuru-safi-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { CATEGORIES } from '@/constants/problemReporting';

const PublicProjects = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['public-projects-showcase'],
    queryFn: async () => {
      const { data: projectsData, error } = await supabase
        .from('projects')
        .select('id, title, description, status, budget, contractor_id, created_at, report_id')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reportIds = projectsData?.map(p => p.report_id).filter(Boolean) as string[];
      let reportsMap: Record<string, any> = {};
      if (reportIds.length > 0) {
        const { data: reports } = await supabase
          .from('problem_reports')
          .select('id, photo_urls, category, location, constituency')
          .in('id', reportIds);
        reports?.forEach(r => { reportsMap[r.id] = r; });
      }

      const contractorIds = projectsData?.map(p => p.contractor_id).filter(Boolean) as string[];
      let contractorsMap: Record<string, any> = {};
      if (contractorIds.length > 0) {
        const { data: contractors } = await supabase
          .from('contractor_profiles_public')
          .select('user_id, company_name')
          .in('user_id', contractorIds);
        contractors?.forEach(c => { contractorsMap[c.user_id] = c; });
      }

      return (projectsData || []).map(p => {
        const report = p.report_id ? reportsMap[p.report_id] : null;
        const contractor = p.contractor_id ? contractorsMap[p.contractor_id] : null;
        return {
          ...p,
          photo_url: report?.photo_urls?.[0] || null,
          category: report?.category || null,
          location: report?.location || report?.constituency || null,
          contractor_name: contractor?.company_name || null,
        };
      });
    }
  });

  const getCategoryMeta = (val: string | null) => {
    const found = CATEGORIES.find(c => c.value === val);
    return found || { value: val || 'other', label: val || 'Other', icon: '🏗️' };
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by category
  const grouped = filteredProjects.reduce<Record<string, typeof filteredProjects>>((acc, p) => {
    const key = p.category || 'other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const sortedCategories = Object.entries(grouped).sort(([, a], [, b]) => b.length - a.length);

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'in_progress').length,
    completed: projects.filter(p => p.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(199,89%,12%)] via-[hsl(199,70%,18%)] to-[hsl(199,50%,22%)]">
      {/* Nav */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <ResponsiveContainer>
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Uhuru Safi" className="w-8 h-8 object-contain" />
              <span className="text-white font-bold text-lg">Uhuru Safi</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={() => navigate('/')}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </div>
          </div>
        </ResponsiveContainer>
      </nav>

      <main>
        {/* Hero */}
        <ResponsiveContainer className="pt-10 pb-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Public Projects
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore infrastructure projects across Kenya. See what's being built, who's building it, and how public funds are being utilized transparently.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Projects', value: stats.total, icon: Building, color: 'text-blue-400' },
              { label: 'Active', value: stats.active, icon: TrendingUp, color: 'text-amber-400' },
              { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-400' },
            ].map((s, i) => (
              <div key={i} className="bg-white/[0.07] rounded-xl p-4 text-center border border-white/10">
                <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search projects by name, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
            />
          </div>
        </ResponsiveContainer>

        {/* Projects by Category */}
        <ResponsiveContainer className="pb-12">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-400 border-t-transparent mx-auto mb-3"></div>
              <p className="text-slate-400">Loading projects...</p>
            </div>
          ) : sortedCategories.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 font-medium">No projects found</p>
              <p className="text-slate-500 text-sm">Try adjusting your search</p>
            </div>
          ) : (
            sortedCategories.map(([categoryKey, categoryProjects]) => {
              const cat = getCategoryMeta(categoryKey);
              return (
                <div key={categoryKey} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{cat.icon}</span>
                    <h2 className="text-lg font-bold text-white">{cat.label}</h2>
                    <Badge className="bg-white/10 text-white/70 text-xs">{categoryProjects.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryProjects.map((project) => (
                      <Card key={project.id} className="bg-white/[0.07] border-white/10 hover:bg-white/[0.12] transition-all overflow-hidden group cursor-pointer" onClick={() => navigate('/auth')}>
                        {/* Hero Photo */}
                        {project.photo_url ? (
                          <div className="w-full h-[160px] overflow-hidden bg-white/5">
                            <img src={project.photo_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                          </div>
                        ) : (
                          <div className="w-full h-[100px] bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
                            <ImageOff className="h-8 w-8 text-white/20" />
                          </div>
                        )}

                        <CardContent className="p-4">
                          {/* Contractor */}
                          {project.contractor_name && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center">
                                <Building className="w-3 h-3 text-amber-400" />
                              </div>
                              <span className="text-xs text-amber-400 font-medium truncate">{project.contractor_name}</span>
                            </div>
                          )}

                          <h3 className="font-semibold text-sm text-white line-clamp-2 mb-2 min-h-[2.5rem]">{project.title}</h3>
                          
                          {project.location && (
                            <div className="flex items-center text-xs text-slate-400 mb-2">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="truncate">{project.location}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <Badge className={`${getStatusColor(project.status || '')} text-xs`}>
                              {(project.status || 'planning').replace('_', ' ')}
                            </Badge>
                            {project.budget && (
                              <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                                <Wallet className="h-3 w-3" />
                                KES {((project.budget || 0) / 1000000).toFixed(1)}M
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </ResponsiveContainer>

        {/* CTA */}
        <ResponsiveContainer className="pb-12">
          <div className="text-center bg-white/[0.07] backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-2">Want to report a problem or track projects?</h3>
            <p className="text-sm text-slate-300 mb-4 max-w-md mx-auto">
              Sign up as a citizen to report infrastructure issues, verify progress, and hold contractors accountable.
            </p>
            <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => navigate('/auth')}>
              Get Started Free
            </Button>
          </div>
        </ResponsiveContainer>
      </main>

      <footer className="border-t border-white/10 bg-white/[0.03] py-6">
        <ResponsiveContainer>
          <p className="text-center text-slate-400 text-xs">
            Built for transparency in Kenyan governance • Empowering communities through technology
          </p>
        </ResponsiveContainer>
      </footer>
    </div>
  );
};

export default PublicProjects;
