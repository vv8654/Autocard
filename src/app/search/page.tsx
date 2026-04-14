'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Zap, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ALL_MERCHANTS } from '../../data/allMerchants';
import { detectCategoryFromName } from '../../lib/categoryDetect';
import { buildContext, getRecommendation } from '../../lib/recommendation';
import { RecommendationModal } from '../../components/RecommendationModal';
import { BottomNav } from '../../components/BottomNav';
import { Category, Merchant, Recommendation } from '../../types';

// ── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  name: string;
  category: Category;
  emoji: string;
  scenarioLabel: string;
  source: 'local' | 'osm';
}

const CATEGORY_EMOJI: Record<Category, string> = {
  dining:    '🍽️',
  grocery:   '🛒',
  travel:    '✈️',
  transit:   '🚗',
  pharmacy:  '💊',
  streaming: '🎬',
  gas:       '⛽',
  online:    '📦',
  general:   '🏪',
};

const CATEGORY_LABEL: Record<Category, string> = {
  dining:    'Dining',
  grocery:   'Grocery',
  travel:    'Travel',
  transit:   'Transit',
  pharmacy:  'Pharmacy',
  streaming: 'Streaming',
  gas:       'Gas',
  online:    'Online',
  general:   'General',
};

// ── Quick-category browse ─────────────────────────────────────────────────────

const QUICK_CATEGORIES: { category: Category; label: string; emoji: string }[] = [
  { category: 'dining',    label: 'Dining',    emoji: '🍽️' },
  { category: 'grocery',   label: 'Grocery',   emoji: '🛒' },
  { category: 'travel',    label: 'Travel',    emoji: '✈️' },
  { category: 'transit',   label: 'Transit',   emoji: '🚗' },
  { category: 'gas',       label: 'Gas',       emoji: '⛽' },
  { category: 'pharmacy',  label: 'Pharmacy',  emoji: '💊' },
  { category: 'streaming', label: 'Streaming', emoji: '🎬' },
  { category: 'online',    label: 'Online',    emoji: '📦' },
];

// ── Nominatim search (OSM fallback for businesses not in local DB) ────────────

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
    `&format=json&limit=6&addressdetails=0&extratags=1`;

  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'AutoCard-Demo/1.0' },
  });
  if (!res.ok) return [];
  const hits: NominatimHit[] = await res.json();

  const TAG_MAP: Record<string, Category> = {
    restaurant: 'dining', cafe: 'dining', fast_food: 'dining', bar: 'dining', pub: 'dining',
    pharmacy: 'pharmacy', fuel: 'gas',
    supermarket: 'grocery', convenience: 'grocery',
    hotel: 'travel', hostel: 'travel',
  };

  return hits
    .filter(h => h.display_name)
    .map(h => {
      const name = h.display_name.split(',')[0];
      const amenity = h.extratags?.amenity ?? '';
      const shop    = h.extratags?.shop    ?? '';
      const cat: Category = TAG_MAP[amenity] ?? TAG_MAP[shop] ?? detectCategoryFromName(name);
      return {
        id:            String(h.place_id),
        name,
        category:      cat,
        emoji:         CATEGORY_EMOJI[cat],
        scenarioLabel: h.type || h.class,
        source:        'osm' as const,
      };
    });
}

// ── ResultRow ─────────────────────────────────────────────────────────────────

