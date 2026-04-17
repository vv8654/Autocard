'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Zap, Loader2, MapPin, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ALL_MERCHANTS } from '../../data/allMerchants';
import { detectCategoryFromName } from '../../lib/categoryDetect';
import { getRecommendation } from '../../lib/recommendation';
import { searchNearbyByName, distanceLabel } from '../../lib/location';
import { RecommendationModal } from '../../components/RecommendationModal';
import { BottomNav } from '../../components/BottomNav';
import { Category, Merchant, Recommendation } from '../../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  name: string;
  category: Category;
  emoji: string;
  source: 'local' | 'osm';
  distance?: number;
  address?: string;
}

interface RecentSearch {
  id: string;
  name: string;
  category: Category;
  emoji: string;
  address?: string;
  timestamp: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RECENT_KEY = 'autocard_recent_searches';

const CATEGORY_EMOJI: Record<Category, string> = {
  dining: '🍽️', grocery: '🛒', travel: '✈️', transit: '🚗',
  pharmacy: '💊', streaming: '🎬', gas: '⛽', online: '📦', general: '🏪',
};

const CATEGORY_LABEL: Record<Category, string> = {
  dining: 'Dining', grocery: 'Grocery', travel: 'Travel', transit: 'Transit',
  pharmacy: 'Pharmacy', streaming: 'Streaming', gas: 'Gas', online: 'Online', general: 'General',
};

const QUICK_CATEGORIES: { category: Category; label: string; emoji: string }[] = [
  { category: 'dining',    label: 'Dining',    emoji: '🍽️' },
  { category: 'grocery',   label: 'Grocery',   emoji: '🛒' },
  { category: 'gas',       label: 'Gas',       emoji: '⛽' },
  { category: 'pharmacy',  label: 'Pharmacy',  emoji: '💊' },
  { category: 'travel',    label: 'Travel',    emoji: '✈️' },
  { category: 'transit',   label: 'Transit',   emoji: '🚗' },
  { category: 'streaming', label: 'Streaming', emoji: '🎬' },
  { category: 'online',    label: 'Online',    emoji: '📦' },
];

// ── Persistence ───────────────────────────────────────────────────────────────

function loadRecents(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as RecentSearch[]; }
  catch { return []; }
}

function saveRecent(r: SearchResult): void {
  if (typeof window === 'undefined') return;
  try {
    const prev = loadRecents().filter(x => x.id !== r.id).slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify([
      { id: r.id, name: r.name, category: r.category, emoji: r.emoji, address: r.address, timestamp: Date.now() },
      ...prev,
    ]));
  } catch { /* ignore */ }
}

// ── Nominatim fallback (no location only) ─────────────────────────────────────

interface NominatimHit {
  place_id: number;
  display_name: string;
  extratags?: Record<string, string>;
}

const NOMINATIM_TAG_MAP: Record<string, Category> = {
  restaurant: 'dining', cafe: 'dining', fast_food: 'dining', bar: 'dining',
  pub: 'dining', food_court: 'dining', ice_cream: 'dining', bakery: 'dining',
  pharmacy: 'pharmacy', fuel: 'gas', supermarket: 'grocery', convenience: 'grocery',
  grocery: 'grocery', greengrocer: 'grocery', hotel: 'travel', hostel: 'travel',
  motel: 'travel', bus_station: 'transit', car_rental: 'transit',
};

function parseNominatimHit(h: NominatimHit): SearchResult {
  const parts   = h.display_name.split(',');
  const name    = parts[0].trim();
  const address = parts.slice(1, 3).map(s => s.trim()).filter(Boolean).join(', ') || undefined;
  const amenity = h.extratags?.amenity ?? '';
  const shop    = h.extratags?.shop    ?? '';
  const cat: Category = NOMINATIM_TAG_MAP[amenity] ?? NOMINATIM_TAG_MAP[shop] ?? detectCategoryFromName(name);
  return { id: String(h.place_id), name, category: cat, emoji: CATEGORY_EMOJI[cat], source: 'osm' as const, address };
}

