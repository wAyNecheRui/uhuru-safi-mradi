import React, { useState, useMemo } from 'react';
import { MapPin, Filter, Layers, ChevronDown, ChevronUp, AlertTriangle, Globe2, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import InteractiveMap, { MapMarker } from '@/components/maps/InteractiveMapLazy';
import { useMapProjects, MapProject } from '@/hooks/useMapProjects';
import { useResponsive } from '@/hooks/useResponsive';
import { getCountyCentroid } from '@/constants/countyCentroids';
import { cn } from '@/lib/utils';

interface ProjectsMapViewProps {
  selectedCounty: string;
  height?: string;
  onProjectClick?: (project: MapProject) => void;
  defaultViewAllCounties?: boolean;
}

const STATUS_LEGEND = [
  { key: 'planning', color: '#eab308', label: 'Planning' },
  { key: 'in_progress', color: '#3b82f6', label: 'In Progress' },
  { key: 'under_review', color: '#f97316', label: 'Under Review' },
  { key: 'completed', color: '#22c55e', label: 'Completed' },
  { key: 'bidding_open', color: '#06b6d4', label: 'Bidding Open' },
];

const ProjectsMapView: React.FC<ProjectsMapViewProps> = ({
  selectedCounty,
  height = '560px',
  onProjectClick,
  defaultViewAllCounties = false,
}) => {
  const { isMobile } = useResponsive();
  const [viewAllCounties, setViewAllCounties] = useState(defaultViewAllCounties);
  const { projects, loading, error } = useMapProjects(selectedCounty, viewAllCounties);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');
  const [sheetProject, setSheetProject] = useState<MapProject | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      return true;
    });
  }, [projects, categoryFilter]);

  const markers: MapMarker[] = useMemo(() => filteredProjects.map(p => ({
    id: p.id,
    title: p.name,
    status: p.rawStatus,
    budget: p.budget,
    contractor: p.contractor,
    progress: p.progress,
    category: p.category || undefined,
    isApproximate: p.isApproximate,
    lat: p.lat,
    lng: p.lng,
  })), [filteredProjects]);

  const mapCenter: [number, number] = useMemo(
    () => getCountyCentroid(selectedCounty),
    [selectedCounty]
  );

  const handleMarkerClick = (m: MapMarker) => {
    const project = filteredProjects.find(p => p.id === m.id);
    if (!project) return;
    setHighlightedId(project.id);
    if (isMobile) setSheetProject(project);
    onProjectClick?.(project);
  };

  const handleListClick = (project: MapProject) => {
    setHighlightedId(project.id);
    if (isMobile) {
      setMobileTab('map');
      setSheetProject(project);
    }
    onProjectClick?.(project);
  };

  if (loading) {
    return (
      <div className="bg-muted rounded-xl flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Loading projects…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 rounded-xl flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
          <p className="text-destructive text-sm">Failed to load projects</p>
        </div>
      </div>
    );
  }

  /* ---------------- Filter toolbar (shared) ---------------- */
  const Toolbar = (
    <div className="flex flex-wrap items-center gap-2 p-3 border-b bg-muted/30">
      <div className="flex items-center gap-1.5 mr-2">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Filter</span>
      </div>

      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {categories.map(c => (
            <SelectItem key={c} value={c}>{c}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 ml-auto">
        <Label htmlFor="county-toggle" className="text-xs text-muted-foreground cursor-pointer">
          {viewAllCounties ? (
            <span className="flex items-center gap-1"><Globe2 className="h-3 w-3" /> All counties</span>
          ) : (
            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {selectedCounty} only</span>
          )}
        </Label>
        <Switch
          id="county-toggle"
          checked={viewAllCounties}
          onCheckedChange={setViewAllCounties}
        />
      </div>

      <Badge variant="secondary" className="ml-1 text-xs">
        {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
      </Badge>
    </div>
  );

  /* ---------------- Map panel (with overlays) ---------------- */
  const MapPanel = (
    <div className="relative w-full h-full">
      <InteractiveMap
        markers={markers}
        center={mapCenter}
        zoom={10}
        height="100%"
        cluster
        highlightedId={highlightedId}
        showLocateMe
        onMarkerClick={handleMarkerClick}
      />

      {/* County indicator */}
      <div className="absolute top-3 left-3 z-[400] pointer-events-none">
        <Badge className="bg-background/95 text-foreground shadow-md backdrop-blur-sm border">
          <MapPin className="h-3 w-3 mr-1" />
          {viewAllCounties ? 'Kenya — all counties' : `${selectedCounty} County`}
        </Badge>
      </div>

      {/* Legend (collapsible) */}
      <div className="absolute bottom-3 left-3 z-[400]">
        <Collapsible open={legendOpen} onOpenChange={setLegendOpen}>
          <Card className="shadow-md backdrop-blur-sm bg-background/95 border">
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium hover:bg-muted/50 transition-colors w-full">
                <Layers className="h-3 w-3" />
                Legend
                {legendOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-2.5 pb-2 pt-1 space-y-1 border-t">
                {STATUS_LEGEND.map(s => (
                  <div key={s.key} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="text-muted-foreground">{s.label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-xs pt-1 border-t mt-1">
                  <span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: '#9ca3af' }} />
                  <span className="text-muted-foreground">Approximate</span>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );

  /* ---------------- List panel ---------------- */
  const ListPanel = (
    <ScrollArea className="h-full" type="auto">
      <div className="p-3 space-y-2">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No projects match the current filters.
          </div>
        ) : (
          filteredProjects.map(project => (
            <button
              key={project.id}
              onClick={() => handleListClick(project)}
              onMouseEnter={() => !isMobile && setHighlightedId(project.id)}
              className={cn(
                'w-full text-left p-3 rounded-lg border transition-all',
                'hover:border-primary/50 hover:bg-muted/40',
                highlightedId === project.id && 'border-primary bg-primary/5 shadow-sm'
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-sm font-semibold leading-tight line-clamp-2 flex-1">
                  {project.name}
                </h4>
                <span
                  className="shrink-0 w-2.5 h-2.5 rounded-full mt-1"
                  style={{ background: getStatusColorByRaw(project.rawStatus) }}
                  aria-label={project.status}
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">
                  {project.status}
                </Badge>
                {project.category && (
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                    {project.category}
                  </Badge>
                )}
                {project.isApproximate && (
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 border-amber-400 text-amber-700 dark:text-amber-400">
                    ~ approx
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                <span className="truncate">{project.contractor}</span>
                <span className="font-medium text-foreground shrink-0 ml-2">{project.budget}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </ScrollArea>
  );

  /* ---------------- Mobile layout ---------------- */
  if (isMobile) {
    return (
      <div className="flex flex-col rounded-xl overflow-hidden border bg-card" style={{ height }}>
        {Toolbar}
        <Tabs value={mobileTab} onValueChange={(v) => setMobileTab(v as 'map' | 'list')} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-3 mt-2 grid grid-cols-2 w-auto">
            <TabsTrigger value="map" className="text-xs">Map</TabsTrigger>
            <TabsTrigger value="list" className="text-xs">List ({filteredProjects.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="map" className="flex-1 mt-2 mx-0">
            {MapPanel}
          </TabsContent>
          <TabsContent value="list" className="flex-1 mt-2 mx-0 min-h-0">
            {ListPanel}
          </TabsContent>
        </Tabs>

        <Sheet open={!!sheetProject} onOpenChange={(o) => !o && setSheetProject(null)}>
          <SheetContent side="bottom" className="max-h-[70vh]">
            {sheetProject && (
              <>
                <SheetHeader>
                  <SheetTitle className="text-left">{sheetProject.name}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge style={{ background: getStatusColorByRaw(sheetProject.rawStatus), color: 'white' }}>
                      {sheetProject.status}
                    </Badge>
                    {sheetProject.category && <Badge variant="secondary">{sheetProject.category}</Badge>}
                    {sheetProject.isApproximate && (
                      <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400">
                        Approximate location
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Budget</div>
                      <div className="font-semibold">{sheetProject.budget}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Contractor</div>
                      <div className="font-semibold truncate">{sheetProject.contractor}</div>
                    </div>
                    {sheetProject.location && (
                      <div className="col-span-2">
                        <div className="text-xs text-muted-foreground">Location</div>
                        <div className="font-medium">{sheetProject.location}</div>
                      </div>
                    )}
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{sheetProject.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${sheetProject.progress}%`, background: getStatusColorByRaw(sheetProject.rawStatus) }}
                      />
                    </div>
                  </div>
                  <Button asChild className="w-full mt-3">
                    <a href={`/projects/${sheetProject.id}`}>View details</a>
                  </Button>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  /* ---------------- Desktop layout ---------------- */
  return (
    <div className="flex flex-col rounded-xl overflow-hidden border bg-card" style={{ height }}>
      {Toolbar}
      <div className="flex-1 grid grid-cols-5 min-h-0">
        <div className="col-span-3 border-r">
          {MapPanel}
        </div>
        <div className="col-span-2 min-h-0">
          {ListPanel}
        </div>
      </div>
    </div>
  );
};

const getStatusColorByRaw = (raw: string): string => {
  const map: Record<string, string> = {
    planning: '#eab308',
    in_progress: '#3b82f6',
    under_review: '#f97316',
    completed: '#22c55e',
    approved: '#8b5cf6',
    bidding_open: '#06b6d4',
    contractor_selected: '#6366f1',
    pending: '#9ca3af',
  };
  return map[raw] || '#9ca3af';
};

export default ProjectsMapView;