function ResultRow({
  result,
  onTap,
  enabledCards,
}: {
  result: SearchResult;
  onTap: (rec: Recommendation) => void;
  enabledCards: ReturnType<typeof useApp>['enabledCards'];
}) {
  if (enabledCards.length === 0) return null;

  // Build a synthetic merchant from search result
  const syntheticMerchant: Merchant = {
    id:            result.id,
    name:          result.name,
    displayName:   result.name,
    category:      result.category,
    emoji:         result.emoji,
    scenarioLabel: CATEGORY_LABEL[result.category],
  };
  const ctx = { merchantId: result.id, merchant: syntheticMerchant, estimatedAmount: 50 };
  const rec = getRecommendation(ctx, enabledCards);

  return (
    <button
      onClick={() => onTap(rec)}
      className="w-full flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 active:scale-[0.98] transition-all text-left"
    >
      {/* Emoji icon */}
      <div className="w-11 h-11 bg-gray-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
        {result.emoji}
      </div>

      {/* Name + category */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-gray-900 text-sm truncate">{result.name}</p>
          {result.source === 'osm' && (
            <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
              OSM
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">{CATEGORY_LABEL[result.category]}</p>
      </div>

      {/* Best card earn rate */}
      <div className="flex-shrink-0 text-right">
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
          rec.isHighValue ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {rec.isHighValue && <Zap size={9}/>}
          {rec.best.effectiveCPD.toFixed(1)}¢/$
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[80px]">
          {rec.best.card.shortName}
        </p>
      </div>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const { enabledCards, addToHistory } = useApp();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRec, setActiveRec] = useState<Recommendation | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  // ── Search logic ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();

    if (!q && !activeCategory) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      // 1. Local merchants match
      let local: SearchResult[] = ALL_MERCHANTS
        .filter(m => {
          const matchesQ = !q || m.name.toLowerCase().includes(q.toLowerCase());
          const matchesCat = !activeCategory || m.category === activeCategory;
          return matchesQ && matchesCat;
        })
        .slice(0, 8)
        .map(m => ({
          id:            m.id,
          name:          m.displayName,
          category:      m.category,
          emoji:         m.emoji,
          scenarioLabel: m.scenarioLabel,
          source:        'local' as const,
        }));

      // 2. If searching by text and not enough local results, hit Nominatim
      let osm: SearchResult[] = [];
      if (q && local.length < 4 && !activeCategory) {
        try { osm = await searchNominatim(q); } catch { /* ignore */ }
        // Deduplicate by name
        const localNames = new Set(local.map(r => r.name.toLowerCase()));
        osm = osm.filter(r => !localNames.has(r.name.toLowerCase())).slice(0, 4);
      }

      setResults([...local, ...osm]);
      setLoading(false);
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeCategory]);

  function handleTap(rec: Recommendation) {
    addToHistory(rec);
    setActiveRec(rec);
  }

  function handleCategoryTap(cat: Category) {
    setActiveCategory(prev => (prev === cat ? null : cat));
    setQuery('');
  }

  function clearSearch() {
    setQuery('');
    setActiveCategory(null);
    setResults([]);
    inputRef.current?.focus();
  }

  const hasResults = results.length > 0;
  const showEmpty  = !loading && (query.trim() || activeCategory) && !hasResults;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-4 pt-14 pb-5">
        <h1 className="text-white text-2xl font-black mb-4">Search</h1>

        {/* Search bar */}
        <div className="relative">
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveCategory(null); }}
            placeholder="Search any business…"
            className="w-full bg-white rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none shadow-sm"
          />
          {(query || activeCategory) && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-500"
            >
              <X size={13}/>
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Quick-category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-5">
          {QUICK_CATEGORIES.map(({ category, label, emoji }) => (
            <button
              key={category}
              onClick={() => handleCategoryTap(category)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
                activeCategory === category
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>

        {/* No enabled cards warning */}
        {enabledCards.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">No cards enabled.</p>
            <p className="text-gray-400 text-xs mt-1">Go to Wallet to activate cards first.</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-10 gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin"/>
            <span className="text-sm">Searching…</span>
          </div>
        )}

        {/* Empty state */}
        {showEmpty && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-gray-500 text-sm font-medium">No results found</p>
            <p className="text-gray-400 text-xs mt-1">Try a different name or category</p>
          </div>
        )}

        {/* Results */}
        {!loading && hasResults && enabledCards.length > 0 && (
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 px-1">
              {results.length} result{results.length !== 1 ? 's' : ''}
              {activeCategory ? ` in ${CATEGORY_LABEL[activeCategory]}` : ''}
            </p>
            {results.map(r => (
              <ResultRow key={r.id} result={r} onTap={handleTap} enabledCards={enabledCards}/>
            ))}
            {results.some(r => r.source === 'osm') && (
              <p className="text-[10px] text-gray-400 text-center pt-1">
                Some results from OpenStreetMap
              </p>
            )}
          </div>
        )}

        {/* Default state — no query, no category */}
        {!query && !activeCategory && !loading && (
          <div className="text-center py-12 px-6">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-600 font-semibold text-sm">Search any business</p>
            <p className="text-gray-400 text-xs mt-1 leading-relaxed">
              Type a merchant name like "Starbucks" or tap a category above to see which card earns the most.
            </p>
          </div>
        )}
      </div>

      <RecommendationModal recommendation={activeRec} onClose={() => setActiveRec(null)}/>
      <BottomNav/>
    </div>
  );
}
