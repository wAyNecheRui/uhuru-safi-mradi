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
  category?: string;
  isApproximate?: boolean;
  /** Optional explicit color (hex). Overrides the status-based color lookup. */
  color?: string;
}

interface InteractiveMapProps {
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

const getStatusColor = (status?: string) => statusColors[status || 'pending'] || '#9ca3af';
const getMarkerColor = (m: MapMarker) => m.color || getStatusColor(m.status);

const getStatusLabel = (status: string) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  markers,
  center = [-1.2921, 36.8219],
  zoom = 7,
  height = '400px',
  onMarkerClick,
  className = '',
  cluster = false,
  highlightedId = null,
  fitToMarkers = true,
  showLocateMe = false,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const validMarkers = useMemo(
    () => markers.filter(m =>
      m.lat >= -90 && m.lat <= 90 && m.lng >= -180 && m.lng <= 180 &&
      !isNaN(m.lat) && !isNaN(m.lng)
    ),
    [markers]
  );

  // Init map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [center[1], center[0]],
      zoom,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

    if (showLocateMe) {
      map.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: false,
          showUserLocation: true,
        }),
        'top-right'
      );
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center when explicitly changed
  useEffect(() => {
    if (mapRef.current && !fitToMarkers) {
      mapRef.current.flyTo({ center: [center[1], center[0]], zoom, duration: 1000 });
    }
  }, [center, zoom, fitToMarkers]);

  // Cluster mode: GeoJSON source + layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !cluster) return;

    const sourceId = 'projects-source';
    const geojson = {
      type: 'FeatureCollection' as const,
      features: validMarkers.map(m => ({
        type: 'Feature' as const,
        properties: {
          id: m.id,
          title: m.title,
          status: m.status || 'pending',
          color: getMarkerColor(m),
          isApproximate: m.isApproximate ? 1 : 0,
        },
        geometry: { type: 'Point' as const, coordinates: [m.lng, m.lat] },
      })),
    };

    const setupLayers = () => {
      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojson as any);
        return;
      }

      map.addSource(sourceId, {
        type: 'geojson',
        data: geojson as any,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 50,
      });

      // Cluster bubbles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            '#3b82f6', 10, '#6366f1', 30, '#8b5cf6'
          ],
          'circle-radius': [
            'step', ['get', 'point_count'],
            18, 10, 24, 30, 30
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: sourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Individual point pins
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 9,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': [
            'case', ['==', ['get', 'isApproximate'], 1], 0.65, 1
          ],
        },
      });

      // Approximate ring overlay
      map.addLayer({
        id: 'approximate-ring',
        type: 'circle',
        source: sourceId,
        filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'isApproximate'], 1]],
        paint: {
          'circle-color': 'transparent',
          'circle-radius': 14,
          'circle-stroke-width': 2,
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-opacity': 0.5,
        },
      });

      // Cluster click → zoom in
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        const clusterId = features[0]?.properties?.cluster_id;
        if (clusterId == null) return;
        (map.getSource(sourceId) as any).getClusterExpansionZoom(
          clusterId,
          (err: any, expansionZoom: number) => {
            if (err) return;
            map.easeTo({
              center: (features[0].geometry as any).coordinates,
              zoom: expansionZoom,
            });
          }
        );
      });

      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });

      // Point click → popup + onMarkerClick
      map.on('click', 'unclustered-point', (e) => {
        const feat = e.features?.[0];
        if (!feat) return;
        const id = feat.properties?.id;
        const marker = validMarkers.find(m => m.id === id);
        if (!marker) return;

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ offset: 15, maxWidth: '300px', closeButton: true })
          .setLngLat((feat.geometry as any).coordinates)
          .setHTML(buildPopupHtml(marker))
          .addTo(map);

        if (onMarkerClick) onMarkerClick(marker);
      });

      map.on('mouseenter', 'unclustered-point', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'unclustered-point', () => { map.getCanvas().style.cursor = ''; });
    };

    if (map.isStyleLoaded()) {
      setupLayers();
    } else {
      map.once('load', setupLayers);
    }

    // Fit bounds
    if (fitToMarkers && validMarkers.length > 0 && map.isStyleLoaded()) {
      const bounds = new maplibregl.LngLatBounds();
      validMarkers.forEach(m => bounds.extend([m.lng, m.lat]));
      if (validMarkers.length === 1) {
        map.flyTo({ center: [validMarkers[0].lng, validMarkers[0].lat], zoom: 12, duration: 800 });
      } else {
        map.fitBounds(bounds, { padding: 60, maxZoom: 12, duration: 800 });
      }
    }
  }, [validMarkers, cluster, onMarkerClick, fitToMarkers]);

  // Non-cluster mode: DOM markers (legacy)
  useEffect(() => {
    if (cluster) return;
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current.clear();

    const bounds = new maplibregl.LngLatBounds();

    validMarkers.forEach(marker => {
      const color = getMarkerColor(marker);
      const opacity = marker.isApproximate ? 0.7 : 1;
      const ring = marker.isApproximate
        ? `box-shadow: 0 0 0 4px ${color}33, 0 2px 8px rgba(0,0,0,0.3);`
        : `box-shadow: 0 2px 8px rgba(0,0,0,0.3);`;

      const el = document.createElement('div');
      el.style.cursor = 'pointer';
      el.innerHTML = `<div style="
        width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
        background: ${color}; border: 3px solid white;
        ${ring}
        transform: rotate(-45deg);
        transition: transform 0.2s;
        opacity: ${opacity};
      "><div style="
        width: 10px; height: 10px; border-radius: 50%;
        background: white; position: absolute;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
      "></div></div>`;

      el.addEventListener('mouseenter', () => {
        (el.firstElementChild as HTMLElement).style.transform = 'rotate(-45deg) scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        (el.firstElementChild as HTMLElement).style.transform = 'rotate(-45deg) scale(1)';
      });

      const popup = new maplibregl.Popup({ offset: 25, maxWidth: '300px' }).setHTML(buildPopupHtml(marker));

      const m = new maplibregl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(popup)
        .addTo(map);

      if (onMarkerClick) {
        el.addEventListener('click', () => onMarkerClick(marker));
      }

      bounds.extend([marker.lng, marker.lat]);
      markersRef.current.set(marker.id, m);
    });

    if (fitToMarkers && validMarkers.length > 1) {
      map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 800 });
    } else if (fitToMarkers && validMarkers.length === 1) {
      map.flyTo({ center: [validMarkers[0].lng, validMarkers[0].lat], zoom: 12, duration: 800 });
    }
  }, [validMarkers, cluster, onMarkerClick, fitToMarkers]);

  // Highlight a marker (open its popup)
  useEffect(() => {
    if (!highlightedId) return;
    const map = mapRef.current;
    if (!map) return;
    const target = validMarkers.find(m => m.id === highlightedId);
    if (!target) return;

    map.flyTo({ center: [target.lng, target.lat], zoom: Math.max(map.getZoom(), 12), duration: 600 });

    if (cluster) {
      if (popupRef.current) popupRef.current.remove();
      popupRef.current = new maplibregl.Popup({ offset: 15, maxWidth: '300px', closeButton: true })
        .setLngLat([target.lng, target.lat])
        .setHTML(buildPopupHtml(target))
        .addTo(map);
    } else {
      const dom = markersRef.current.get(highlightedId);
      dom?.togglePopup();
    }
  }, [highlightedId, validMarkers, cluster]);

  return (
    <div
      ref={mapContainer}
      className={`rounded-xl overflow-hidden border border-border ${className}`}
      style={{ height }}
    />
  );
};

