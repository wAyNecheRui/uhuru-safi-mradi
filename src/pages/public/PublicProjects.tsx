import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building, TrendingUp, CheckCircle } from 'lucide-react';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import ProjectBrowser from '@/components/projects/ProjectBrowser';
import logoImg from '@/assets/uhuru-safi-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import type { ProjectCardData } from '@/components/projects/ProjectCard';

const PublicProjects = () => {
  const navigate = useNavigate();

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
          .select('user_id, company_name, verified')
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
          contractor_verified: contractor?.verified || false,
        };
      });
    }
  });

  const cardData: ProjectCardData[] = useMemo(() =>
    projects.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status || 'planning',
      budget: p.budget,
      progress: 0,
      photo_url: p.photo_url,
      location: p.location,
      category: p.category,
      contractor_name: p.contractor_name,
      contractor_verified: p.contractor_verified,
      contractor_id: p.contractor_id,
      created_at: p.created_at,
    })),
    [projects]
  );

  const stats = {
    total: projects.length,
    active: projects.filter((p: any) => p.status === 'in_progress').length,
    completed: projects.filter((p: any) => p.status === 'completed').length,
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
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </div>
          </div>
        </ResponsiveContainer>
      </nav>

      <main>
        {/* Hero */}
        <ResponsiveContainer className="pt-10 pb-4">
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Public Projects</h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore infrastructure projects across Kenya. See what's being built, who's building it, and how public funds are being utilized.
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
        </ResponsiveContainer>

        {/* Projects using ProjectBrowser - themed for dark background */}
        <ResponsiveContainer className="pb-12">
          <div className="[&_input]:bg-white/10 [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder\\:text-slate-400 [&_.bg-card]:bg-white/[0.07] [&_.bg-card]:border-white/10 [&_.text-foreground]:text-white [&_.text-muted-foreground]:text-slate-400 [&_h1]:text-white [&_h2]:text-white [&_.border-border\\/60]:border-white/10">
            <ProjectBrowser
              projects={cardData}
              onSelectProject={() => navigate('/auth')}
              loading={isLoading}
            />
          </div>
        </ResponsiveContainer>

        {/* CTA */}
        <ResponsiveContainer className="pb-12">
          <div className="text-center bg-white/[0.07] backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/10">
            <h3 className="text-lg font-bold text-white mb-2">Want to report a problem or track projects?</h3>
            <p className="text-sm text-slate-300 mb-4 max-w-md mx-auto">
              Sign up as a citizen to report infrastructure issues, verify progress, and hold contractors accountable.
            </p>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => navigate('/auth')}>
              Get Started Free
            </Button>
          </div>
        </ResponsiveContainer>
      </main>

      <footer className="border-t border-white/10 bg-white/[0.03] py-6">
        <ResponsiveContainer>
          <p className="text-center text-slate-400 text-xs">
            Built for transparency in Kenyan governance — Empowering communities through technology
          </p>
        </ResponsiveContainer>
      </footer>
    </div>
  );
};

export default PublicProjects;