// Nominatim search — optionally location-biased with viewbox
async function searchNominatim(
  query: string,
  coords?: { lat: number; lon: number },
): Promise<SearchResult[]> {
  // viewbox biases results toward the user's area (bounded=0 still allows outside)
  const viewbox = coords
    ? `&viewbox=${coords.lon - 0.5},${coords.lat + 0.5},${coords.lon + 0.5},${coords.lat - 0.5}&bounded=0`
    : '';
  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}` +
    `&format=json&limit=8&addressdetails=1&extratags=1&countrycodes=us${viewbox}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'AutoCard/1.0' } });
  if (!res.ok) return [];
  const hits: NominatimHit[] = await res.json();
  return hits.filter(h => h.display_name).map(parseNominatimHit);
}

// ── Result card ───────────────────────────────────────────────────────────────

function ResultCard({
  result, onTap, enabledCards, bonuses, redemptionStyle,
}: {
  result: SearchResult;
  onTap: (rec: Recommendation, result: SearchResult) => void;
  enabledCards: ReturnType<typeof useApp>['enabledCards'];
  bonuses: ReturnType<typeof useApp>['state']['bonuses'];
  redemptionStyle: ReturnType<typeof useApp>['state']['redemptionStyle'];
}) {
  if (enabledCards.length === 0) return null;
  const merchant: Merchant = {
    id: result.id, name: result.name, displayName: result.name,
    category: result.category, emoji: result.emoji,
    scenarioLabel: CATEGORY_LABEL[result.category],
  };
  const rec  = getRecommendation(
    { merchantId: result.id, merchant, estimatedAmount: 50 },
    enabledCards, bonuses, redemptionStyle,
  );
  const dist = result.distance != null ? distanceLabel(result.distance) : null;

  return (
    <button
      onClick={() => onTap(rec, result)}
      className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 active:scale-[0.98] transition-all text-left"
    >
      <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
        {result.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm leading-tight truncate">{result.name}</p>
        {result.address && (
          <p className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
            <MapPin size={9} className="flex-shrink-0 text-gray-300"/>
            {result.address}
          </p>
        )}
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          <span className="text-[11px] text-gray-400">{CATEGORY_LABEL[result.category]}</span>
          {dist && (
            <span className={`text-[11px] font-semibold ${dist.mode === 'drive' ? 'text-sky-500' : 'text-emerald-500'}`}>
              · {dist.mode === 'drive' ? '🚗' : '🚶'} {dist.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        <div className={`w-10 h-6 rounded-md bg-gradient-to-br ${rec.best.card.gradient} shadow-sm`}/>
        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
          rec.isHighValue ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {rec.isHighValue && <Zap size={8}/>}
          {rec.best.effectiveCPD.toFixed(1)}¢/$
        </div>
        <p className="text-[10px] text-gray-400 max-w-[72px] truncate text-right">
          {rec.best.card.shortName}
        </p>
      </div>
    </button>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 animate-pulse">
      <div className="w-11 h-11 bg-gray-100 rounded-xl flex-shrink-0"/>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 rounded-full w-2/3"/>
        <div className="h-2.5 bg-gray-100 rounded-full w-1/2"/>
        <div className="h-2 bg-gray-100 rounded-full w-1/3"/>
      </div>
      <div className="flex-shrink-0 space-y-1.5 items-end flex flex-col">
        <div className="w-10 h-6 bg-gray-100 rounded-md"/>
        <div className="w-12 h-4 bg-gray-100 rounded-full"/>
      </div>
    </div>
  );
}

// ── Recent row ────────────────────────────────────────────────────────────────

function RecentRow({ item, onTap }: { item: RecentSearch; onTap: (item: RecentSearch) => void }) {
  return (
    <button
      onClick={() => onTap(item)}
      className="w-full flex items-center gap-3 px-3.5 py-3 bg-white rounded-2xl border border-gray-100 hover:border-indigo-100 hover:shadow-sm active:scale-[0.98] transition-all text-left"
    >
      <div className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-base flex-shrink-0">
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
        <p className="text-[11px] text-gray-400 truncate">
          {item.address ?? CATEGORY_LABEL[item.category]}
        </p>
      </div>
      <Clock size={12} className="text-gray-300 flex-shrink-0"/>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const { enabledCards, addToHistory, state } = useApp();
  const [query,           setQuery]           = useState('');
  const [results,         setResults]         = useState<SearchResult[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [activeRec,       setActiveRec]       = useState<Recommendation | null>(null);
  const [activeCategory,  setActiveCategory]  = useState<Category | null>(null);
  const [userCoords,      setUserCoords]      = useState<{ lat: number; lon: number } | null>(null);
  const [recentSearches,  setRecentSearches]  = useState<RecentSearch[]>([]);
  const [noNearby,        setNoNearby]        = useState(false);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIdRef  = useRef(0);
  const inputRef     = useRef<HTMLInputElement>(null);

  useEffect(() => { setRecentSearches(loadRecents()); }, []);

  // Resolve location
  useEffect(() => {
    if (state.manualLocation) {
      setUserCoords({ lat: state.manualLocation.lat, lon: state.manualLocation.lon });
      return;
    }
    if (state.locationSettings.enabled && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => {},
        { timeout: 6_000, maximumAge: 120_000 },
      );
    }
  }, [state.manualLocation, state.locationSettings.enabled]);

  // ── Search logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim();

    if (!q && !activeCategory) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      searchIdRef.current++;
      setResults([]);
      setNoNearby(false);
            setLoading(false);
      return;
    }

    // Phase 1: local DB — instant
    const local: SearchResult[] = ALL_MERCHANTS
      .filter(m => {
        const matchesQ   = !q || m.name.toLowerCase().includes(q.toLowerCase());
        const matchesCat = !activeCategory || m.category === activeCategory;
        return matchesQ && matchesCat;
      })
      .slice(0, 5)
      .map(m => ({ id: m.id, name: m.displayName, category: m.category, emoji: m.emoji, source: 'local' as const }));

    // Category chips: local filter only
    if (activeCategory && !q) {
      setResults(local);
      return;
    }

    // Typed query: show local instantly, then fire async
    setResults(local);
    setNoNearby(false);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const sid = ++searchIdRef.current;
    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        let apiResults: SearchResult[] = [];

        if (userCoords) {
          try {
            // Try Overpass first — fast, true proximity
            const places = await searchNearbyByName(q, userCoords.lat, userCoords.lon);
            apiResults = places.map(p => ({
              id: p.id, name: p.name, category: p.category,
              emoji: CATEGORY_EMOJI[p.category], source: 'osm' as const,
              distance: p.distance, address: p.address,
            }));
          } catch {
            // Overpass down → fall back to location-biased Nominatim
            apiResults = await searchNominatim(q, userCoords);
          }
        } else {
          // No location → Nominatim US-wide
          apiResults = await searchNominatim(q);
        }

        if (searchIdRef.current !== sid) return;
        const seen    = new Set(local.map(r => r.name.toLowerCase()));
        const deduped = apiResults.filter(r => !seen.has(r.name.toLowerCase()));
        // Nearby (with distance) first, then local DB matches
        const withDist    = deduped.filter(r => r.distance != null);
        const withoutDist = deduped.filter(r => r.distance == null);
        setResults([...withDist, ...local, ...withoutDist]);
        setNoNearby(withDist.length === 0 && local.length === 0 && withoutDist.length === 0);
      } catch {
        if (searchIdRef.current !== sid) return;
        setResults(local);
        setNoNearby(local.length === 0);
      } finally {
        if (searchIdRef.current === sid) setLoading(false);
      }
    }, 350);

    return () => {
      searchIdRef.current++;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setLoading(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeCategory, userCoords]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleTap(rec: Recommendation, result: SearchResult) {
    addToHistory(rec);
    setActiveRec(rec);
    saveRecent(result);
    setRecentSearches(loadRecents());
  }

  function handleRecentTap(item: RecentSearch) {
    if (enabledCards.length === 0) return;
    const merchant: Merchant = {
      id: item.id, name: item.name, displayName: item.name,
      category: item.category, emoji: item.emoji,
      scenarioLabel: CATEGORY_LABEL[item.category],
    };
    try {
      const rec = getRecommendation(
        { merchantId: item.id, merchant, estimatedAmount: 50 },
        enabledCards, state.bonuses, state.redemptionStyle,
      );
      addToHistory(rec);
      setActiveRec(rec);
    } catch { /* no-op */ }
  }

  function handleCategoryTap(cat: Category) {
    setActiveCategory(prev => prev === cat ? null : cat);
    setQuery('');
  }

  function clearSearch() {
    setQuery('');
    setActiveCategory(null);
    setResults([]);
    setNoNearby(false);
        setLoading(false);
    inputRef.current?.focus();
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const locationLabel  = state.manualLocation?.label ?? (userCoords ? 'Near you' : null);
  const isSearching    = !!query.trim() || !!activeCategory;
  const hasResults     = results.length > 0;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 pt-14 pb-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-2xl font-black">Search</h1>
          {locationLabel && (
            <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              <span className="text-white text-[11px] font-semibold truncate max-w-[100px]">
                {locationLabel}
              </span>
            </div>
          )}
        </div>
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveCategory(null); }}
            placeholder={locationLabel ? `Search near ${locationLabel}…` : 'Search any business…'}
            className="w-full bg-white rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none shadow-sm"
          />
          {loading && !query && (
            <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin"/>
          )}
          {(query || activeCategory) && (
            <button onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <X size={13}/>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-5 -mx-4 px-4">
          {QUICK_CATEGORIES.map(({ category, label, emoji }) => (
            <button key={category} onClick={() => handleCategoryTap(category)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
                activeCategory === category
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}>
              <span>{emoji}</span>{label}
            </button>
          ))}
        </div>

        {enabledCards.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">No cards enabled.</p>
            <p className="text-gray-400 text-xs mt-1">Go to Wallet to activate cards first.</p>
          </div>
        )}

        {/* ── SEARCH RESULTS ──────────────────────────────────────────────── */}
        {isSearching && enabledCards.length > 0 && (
          <div className="space-y-3">
            {/* Status row */}
            <div className="flex items-center justify-between px-1 min-h-[18px]">
              <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400">
                {activeCategory && !query
                  ? `${CATEGORY_LABEL[activeCategory]} ${locationLabel ? `near ${locationLabel}` : ''}`
                  : hasResults
                    ? `${results.length} result${results.length !== 1 ? 's' : ''}${locationLabel ? ` near ${locationLabel}` : ''}`
                    : noNearby
                      ? `None near ${locationLabel ?? 'you'}`
                      : 'Searching…'
                }
              </p>
              {loading && (
                <div className="flex items-center gap-1">
                  <Loader2 size={10} className="text-indigo-400 animate-spin"/>
                  <span className="text-[10px] text-indigo-400">Searching nearby…</span>
                </div>
              )}
            </div>

            {/* Skeleton while loading and no local results yet */}
            {loading && !hasResults && (
              <>
                <SkeletonCard/>
                <SkeletonCard/>
                <SkeletonCard/>
              </>
            )}

            {results.map(r => (
              <ResultCard
                key={r.id} result={r} onTap={handleTap}
                enabledCards={enabledCards} bonuses={state.bonuses} redemptionStyle={state.redemptionStyle}
              />
            ))}

            {noNearby && !hasResults && !loading && (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-gray-500 text-sm font-medium">No results found</p>
                <p className="text-gray-400 text-xs mt-1">Try a different name or spelling</p>
              </div>
            )}
          </div>
        )}

        {/* ── DEFAULT STATE ─────────────────────────────────────────────────── */}
        {!isSearching && enabledCards.length > 0 && (
          <div className="space-y-5">
            {recentSearches.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 px-1 mb-2">Recent</p>
                <div className="space-y-2">
                  {recentSearches.map(item => (
                    <RecentRow key={`${item.id}-${item.timestamp}`} item={item} onTap={handleRecentTap}/>
                  ))}
                </div>
              </div>
            )}
            <div className={`text-center px-6 ${recentSearches.length > 0 ? 'py-4' : 'py-12'}`}>
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-600 font-semibold text-sm">Search any business</p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                {locationLabel
                  ? `Nearest locations appear first with the best card to use there.`
                  : 'Type a business name to find the best card.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <RecommendationModal recommendation={activeRec} onClose={() => setActiveRec(null)}/>
      <BottomNav/>
    </div>
  );
}
