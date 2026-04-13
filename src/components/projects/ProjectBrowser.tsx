import React, { useState, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, LayoutGrid, List, ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import { CATEGORIES } from '@/constants/problemReporting';
import ProjectCard, { type ProjectCardData } from './ProjectCard';
import { cn } from '@/lib/utils';

type TabKey = 'all' | 'in_progress' | 'planning' | 'completed';

interface ProjectBrowserProps {
  projects: ProjectCardData[];
  onSelectProject: (id: string) => void;
  loading?: boolean;
  title?: string;
  subtitle?: string;
  showFilters?: boolean;
  /** Extra actions to render in header area */
  headerActions?: React.ReactNode;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All Projects' },
  { key: 'in_progress', label: 'Ongoing' },
  { key: 'planning', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
];

const ProjectBrowser: React.FC<ProjectBrowserProps> = ({
  projects,
  onSelectProject,
  loading = false,
  title,
  subtitle,
  showFilters = true,
  headerActions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  // Filter projects
  const filtered = useMemo(() => {
    let result = projects;

    // Tab filter
    if (activeTab !== 'all') {
      result = result.filter(p => {
        const s = p.status?.toLowerCase().replace(/\s+/g, '_');
        if (activeTab === 'in_progress') return s === 'in_progress' || s === 'active';
        if (activeTab === 'planning') return s === 'planning' || s === 'pending' || s === 'pending_review';
        if (activeTab === 'completed') return s === 'completed';
        return true;
      });
    }

    // Category filter
    if (filterCategory !== 'all') {
      result = result.filter(p => {
        if (!p.category) return false;
        const cat = CATEGORIES.find(c => c.value === filterCategory);
        return p.category === filterCategory || (cat && p.category === cat.label);
      });
    }

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q) ||
        p.contractor_name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [projects, activeTab, filterCategory, searchTerm]);

  // Group by category
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, ProjectCardData[]> = {};
    filtered.forEach(p => {
      const key = p.category || 'other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return Object.entries(groups).sort(([, a], [, b]) => b.length - a.length);
  }, [filtered]);

  const activeFiltersCount = (filterCategory !== 'all' ? 1 : 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            {title && <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{title}</h1>}
            {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
          </div>
          {headerActions}
        </div>
      )}

      {/* Search + Tabs + Filters */}
      <div className="space-y-3">
        {/* Search bar */}
        {showFilters && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects by name, location, contractor..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-card border-border/60"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter button */}
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl relative flex-shrink-0">
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl max-h-[70dvh]">
                <SheetHeader>
                  <SheetTitle className="font-display">Filter Projects</SheetTitle>
                </SheetHeader>
                <div className="space-y-5 py-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Sector</label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="All sectors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sectors</SelectItem>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 rounded-xl" onClick={() => setFilterOpen(false)}>Apply Filters</Button>
                    <Button variant="outline" className="rounded-xl" onClick={() => { setFilterCategory('all'); setFilterOpen(false); }}>Reset</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* View toggle */}
            <div className="hidden sm:flex border border-border/60 rounded-xl overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="h-11 w-10 rounded-none"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="h-11 w-10 rounded-none"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Tab pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter tags */}
      {activeFiltersCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          {filterCategory !== 'all' && (
            <Badge variant="secondary" className="gap-1 rounded-full pl-3 pr-1.5 py-1">
              {CATEGORIES.find(c => c.value === filterCategory)?.label || filterCategory}
              <button onClick={() => setFilterCategory('all')} className="ml-1 rounded-full hover:bg-muted p-0.5">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border/40 overflow-hidden animate-pulse">
              <div className="aspect-[16/9] bg-muted" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-1.5 bg-muted rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <MapPin className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-1">No Projects Found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Content: Sector-grouped grid */}
      {!loading && filtered.length > 0 && viewMode === 'grid' && (
        <div className="space-y-8">
          {groupedByCategory.map(([categoryKey, categoryProjects]) => (
            <SectorRow
              key={categoryKey}
              categoryKey={categoryKey}
              projects={categoryProjects}
              onSelectProject={onSelectProject}
            />
          ))}
        </div>
      )}

      {/* Content: List view */}
      {!loading && filtered.length > 0 && viewMode === 'list' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <ProjectCard key={p.id} project={p} onClick={onSelectProject} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Sector Row with horizontal scroll ─── */

const SectorRow: React.FC<{
  categoryKey: string;
  projects: ProjectCardData[];
  onSelectProject: (id: string) => void;
}> = ({ categoryKey, projects, onSelectProject }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cat = CATEGORIES.find(c => c.value === categoryKey);
  const icon = cat?.icon || '🏗️';
  const label = cat?.label || categoryKey;

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.7;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h2 className="text-base sm:text-lg font-display font-bold text-foreground">{label}</h2>
          <Badge variant="secondary" className="text-xs rounded-full">{projects.length}</Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll('left')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll('right')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {projects.map(p => (
          <div key={p.id} className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start">
            <ProjectCard project={p} onClick={onSelectProject} compact />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectBrowser;
