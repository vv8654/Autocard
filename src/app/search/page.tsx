'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Zap, Loader2, MapPin, Clock, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ALL_MERCHANTS } from '../../data/allMerchants';
import { detectCategoryFromName } from '../../lib/categoryDetect';
import { getRecommendation } from '../../lib/recommendation';
import { searchNearbyByName, distanceLabel } from '../../lib/location';
import { RecommendationModal } from '../../components/RecommendationModal';
import { BottomNav } from '../../components/BottomNav';
import { Category, Merchant, Recommendation } from '../../types';

// ── Types ────────────────────────────────────────────────────────────────────

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

const RECENT_KEY = 'autocard_recent_searches';

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

// ── Constants ────────────────────────────────────────────────────────────────

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

// ── Nominatim US-wide fallback (only used when no location is set) ────────────

interface NominatimHit {
  place_id: number;
  display_name: string;
  type: string;
  class: string;
  extratags?: Record<string, string>;
}

async function searchNominatim(query: string): Promise<SearchResult[]> {
  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}` +
    `&format=json&limit=6&addressdetails=1&extratags=1&countrycodes=us`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'AutoCard/1.0' } });
  if (!res.ok) return [];
  const hits: NominatimHit[] = await res.json();
  const TAG_MAP: Record<string, Category> = {
    restaurant: 'dining', cafe: 'dining', fast_food: 'dining', bar: 'dining', pub: 'dining',
    pharmacy: 'pharmacy', fuel: 'gas', supermarket: 'grocery', convenience: 'grocery',
    hotel: 'travel', hostel: 'travel',
  };
  return hits.filter(h => h.display_name).map(h => {
    const parts   = h.display_name.split(',');
    const name    = parts[0].trim();
    const address = parts.slice(1, 3).map(s => s.trim()).filter(Boolean).join(', ') || undefined;
    const amenity = h.extratags?.amenity ?? '';
    const shop    = h.extratags?.shop    ?? '';
    const cat: Category = TAG_MAP[amenity] ?? TAG_MAP[shop] ?? detectCategoryFromName(name);
    return { id: String(h.place_id), name, category: cat, emoji: CATEGORY_EMOJI[cat], source: 'osm' as const, address };
  });
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
  const rec = getRecommendation(
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
          <p className="text-[11px] text-gray-500 truncate mt-0.5">{result.address}</p>
        )}
        <div className="flex items-center gap-1.5 mt-1">
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

// ── Recent search row ─────────────────────────────────────────────────────────

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

// ── Page ─────────────────────────────────────────────────────────────────────

type ResultSource = 'nearby' | 'no-nearby' | 'api-down' | 'us-wide' | null;

export default function SearchPage() {
  const { enabledCards, addToHistory, state } = useApp();
  const [query,          setQuery]          = useState('');
  const [results,        setResults]        = useState<SearchResult[]>([]);
  const [nearbyLoading,  setNearbyLoading]  = useState(false);
  const [activeRec,      setActiveRec]      = useState<Recommendation | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [userCoords,     setUserCoords]     = useState<{ lat: number; lon: number } | null>(null);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [resultSource,   setResultSource]   = useState<ResultSource>(null);
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIdRef  = useRef(0);           // cancels stale async searches
  const inputRef     = useRef<HTMLInputElement>(null);

  useEffect(() => { setRecentSearches(loadRecents()); }, []);

  // Resolve location: manual pin > live GPS
  useEffect(() => {
    if (state.manualLocation) {
      setUserCoords({ lat: state.manualLocation.lat, lon: state.manualLocation.lon });
      return;
    }
    if (state.locationSettings.enabled && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => { /* silent */ },
        { timeout: 6_000, maximumAge: 120_000 },
      );
    }
  }, [state.manualLocation, state.locationSettings.enabled]);

  // ── Two-phase search ──────────────────────────────────────────────────────
  useEffect(() => {
    const q = query.trim();

    // Clear everything when input is empty
    if (!q && !activeCategory) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      searchIdRef.current++;
      setResults([]);
      setNearbyLoading(false);
      setResultSource(null);
      return;
    }

    // ── Phase 1: local DB results — synchronous, no delay ──────────────────
    const local: SearchResult[] = ALL_MERCHANTS
      .filter(m => {
        const matchesQ   = !q || m.name.toLowerCase().includes(q.toLowerCase());
        const matchesCat = !activeCategory || m.category === activeCategory;
        return matchesQ && matchesCat;
      })
      .slice(0, 5)
      .map(m => ({ id: m.id, name: m.displayName, category: m.category, emoji: m.emoji, source: 'local' as const }));

    setResults(local);
    setResultSource(null);

    // Category chips: no API calls needed — local filter is the full answer
    if (activeCategory || !q) return;

    // ── Phase 2: async API search (debounced) ─────────────────────────────
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const sid = ++searchIdRef.current;

    if (userCoords) {
      // Has location → Overpass proximity search only (NEVER fall back to Nominatim)
      setNearbyLoading(true);

      debounceRef.current = setTimeout(async () => {
        try {
          const places = await searchNearbyByName(q, userCoords.lat, userCoords.lon);
          if (searchIdRef.current !== sid) return;

          const seen   = new Set(local.map(r => r.name.toLowerCase()));
          const nearby: SearchResult[] = places
            .filter(p => !seen.has(p.name.toLowerCase()))
            .map(p => ({
              id: p.id, name: p.name, category: p.category,
              emoji: CATEGORY_EMOJI[p.category], source: 'osm' as const,
              distance: p.distance, address: p.address,
            }));

          // Nearby results first (sorted by distance), then local fallbacks
          setResults([...nearby, ...local]);
          setResultSource(nearby.length > 0 ? 'nearby' : 'no-nearby');
        } catch (err) {
          if (searchIdRef.current !== sid) return;
          const isApiDown = err instanceof Error && err.message === 'OVERPASS_UNAVAILABLE';
          setResultSource(isApiDown ? 'api-down' : 'no-nearby');
        } finally {
          if (searchIdRef.current === sid) setNearbyLoading(false);
        }
      }, 350);

    } else {
      // No location → Nominatim US-wide fallback (only when local results are sparse)
      if (local.length >= 3) return;

      debounceRef.current = setTimeout(async () => {
        try {
          const hits = await searchNominatim(q);
          if (searchIdRef.current !== sid) return;

          const seen   = new Set(local.map(r => r.name.toLowerCase()));
          const deduped = hits.filter(r => !seen.has(r.name.toLowerCase())).slice(0, 4);
          if (deduped.length > 0) {
            setResults([...local, ...deduped]);
            setResultSource('us-wide');
          }
        } catch { /* silent */ }
      }, 350);
    }

    return () => {
      searchIdRef.current++;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setNearbyLoading(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeCategory, userCoords]);

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
    setActiveCategory(prev => (prev === cat ? null : cat));
    setQuery('');
  }

  function clearSearch() {
    setQuery('');
    setActiveCategory(null);
    setResults([]);
    setResultSource(null);
    setNearbyLoading(false);
    inputRef.current?.focus();
  }

  const locationLabel = state.manualLocation?.label ?? (userCoords ? 'Near you' : null);
  const hasResults    = results.length > 0;
  const showEmpty     = !nearbyLoading && (query.trim() || activeCategory) && !hasResults;

  return (
    <div className="pb-24">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 pt-14 pb-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-2xl font-black">Search</h1>
          {locationLabel && (
            <div className="flex items-center gap-1 bg-white/10 rounded-full px-2.5 py-1">
              <MapPin size={10} className="text-emerald-300"/>
              <span className="text-emerald-300 text-[10px] font-semibold truncate max-w-[90px]">
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
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-5">
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

        {/* Empty state */}
        {showEmpty && resultSource !== 'api-down' && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-gray-500 text-sm font-medium">No results found</p>
            <p className="text-gray-400 text-xs mt-1">Try a different name or browse by category</p>
          </div>
        )}
        {showEmpty && resultSource === 'api-down' && (
          <div className="mx-auto mt-6 max-w-xs text-center px-4">
            <p className="text-2xl mb-2">📡</p>
            <p className="text-gray-600 text-sm font-semibold">Business data unavailable</p>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              Couldn&apos;t reach the location database right now. Check your connection and try again.
            </p>
          </div>
        )}

        {/* Results */}
        {hasResults && enabledCards.length > 0 && (
          <div className="space-y-3">
            {/* Context + nearby loading indicator */}
            <div className="flex items-center justify-between px-1 min-h-[18px]">
              <div className="flex items-center gap-1.5">
                {resultSource === 'nearby' && locationLabel ? (
                  <>
                    <MapPin size={10} className="text-emerald-500"/>
                    <p className="text-[11px] uppercase tracking-widest font-bold text-emerald-600">
                      Near {locationLabel}
                    </p>
                  </>
                ) : resultSource === 'no-nearby' && locationLabel ? (
                  <>
                    <MapPin size={10} className="text-amber-400"/>
                    <p className="text-[11px] font-semibold text-amber-500">
                      None found near {locationLabel} — showing general results
                    </p>
                  </>
                ) : resultSource === 'api-down' ? (
                  <>
                    <ChevronRight size={10} className="text-rose-400"/>
                    <p className="text-[11px] font-semibold text-rose-400">
                      Couldn&apos;t reach business data — showing general results
                    </p>
                  </>
                ) : resultSource === 'us-wide' ? (
                  <>
                    <ChevronRight size={10} className="text-gray-400"/>
                    <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400">
                      US results · pin a location for nearby
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400">
                    {results.length} result{results.length !== 1 ? 's' : ''}
                    {activeCategory ? ` · ${CATEGORY_LABEL[activeCategory]}` : ''}
                  </p>
                )}
              </div>
              {nearbyLoading && (
                <div className="flex items-center gap-1">
                  <Loader2 size={10} className="text-indigo-400 animate-spin"/>
                  <span className="text-[10px] text-indigo-400">Searching nearby…</span>
                </div>
              )}
            </div>

            {results.map(r => (
              <ResultCard
                key={r.id} result={r} onTap={handleTap}
                enabledCards={enabledCards} bonuses={state.bonuses} redemptionStyle={state.redemptionStyle}
              />
            ))}
          </div>
        )}

        {/* Default state */}
        {!query && !activeCategory && enabledCards.length > 0 && (
          <div>
            {recentSearches.length > 0 && (
              <div className="mb-6">
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
                  : "Type a business name — we'll tell you which card earns the most."}
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
