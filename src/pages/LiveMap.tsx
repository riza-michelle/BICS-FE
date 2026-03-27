import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Filter, X, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
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

interface NoCoordRecord {
  id: number;
  site_name: string;
  building_name: string;
  address: string;
  city_municipality: string;
  province: string;
  project_status: string;
  moa_status: string;
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

const STATUS_BADGE_STYLE: Record<string, { bg: string; text: string }> = {
  ACTIVE:   { bg: '#dcfce7', text: '#15803d' },
  FALLOUT:  { bg: '#fee2e2', text: '#b91c1c' },
  PIPELINE: { bg: '#fef3c7', text: '#b45309' },
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
    html: `<div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;background:${color};border-radius:6px;border:2px solid rgba(255,255,255,0.95);box-shadow:0 2px 6px rgba(0,0,0,0.35)">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01"/>
      </svg>
    </div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -16],
  });
}

function buildPopupHTML(loc: ParsedLocation): string {
  const address = [loc.address, loc.city_municipality, loc.province].filter(Boolean).join(', ');
  const s = STATUS_BADGE_STYLE[loc.project_status];
  const statusBadge = loc.project_status
    ? `<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:11px;font-weight:600;background:${s?.bg ?? '#f3f4f6'};color:${s?.text ?? '#4b5563'}">${loc.project_status}</span>`
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
  const [locations, setLocations]       = useState<MapLocation[]>([]);
  const [noCoords, setNoCoords]         = useState<NoCoordRecord[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<FilterValue>('ALL');
  const [showSummary, setShowSummary]   = useState(false);
  const [summaryFilter, setSummaryFilter] = useState('');
  const mapRef     = useRef<any>(null);
  const mapDivRef  = useRef<HTMLDivElement | null>(null);
  const clusterRef = useRef<any>(null);

  useEffect(() => {
    Promise.all([
      bicsAPI.getMapLocations(),
      bicsAPI.getNoCoordinates(),
    ]).then(([mapRes, noRes]) => {
      if (mapRes.success && mapRes.data) setLocations(mapRes.data);
      if (noRes.success && noRes.data) setNoCoords(noRes.data);
    }).catch(console.error)
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

  const filteredNoCoords = useMemo(() => {
    if (!summaryFilter.trim()) return noCoords;
    const q = summaryFilter.toLowerCase();
    return noCoords.filter(r =>
      r.site_name?.toLowerCase().includes(q) ||
      r.building_name?.toLowerCase().includes(q) ||
      r.city_municipality?.toLowerCase().includes(q) ||
      r.province?.toLowerCase().includes(q)
    );
  }, [noCoords, summaryFilter]);

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
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-blue-500" />
            <div>
              <h1 className="text-base font-semibold text-gray-900">Live Map</h1>
              <p className="text-xs text-gray-500">
                {parsed.length.toLocaleString()} of {(locations.length + noCoords.length).toLocaleString()} records have coordinates plotted
              </p>
            </div>
            {noCoords.length > 0 && (
              <button
                onClick={() => setShowSummary(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {noCoords.length.toLocaleString()} without coordinates
                {showSummary ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
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

      {/* No-coordinates summary panel */}
      {showSummary && (
        <div className="flex-none bg-white border-b border-gray-200" style={{ maxHeight: '280px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">
                Sites without coordinates ({noCoords.length.toLocaleString()})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={summaryFilter}
                onChange={e => setSummaryFilter(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 w-48 focus:outline-none focus:border-blue-400"
              />
              <button onClick={() => setShowSummary(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Site Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Building</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 whitespace-nowrap">City / Municipality</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Province</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredNoCoords.map(r => {
                  const s = STATUS_BADGE_STYLE[r.project_status];
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-1.5 text-gray-800 font-medium">{r.site_name || '—'}</td>
                      <td className="px-4 py-1.5 text-gray-600">{r.building_name || '—'}</td>
                      <td className="px-4 py-1.5 text-gray-600">{r.city_municipality || '—'}</td>
                      <td className="px-4 py-1.5 text-gray-600">{r.province || '—'}</td>
                      <td className="px-4 py-1.5">
                        {r.project_status ? (
                          <span
                            className="px-1.5 py-0.5 rounded text-xs font-medium"
                            style={{ background: s?.bg ?? '#f3f4f6', color: s?.text ?? '#4b5563' }}
                          >
                            {r.project_status}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
                {filteredNoCoords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-gray-400">No results found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapDivRef} style={{ height: '100%', width: '100%' }} />

        {/* Legend */}
        <div className="absolute bottom-8 right-3 z-[999] bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Project Status</p>
          {LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
              <div
                className="w-3.5 h-3.5 rounded flex-shrink-0 border border-white shadow-sm"
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
