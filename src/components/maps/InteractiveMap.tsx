import React, { useRef, useEffect, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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

const getStatusLabel = (status: string) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers,
  center = [-1.2921, 36.8219],
  zoom = 7,
  height = '400px',
  onMarkerClick,
  className = '',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const validMarkers = useMemo(
    () => markers.filter(m =>
      m.lat >= -90 && m.lat <= 90 && m.lng >= -180 && m.lng <= 180 &&
      !isNaN(m.lat) && !isNaN(m.lng)
    ),
    [markers]
  );

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [center[1], center[0]],
      zoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update center
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [center[1], center[0]], zoom, duration: 1200 });
    }
  }, [center, zoom]);

  // Update markers
  useEffect(() => {
    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!mapRef.current) return;

    const bounds = new maplibregl.LngLatBounds();

    validMarkers.forEach(marker => {
      const color = statusColors[marker.status || 'pending'] || '#9ca3af';

      const el = document.createElement('div');
      el.innerHTML = `<div style="
        width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
        background: ${color}; border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transform: rotate(-45deg); cursor: pointer;
        transition: transform 0.2s;
      "><div style="
        width: 10px; height: 10px; border-radius: 50%;
        background: white; position: absolute;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
      "></div></div>`;
      el.style.cursor = 'pointer';
      el.addEventListener('mouseenter', () => {
        el.firstElementChild && ((el.firstElementChild as HTMLElement).style.transform = 'rotate(-45deg) scale(1.2)');
      });
      el.addEventListener('mouseleave', () => {
        el.firstElementChild && ((el.firstElementChild as HTMLElement).style.transform = 'rotate(-45deg) scale(1)');
      });

      const budgetStr = typeof marker.budget === 'number'
        ? `KES ${marker.budget.toLocaleString()}`
        : marker.budget || '';

      const popupHtml = `
        <div style="min-width:200px;max-width:280px;font-family:system-ui;">
          <h4 style="font-weight:600;font-size:13px;margin:0 0 4px">${marker.title}</h4>
          ${marker.description ? `<p style="font-size:11px;color:#666;margin:0 0 6px">${marker.description}</p>` : ''}
          <div style="font-size:11px;space-y:2px">
            ${marker.status ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
              <span style="color:#888">Status:</span>
              <span style="background:${color};color:white;padding:1px 8px;border-radius:10px;font-size:10px">${getStatusLabel(marker.status)}</span>
            </div>` : ''}
            ${budgetStr ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="color:#888">Budget:</span><span style="font-weight:500">${budgetStr}</span></div>` : ''}
            ${marker.contractor ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="color:#888">Contractor:</span><span style="font-weight:500">${marker.contractor}</span></div>` : ''}
            ${marker.progress !== undefined ? `
              <div style="margin-top:4px">
                <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:2px"><span>Progress</span><span>${marker.progress}%</span></div>
                <div style="width:100%;height:5px;background:#e5e7eb;border-radius:4px"><div style="width:${marker.progress}%;height:5px;background:${color};border-radius:4px;transition:width 0.5s"></div></div>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25, maxWidth: '300px' }).setHTML(popupHtml);

      const m = new maplibregl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      if (onMarkerClick) {
        el.addEventListener('click', () => onMarkerClick(marker));
      }

      bounds.extend([marker.lng, marker.lat]);
      markersRef.current.push(m);
    });

    if (validMarkers.length > 1 && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 800 });
    }
  }, [validMarkers, onMarkerClick]);

  return (
    <div
      ref={mapContainer}
      className={`rounded-xl overflow-hidden border border-border ${className}`}
      style={{ height }}
    />
  );
};

export default InteractiveMap;