function buildPopupHtml(marker: MapMarker): string {
  const color = getMarkerColor(marker);
  const budgetStr = typeof marker.budget === 'number'
    ? `KES ${marker.budget.toLocaleString()}`
    : marker.budget || '';

  const approxBadge = marker.isApproximate
    ? `<div style="display:inline-block;background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:10px;font-size:10px;margin-bottom:6px;font-weight:500">📍 Location approximate</div>`
    : '';

  return `
    <div style="min-width:220px;max-width:280px;font-family:system-ui,-apple-system,sans-serif;padding:2px;">
      ${approxBadge}
      <h4 style="font-weight:600;font-size:14px;margin:0 0 6px;color:#0f172a;line-height:1.3">${escapeHtml(marker.title)}</h4>
      ${marker.description ? `<p style="font-size:12px;color:#64748b;margin:0 0 8px;line-height:1.4">${escapeHtml(marker.description)}</p>` : ''}
      <div style="font-size:12px">
        ${marker.status ? `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
          <span style="color:#64748b">Status</span>
          <span style="background:${color};color:white;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:500">${escapeHtml(getStatusLabel(marker.status))}</span>
        </div>` : ''}
        ${marker.category ? `<div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="color:#64748b">Category</span><span style="font-weight:500;color:#0f172a">${escapeHtml(marker.category)}</span></div>` : ''}
        ${budgetStr ? `<div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="color:#64748b">Budget</span><span style="font-weight:500;color:#0f172a">${escapeHtml(budgetStr)}</span></div>` : ''}
        ${marker.contractor ? `<div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="color:#64748b">Contractor</span><span style="font-weight:500;color:#0f172a">${escapeHtml(marker.contractor)}</span></div>` : ''}
        ${marker.progress !== undefined ? `
          <div style="margin-top:8px">
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px"><span style="color:#64748b">Progress</span><span style="font-weight:500;color:#0f172a">${marker.progress}%</span></div>
            <div style="width:100%;height:6px;background:#e5e7eb;border-radius:4px;overflow:hidden"><div style="width:${marker.progress}%;height:100%;background:${color};transition:width 0.5s"></div></div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]!));
}

export default InteractiveMap;
