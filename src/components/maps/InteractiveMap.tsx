import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { MapPin, Wallet, Clock, CheckCircle, Wrench } from 'lucide-react';

// Fix default marker icons in Leaflet + Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const statusColors: Record<string, string> = {
  planning: '#eab308',
  in_progress: '#3b82f6',
  under_review: '#f97316',
  completed: '#22c55e',
  approved: '#8b5cf6',
  bidding_open: '#06b6d4',
  contractor_selected: '#6366f1',
  pending: '#9ca3af',
};

function createColorIcon(color: string) {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      transform: rotate(-45deg);
      position: relative; top: -14px; left: -14px;
    "><div style="
      width: 10px; height: 10px; border-radius: 50%;
      background: white; position: absolute;
      top: 50%; left: 50%; transform: translate(-50%, -50%);
    "></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  status?: string;
  budget?: number | string;
  contractor?: string;
  progress?: number;
}

interface InteractiveMapProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [markers, map]);
  
  return null;
}

const getStatusLabel = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers,
  center = [-1.2921, 36.8219], // Nairobi default
  zoom = 7,
  height = '400px',
  onMarkerClick,
  className = '',
}) => {
  const validMarkers = useMemo(
    () => markers.filter(m => 
      m.lat >= -90 && m.lat <= 90 && m.lng >= -180 && m.lng <= 180 &&
      !isNaN(m.lat) && !isNaN(m.lng)
    ),
    [markers]
  );

  return (
    <div className={`rounded-lg overflow-hidden border ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validMarkers.length > 1 && <FitBounds markers={validMarkers} />}
        
        {validMarkers.map((marker) => {
          const color = statusColors[marker.status || 'pending'] || '#9ca3af';
          const icon = createColorIcon(color);
          
          return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onMarkerClick?.(marker),
              }}
            >
              <Popup>
                <div className="min-w-[200px] max-w-[280px]">
                  <h4 className="font-semibold text-sm mb-1">{marker.title}</h4>
                  {marker.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{marker.description}</p>
                  )}
                  <div className="space-y-1 text-xs">
                    {marker.status && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span 
                          className="px-2 py-0.5 rounded-full text-white text-[10px] font-medium"
                          style={{ backgroundColor: color }}
                        >
                          {getStatusLabel(marker.status)}
                        </span>
                      </div>
                    )}
                    {marker.budget && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Budget:</span>
                        <span className="font-medium">
                          {typeof marker.budget === 'number' 
                            ? `KES ${marker.budget.toLocaleString()}` 
                            : marker.budget}
                        </span>
                      </div>
                    )}
                    {marker.contractor && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Contractor:</span>
                        <span className="font-medium">{marker.contractor}</span>
                      </div>
                    )}
                    {marker.progress !== undefined && (
                      <div className="mt-1">
                        <div className="flex justify-between text-[10px] mb-0.5">
                          <span>Progress</span>
                          <span>{marker.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full">
                          <div 
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: `${marker.progress}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
