import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, Maximize2, Filter, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import InteractiveMap, { MapMarker } from '@/components/maps/InteractiveMapLazy';
import { useContractorMapData, ContractorMapItem } from '@/hooks/useContractorMapData';
import { useResponsive } from '@/hooks/useResponsive';
import { KENYA_CENTER } from '@/constants/countyCentroids';
import { cn } from '@/lib/utils';

interface ContractorMapViewProps {
  contractorId: string | null;
  defaultMode?: 'bidding' | 'mine';
  compactHeight?: string;
}

// Urgency color for bid opportunities (overrides status color)
const URGENCY_COLORS = {
  high: '#ef4444',     // red — <3 days
  medium: '#f59e0b',   // amber — 3-7 days
  low: '#22c55e',      // green — >7 days
  expired: '#9ca3af',  // grey
};

const STATUS_COLORS: Record<string, string> = {
  planning: '#eab308',
  in_progress: '#3b82f6',
  under_review: '#f97316',
  completed: '#22c55e',
  bidding_open: '#06b6d4',
};

const ContractorMapView: React.FC<ContractorMapViewProps> = ({
  contractorId,
  defaultMode = 'bidding',
  compactHeight = '380px',
}) => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const { biddingOpportunities, myProjects, loading, error } = useContractorMapData(contractorId);

  const [mode, setMode] = useState<'bidding' | 'mine'>(defaultMode);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContractorMapItem | null>(null);

  const items = mode === 'bidding' ? biddingOpportunities : myProjects;

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => i.category && set.add(i.category));
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      if (categoryFilter !== 'all' && i.category !== categoryFilter) return false;
      if (mode === 'bidding' && urgencyFilter !== 'all' && i.urgency !== urgencyFilter) return false;
      return true;
    });
  }, [items, categoryFilter, urgencyFilter, mode]);

  // Build markers — bidding mode uses urgency colors, my-projects mode uses status colors
  const markers: MapMarker[] = useMemo(() => filteredItems.map(item => {
    const color = mode === 'bidding'
      ? URGENCY_COLORS[item.urgency || 'low']
      : STATUS_COLORS[item.rawStatus] || '#9ca3af';

    // Encode color as a synthetic status so InteractiveMap colors it correctly
    return {
      id: item.id,
      title: item.name,
      status: mode === 'bidding' ? `urgency_${item.urgency || 'low'}` : item.rawStatus,
      budget: item.budget,
      progress: item.progress,
      category: item.category || undefined,
      isApproximate: item.isApproximate,
      lat: item.lat,
      lng: item.lng,
      description: mode === 'bidding' && item.daysLeft !== null && item.daysLeft !== undefined
        ? (item.daysLeft >= 0 ? `${item.daysLeft} day${item.daysLeft !== 1 ? 's' : ''} left to bid` : 'Bidding closed')
        : undefined,
    };
  }), [filteredItems, mode]);

  // Inject urgency colors into the map's color scheme by augmenting markers with a colorOverride
  // Since InteractiveMap uses statusColors map, we pass status="urgency_X" and add to that map
  // Simpler: monkey-patch by exposing status hex inline through inline status names already mapped
  // We'll add urgency_* keys to the map by registering them globally on first render
  React.useEffect(() => {
    // Register urgency colors so InteractiveMap picks them up via its statusColors lookup
    // We attach a singleton on window to keep this side effect contained
    // (alternative: extend InteractiveMap props — kept as-is for minimal surface change)
    (window as any).__mapStatusColorOverrides = {
      ...((window as any).__mapStatusColorOverrides || {}),
      urgency_high: URGENCY_COLORS.high,
      urgency_medium: URGENCY_COLORS.medium,
      urgency_low: URGENCY_COLORS.low,
      urgency_expired: URGENCY_COLORS.expired,
    };
  }, []);

  const handleMarkerClick = (m: MapMarker) => {
    const item = filteredItems.find(i => i.id === m.id);
    if (item) setSelectedItem(item);
  };

  const handleAction = (item: ContractorMapItem) => {
    if (item.kind === 'bid_opportunity' && item.reportId) {
      navigate(`/contractor/bidding?report=${item.reportId}`);
    } else if (item.kind === 'my_project') {
      const projectId = item.id.replace('project-', '');
      navigate(`/contractor/projects/${projectId}`);
    }
  };

  /* ---------------- Toolbar ---------------- */
  const Toolbar = (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b bg-muted/30">
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'bidding' | 'mine')}>
        <TabsList className="h-8">
          <TabsTrigger value="bidding" className="text-xs px-2.5 h-6">
            <Briefcase className="h-3 w-3 mr-1" />
            Bidding ({biddingOpportunities.length})
          </TabsTrigger>
          <TabsTrigger value="mine" className="text-xs px-2.5 h-6">
            My Projects ({myProjects.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-1.5 ml-auto flex-wrap">
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {mode === 'bidding' && (
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All deadlines</SelectItem>
              <SelectItem value="high">Closing &lt;3 days</SelectItem>
              <SelectItem value="medium">3–7 days</SelectItem>
              <SelectItem value="low">&gt;7 days</SelectItem>
            </SelectContent>
          </Select>
        )}

        {!expanded && !isMobile && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setExpanded(true)}
          >
            <Maximize2 className="h-3 w-3 mr-1" />
            Expand
          </Button>
        )}
      </div>
    </div>
  );

  /* ---------------- Urgency legend (bidding mode only) ---------------- */
  const Legend = mode === 'bidding' ? (
    <div className="absolute bottom-3 left-3 z-[400]">
      <Card className="shadow-md backdrop-blur-sm bg-background/95 border">
        <div className="px-2.5 py-2 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Bid Deadline
          </div>
          {[
            { color: URGENCY_COLORS.high, label: 'Urgent (<3d)' },
            { color: URGENCY_COLORS.medium, label: 'Soon (3–7d)' },
            { color: URGENCY_COLORS.low, label: 'Open (>7d)' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              <span className="text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  ) : null;

  /* ---------------- Map panel ---------------- */
  const MapPanel = (
    <div className="relative w-full h-full">
      <InteractiveMap
        markers={markers}
        center={KENYA_CENTER}
        zoom={6}
        height="100%"
        cluster={false}
        showLocateMe
        onMarkerClick={handleMarkerClick}
      />
      <div className="absolute top-3 left-3 z-[400] pointer-events-none">
        <Badge className="bg-background/95 text-foreground shadow-md backdrop-blur-sm border">
          <MapPin className="h-3 w-3 mr-1" />
          {filteredItems.length} {mode === 'bidding' ? 'opportunit' : 'project'}{filteredItems.length !== 1 ? (mode === 'bidding' ? 'ies' : 's') : (mode === 'bidding' ? 'y' : '')}
        </Badge>
      </div>
      {Legend}
    </div>
  );

  /* ---------------- Detail panel for expanded view ---------------- */
  const DetailList = (
    <ScrollArea className="h-full" type="auto">
      <div className="p-3 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {mode === 'bidding' ? 'No open bidding opportunities match your filters.' : 'No active projects yet.'}
          </div>
        ) : (
          filteredItems.map(item => {
            const color = mode === 'bidding'
              ? URGENCY_COLORS[item.urgency || 'low']
              : STATUS_COLORS[item.rawStatus] || '#9ca3af';
            return (
              <button
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="w-full text-left p-3 rounded-lg border hover:border-primary/50 hover:bg-muted/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-sm font-semibold leading-tight line-clamp-2 flex-1">{item.name}</h4>
                  <span className="shrink-0 w-2.5 h-2.5 rounded-full mt-1" style={{ background: color }} />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  {item.category && <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">{item.category}</Badge>}
                  {item.county && <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4">{item.county}</Badge>}
                  {mode === 'bidding' && item.daysLeft !== null && item.daysLeft !== undefined && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] py-0 px-1.5 h-4',
                        item.urgency === 'high' && 'border-red-400 text-red-700 dark:text-red-400',
                        item.urgency === 'medium' && 'border-amber-400 text-amber-700 dark:text-amber-400',
                        item.urgency === 'low' && 'border-green-400 text-green-700 dark:text-green-400',
                      )}
                    >
                      <Clock className="h-2.5 w-2.5 mr-0.5" />
                      {item.daysLeft >= 0 ? `${item.daysLeft}d` : 'closed'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground">
                  <span className="truncate">
                    {mode === 'bidding'
                      ? `${item.bidCount || 0} bid${item.bidCount === 1 ? '' : 's'} so far`
                      : `${item.progress || 0}% complete`}
                  </span>
                  <span className="font-medium text-foreground shrink-0 ml-2">{item.budget}</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </ScrollArea>
  );

  /* ---------------- Detail dialog ---------------- */
  const DetailDialog = (
    <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
      <DialogContent className="sm:max-w-md">
        {selectedItem && (
          <>
            <DialogHeader>
              <DialogTitle className="text-left pr-6">{selectedItem.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge style={{ background: mode === 'bidding' ? URGENCY_COLORS[selectedItem.urgency || 'low'] : STATUS_COLORS[selectedItem.rawStatus], color: 'white' }}>
                  {selectedItem.status}
                </Badge>
                {selectedItem.category && <Badge variant="secondary">{selectedItem.category}</Badge>}
                {selectedItem.isApproximate && (
                  <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400">
                    Approximate location
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="text-xs text-muted-foreground">Budget</div>
                  <div className="font-semibold">{selectedItem.budget}</div>
                </div>
                {selectedItem.county && (
                  <div>
                    <div className="text-xs text-muted-foreground">County</div>
                    <div className="font-semibold">{selectedItem.county}</div>
                  </div>
                )}
                {selectedItem.location && (
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="font-medium">{selectedItem.location}</div>
                  </div>
                )}
                {mode === 'bidding' && selectedItem.daysLeft !== null && selectedItem.daysLeft !== undefined && (
                  <div className="col-span-2 flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <AlertCircle className={cn(
                      'h-4 w-4 shrink-0',
                      selectedItem.urgency === 'high' && 'text-red-600',
                      selectedItem.urgency === 'medium' && 'text-amber-600',
                      selectedItem.urgency === 'low' && 'text-green-600',
                    )} />
                    <div className="text-xs">
                      <span className="font-semibold">
                        {selectedItem.daysLeft >= 0 ? `${selectedItem.daysLeft} days left` : 'Bidding closed'}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        · {selectedItem.bidCount || 0} bid{selectedItem.bidCount === 1 ? '' : 's'} submitted
                      </span>
                    </div>
                  </div>
                )}
                {mode === 'mine' && selectedItem.progress !== undefined && (
                  <div className="col-span-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{selectedItem.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${selectedItem.progress}%`, background: STATUS_COLORS[selectedItem.rawStatus] }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button className="w-full mt-2" onClick={() => handleAction(selectedItem)}>
                {selectedItem.kind === 'bid_opportunity' ? 'View & Submit Bid' : 'Open Project'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  /* ---------------- Render ---------------- */
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          <AlertCircle className="h-6 w-6 mx-auto mb-2" />
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Opportunity Map
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t">
            {Toolbar}
            <div style={{ height: compactHeight }}>{MapPanel}</div>
          </div>
        </CardContent>
      </Card>

      {/* Expanded full-screen modal */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Opportunity Map — Full View
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 flex flex-col min-h-0">
            {Toolbar}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 min-h-0">
              <div className="lg:col-span-3 border-r min-h-[300px]">
                {MapPanel}
              </div>
              <div className="lg:col-span-2 min-h-0 border-t lg:border-t-0">
                {DetailList}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {DetailDialog}
    </>
  );
};

export default ContractorMapView;
