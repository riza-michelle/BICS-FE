import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Filter, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { bicsAPI } from '../services/api';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const L = require('leaflet') as any;
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('leaflet.markercluster');

interface MapLocation {
  id: number;
  site_name: string;
  building_name: string;
  coordinates: string;
  project_status: string;
  moa_status: string;
  address: string;
  city_municipality: string;
  province: string;
}

interface ParsedLocation extends MapLocation {
  lat: number;
  lng: number;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   '#22c55e',
  FALLOUT:  '#ef4444',
  PIPELINE: '#f59e0b',
};

const LEGEND = [
  { label: 'Active',   color: '#22c55e' },
  { label: 'Fallout',  color: '#ef4444' },
  { label: 'Pipeline', color: '#f59e0b' },
  { label: 'Unknown',  color: '#6b7280' },
];

const FILTERS = ['ALL', 'ACTIVE', 'FALLOUT', 'PIPELINE'] as const;
type FilterValue = typeof FILTERS[number];

function parseCoords(raw: string): [number, number] | null {
  if (!raw?.trim()) return null;
  const parts = raw.split(',');
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

function markerIcon(status: string): any {
  const color = STATUS_COLORS[status] || '#6b7280';
  return L.divIcon({
    html: `<div style="background:${color};width:10px;height:10px;border-radius:50%;border:2px solid rgba(255,255,255,0.9);box-shadow:0 1px 3px rgba(0,0,0,0.4)"></div>`,
    className: '',
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -8],
  });
}

function buildPopupHTML(loc: ParsedLocation): string {
  const address = [loc.address, loc.city_municipality, loc.province].filter(Boolean).join(', ');
  const statusBadge = loc.project_status
    ? `<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:11px;font-weight:600;background:${
        loc.project_status === 'ACTIVE' ? '#dcfce7' :
        loc.project_status === 'FALLOUT' ? '#fee2e2' :
        loc.project_status === 'PIPELINE' ? '#fef3c7' : '#f3f4f6'
      };color:${
        loc.project_status === 'ACTIVE' ? '#15803d' :
        loc.project_status === 'FALLOUT' ? '#b91c1c' :
        loc.project_status === 'PIPELINE' ? '#b45309' : '#4b5563'
      }">${loc.project_status}</span>`
    : '';
  const moaBadge = loc.moa_status
    ? `<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:11px;font-weight:600;background:#f3f4f6;color:#4b5563">${loc.moa_status}</span>`
    : '';
  return `
    <div style="padding:2px 0;min-width:180px">
      <p style="font-weight:600;color:#111;font-size:13px;margin:0 0 2px">${loc.site_name || '—'}</p>
      ${loc.building_name ? `<p style="font-size:11px;color:#4b5563;margin:0 0 4px">${loc.building_name}</p>` : ''}
      ${address ? `<p style="font-size:11px;color:#6b7280;margin:0 0 6px">${address}</p>` : ''}
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">${statusBadge}${moaBadge}</div>
      <p style="font-size:10px;color:#9ca3af;font-family:monospace;margin:0">${loc.coordinates}</p>
    </div>
  `;
}

const PH_CENTER: [number, number] = [12.0, 122.0];

const LiveMap: React.FC = () => {
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<FilterValue>('ALL');
  const mapRef      = useRef<any>(null);
  const mapDivRef   = useRef<HTMLDivElement | null>(null);
  const clusterRef  = useRef<any>(null);

  useEffect(() => {
    bicsAPI.getMapLocations()
      .then(res => { if (res.success && res.data) setLocations(res.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Initialize map once
  useEffect(() => {
    if (loading || !mapDivRef.current || mapRef.current) return;

    mapRef.current = L.map(mapDivRef.current, {
      center: PH_CENTER,
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    clusterRef.current = (L as any).markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 });
    mapRef.current.addLayer(clusterRef.current!);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, [loading]);

  const parsed = useMemo<ParsedLocation[]>(() =>
    locations.reduce<ParsedLocation[]>((acc, loc) => {
      const c = parseCoords(loc.coordinates);
      if (c) acc.push({ ...loc, lat: c[0], lng: c[1] });
      return acc;
    }, []),
  [locations]);

  const counts = useMemo(() => ({
    ALL:      parsed.length,
    ACTIVE:   parsed.filter(l => l.project_status === 'ACTIVE').length,
    FALLOUT:  parsed.filter(l => l.project_status === 'FALLOUT').length,
    PIPELINE: parsed.filter(l => l.project_status === 'PIPELINE').length,
  }), [parsed]);

  const filtered = useMemo(() =>
    filter === 'ALL' ? parsed : parsed.filter(l => l.project_status === filter),
  [parsed, filter]);

  // Sync markers whenever filter or data changes, then fit map to bounds
  useEffect(() => {
    if (!clusterRef.current || !mapRef.current) return;
    clusterRef.current.clearLayers();
    filtered.forEach(loc => {
      const marker = L.marker([loc.lat, loc.lng], { icon: markerIcon(loc.project_status) });
      marker.bindPopup(buildPopupHTML(loc), { maxWidth: 260 });
      clusterRef.current!.addLayer(marker);
    });
    if (filtered.length > 0) {
      const bounds = L.latLngBounds(filtered.map(loc => [loc.lat, loc.lng]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } else {
      // No markers — reset to Philippines overview
      mapRef.current.setView(PH_CENTER, 6);
    }
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-none">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            <div>
              <h1 className="text-base font-semibold text-gray-900">Live Map</h1>
              <p className="text-xs text-gray-500">
                {parsed.length.toLocaleString()} of {locations.length.toLocaleString()} records have coordinates plotted
              </p>
            </div>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}&nbsp;
                ({counts[f]})
              </button>
            ))}
            {filter !== 'ALL' && (
              <button
                onClick={() => setFilter('ALL')}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-gray-300 bg-white text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapDivRef} style={{ height: '100%', width: '100%' }} />

        {/* Legend */}
        <div className="absolute bottom-8 right-3 z-[999] bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Project Status</p>
          {LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
              <div
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
