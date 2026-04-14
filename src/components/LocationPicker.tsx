'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Loader2, Navigation } from 'lucide-react';
import { ManualLocation } from '../types';

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    suburb?: string;
    neighbourhood?: string;
    state?: string;
    country?: string;
  };
}

function shortLabel(r: NominatimResult): string {
  const a = r.address;
  if (a) {
    const local = a.neighbourhood ?? a.suburb ?? a.town ?? a.city;
    const region = a.city ?? a.state;
    const parts = [local, region !== local ? region : undefined].filter(Boolean);
    if (parts.length) return parts.join(', ');
  }
  return r.display_name.split(',').slice(0, 2).join(',').trim();
}

export function LocationPicker({
  current,
  onSelect,
  onClear,
  onClose,
}: {
  current: ManualLocation | null;
  onSelect: (loc: ManualLocation) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Autofocus after mount animation
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 3) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=us`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'AutoCard/1.0' },
        });
        if (res.ok) setResults((await res.json()) as NominatimResult[]);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }, 450);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function handleSelect(r: NominatimResult) {
    onSelect({ lat: parseFloat(r.lat), lon: parseFloat(r.lon), label: shortLabel(r) });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}/>

      {/* Sheet */}
      <div className="relative bg-white rounded-t-3xl shadow-2xl flex flex-col" style={{ maxHeight: '72vh' }}>
        {/* Pull handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full"/>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-indigo-500"/>
            <span className="font-bold text-gray-900">Set Location</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
          >
            <X size={15}/>
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 flex-shrink-0">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search US city, neighborhood, or zip…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 pr-9 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-300"
            />
            {loading && (
              <Loader2
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
              />
            )}
          </div>
        </div>

        {/* Results list */}
        <div className="overflow-y-auto px-5 pb-8 space-y-1">
          {/* "Use GPS" — only shown when a manual pin is active */}
          {current && (
            <button
              onClick={() => { onClear(); onClose(); }}
              className="w-full flex items-center gap-3 p-3 mb-1 rounded-xl border border-dashed border-indigo-200 hover:bg-indigo-50 transition-colors text-left"
            >
              <Navigation size={15} className="text-indigo-400 flex-shrink-0"/>
              <div>
                <p className="text-sm font-semibold text-indigo-600">Use GPS instead</p>
                <p className="text-xs text-gray-400">Remove manual pin · {current.label}</p>
              </div>
            </button>
          )}

          {results.map(r => (
            <button
              key={r.place_id}
              onClick={() => handleSelect(r)}
              className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <MapPin size={14} className="text-gray-300 flex-shrink-0 mt-0.5"/>
              <p className="text-sm text-gray-800 leading-snug">
                {r.display_name.split(',').slice(0, 3).join(', ')}
              </p>
            </button>
          ))}

          {!loading && query.length >= 3 && results.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">No places found</p>
          )}

          {query.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-6 px-4 leading-relaxed">
              {current
                ? `Currently pinned: ${current.label}`
                : 'Search any US city, neighborhood, or zip code to pin a location'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
