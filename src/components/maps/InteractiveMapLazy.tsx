import React, { lazy, Suspense } from 'react';
import type { MapMarker } from './InteractiveMap';

const InteractiveMap = lazy(() => import('./InteractiveMap'));

interface InteractiveMapLazyProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
  cluster?: boolean;
  highlightedId?: string | null;
  fitToMarkers?: boolean;
  showLocateMe?: boolean;
}

const MapFallback: React.FC<{ height?: string }> = ({ height = '400px' }) => (
  <div
    className="bg-muted rounded-lg flex items-center justify-center w-full"
    style={{ height }}
    role="status"
    aria-label="Loading map"
  >
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
      <p className="text-muted-foreground text-sm">Loading map…</p>
    </div>
  </div>
);

const InteractiveMapLazy: React.FC<InteractiveMapLazyProps> = (props) => (
  <Suspense fallback={<MapFallback height={props.height} />}>
    <InteractiveMap {...props} />
  </Suspense>
);

export default InteractiveMapLazy;
export type { MapMarker };
