'use client';

import { useMemo, useState, useEffect } from 'react';
import { Bell, ChevronRight, Zap, X, MapPin, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MERCHANTS, DASHBOARD_SCENARIO_IDS } from '../data/merchants';
import { buildContext, getRecommendation } from '../lib/recommendation';
import { sendBrowserNotification } from '../lib/location';
import { useNearbyPlaces } from '../hooks/useNearbyPlaces';
import { RecommendationModal } from '../components/RecommendationModal';
import { BottomNav } from '../components/BottomNav';
import { RotatingCategoryBanner } from '../components/RotatingCategoryBanner';
import { Merchant, NearbyPlace, Recommendation } from '../types';
import Link from 'next/link';

const DASHBOARD_MERCHANTS = DASHBOARD_SCENARIO_IDS
  .map(id => MERCHANTS.find(m => m.id === id))
  .filter((m): m is NonNullable<typeof m> => m !== undefined);

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Nearby alert banner ───────────────────────────────────────────────────────

function NearbyAlert({
  places,
  loading,
  error,
  onTap,
}: {
  places: NearbyPlace[];
  loading: boolean;
  error: string | null;
  onTap: (place: NearbyPlace) => void;
}) {
  const [dismissed, setDismissed] = useState<string | null>(null);
  const topPlace = places[0];

  if (loading) {
    return (
      <div className="mx-4 mt-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-2">
        <Loader2 size={14} className="text-blue-400 animate-spin flex-shrink-0"/>
        <p className="text-xs text-blue-600 font-medium">Scanning nearby businesses…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl">
        <p className="text-xs text-red-500">{error}</p>
      </div>
    );
  }

  if (!topPlace || topPlace.id === dismissed) return null;

  return (
    <div className="mx-4 mt-4">
      <button
        onClick={() => onTap(topPlace)}
        className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl text-left hover:shadow-md transition-all"
      >
        <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <MapPin size={16} className="text-emerald-600"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-600">📍 Nearby</p>
          <p className="text-sm font-bold text-gray-900 truncate">{topPlace.name}</p>
          <p className="text-xs text-gray-500 capitalize">{topPlace.category} · {topPlace.distance}m away · Tap for best card</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setDismissed(topPlace.id); }}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-emerald-100 text-gray-400 flex-shrink-0"
        >
          <X size={13}/>
        </button>
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { enabledCards, addToHistory, state } = useApp();
  const [activeRec,          setActiveRec]          = useState<Recommendation | null>(null);
  const [showNotifications,  setShowNotifications]  = useState(false);

  // Location-based nearby detection
  const { places, loading: nearbyLoading, error: nearbyError } = useNearbyPlaces(
    state.locationSettings.enabled,
  );

  // Precompute dashboard scenario previews
  const scenarioPreviews = useMemo(() => {
    if (enabledCards.length === 0) return {} as Record<string, { cpd: number; isHV: boolean }>;
    const out: Record<string, { cpd: number; isHV: boolean }> = {};
    for (const merchant of DASHBOARD_MERCHANTS) {
      const ctx = buildContext(merchant.id);
      if (!ctx) continue;
      try {
        const rec = getRecommendation(ctx, enabledCards);
        out[merchant.id] = { cpd: rec.best.effectiveCPD, isHV: rec.isHighValue };
      } catch { /* skip */ }
    }
    return out;
  }, [enabledCards]);

  // Fire a browser notification when a new high-value nearby place is detected
  const topPlace = places[0];
  useEffect(() => {
    if (!topPlace || enabledCards.length === 0) return;
    if (!state.locationSettings.browserNotifications) return;

    const syntheticMerchant: Merchant = {
      id: topPlace.id, name: topPlace.name, displayName: topPlace.name,
      category: topPlace.category, emoji: '📍', scenarioLabel: topPlace.category,
    };
    const ctx = { merchantId: topPlace.id, merchant: syntheticMerchant, estimatedAmount: 50 };
    try {
      const rec = getRecommendation(ctx, enabledCards);
      if (rec.isHighValue || state.notificationSettings.frequency === 'all') {
        sendBrowserNotification(
          `📍 ${topPlace.name} nearby`,
          `Use ${rec.best.card.shortName} — earns ${rec.best.effectiveCPD.toFixed(1)}¢ per dollar here.`,
        );
      }
    } catch { /* no cards */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topPlace?.id]);

  function handleScenario(merchantId: string) {
    if (enabledCards.length === 0) return;
    const ctx = buildContext(merchantId);
    if (!ctx) return;
    try {
      const rec = getRecommendation(ctx, enabledCards);
      setActiveRec(rec);
      addToHistory(rec);
    } catch { /* no-op */ }
  }

  function handleNearbyTap(place: NearbyPlace) {
    if (enabledCards.length === 0) return;
    const syntheticMerchant: Merchant = {
      id: place.id, name: place.name, displayName: place.name,
      category: place.category, emoji: '📍', scenarioLabel: place.category,
    };
    const ctx = { merchantId: place.id, merchant: syntheticMerchant, estimatedAmount: 50 };
    try {
      const rec = getRecommendation(ctx, enabledCards);
      setActiveRec(rec);
      addToHistory(rec);
    } catch { /* no-op */ }
  }

  const latestRec = state.history[0];

  return (
    <div className="pb-24">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-5 pt-14 pb-7">
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-white text-3xl font-black tracking-tight leading-none">AutoCard</h1>
            <p className="text-indigo-200 text-sm mt-1">Right card. Right moment.</p>
          </div>
          <div className="flex items-center gap-2">
            {state.locationSettings.enabled && (
              <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1">
                <MapPin size={11} className="text-emerald-300"/>
                <span className="text-emerald-300 text-[10px] font-semibold">Live</span>
              </div>
            )}
            <button
              onClick={() => setShowNotifications(prev => !prev)}
              className="relative p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={22} className={showNotifications ? 'text-white' : 'text-indigo-200'}/>
              {state.history.length > 0 && !showNotifications && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-400 rounded-full ring-2 ring-indigo-700"/>
              )}
            </button>
          </div>
        </div>

        {/* Active Cards Strip */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-indigo-200 text-[11px] uppercase tracking-widest font-semibold">
              Active Cards ({enabledCards.length})
            </p>
            <Link href="/wallet" className="text-indigo-300 text-xs hover:text-white transition-colors">
              Manage →
            </Link>
          </div>
          {enabledCards.length > 0 ? (
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
              {enabledCards.map(card => (
                <div key={card.id}
                  className={`flex-shrink-0 bg-gradient-to-br ${card.gradient} rounded-2xl px-3.5 py-2.5 w-32 shadow-md`}>
                  <p className="text-white/60 text-[10px] font-mono tracking-widest">•••• {card.lastFour}</p>
                  <p className="text-white text-xs font-bold mt-1 leading-tight">{card.shortName}</p>
                </div>
              ))}
            </div>
          ) : (
            <Link href="/wallet"
              className="block text-center py-3 bg-white/10 rounded-2xl border border-white/20 text-indigo-200 text-sm hover:bg-white/20 transition-colors">
              + Add cards to your wallet
            </Link>
          )}
        </div>
      </div>

      {/* ── Notifications Drawer ─────────────────────────────────────────── */}
      {showNotifications && (
        <div className="animate-fade-in">
          <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-indigo-500"/>
                <span className="text-sm font-bold text-gray-900">Recent Tips</span>
                {state.history.length > 0 && (
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                    {state.history.length}
                  </span>
                )}
              </div>
              <button onClick={() => setShowNotifications(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
                <X size={13}/>
              </button>
            </div>
            {state.history.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-400 text-sm">No tips yet</p>
                <p className="text-gray-300 text-xs mt-1">Tap a scenario below to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {state.history.slice(0, 8).map(rec => (
                  <button key={rec.id}
                    onClick={() => { setActiveRec(rec); setShowNotifications(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                    <div className={`w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br ${rec.best.card.gradient}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {rec.context.merchant.emoji} {rec.context.merchant.displayName}
                        </span>
                        {rec.isHighValue && <Zap size={10} className="text-amber-500 flex-shrink-0"/>}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {rec.best.card.shortName} · {rec.best.effectiveCPD.toFixed(1)}¢/$
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{timeAgo(rec.timestamp)}</span>
                  </button>
                ))}
              </div>
            )}
            {state.history.length > 0 && (
              <div className="border-t border-gray-100">
                <Link href="/insights" onClick={() => setShowNotifications(false)}
                  className="block text-center py-2.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition-colors">
                  View full history & simulator →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Nearby Alert (location-based) ────────────────────────────────── */}
      {state.locationSettings.enabled && (
        <NearbyAlert
          places={places}
          loading={nearbyLoading}
          error={nearbyError}
          onTap={handleNearbyTap}
        />
      )}

      {/* ── Rotating Category Countdown ──────────────────────────────────── */}
      <RotatingCategoryBanner/>

      {/* ── Latest Tip Banner ─────────────────────────────────────────────── */}
      {latestRec && !showNotifications && (
        <div className="mx-4 mt-4">
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100">
            <div className={`w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br ${latestRec.best.card.gradient}`}/>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-400">Latest tip</p>
              <p className="text-sm text-gray-800 font-medium mt-0.5 leading-snug">{latestRec.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Scenarios ─────────────────────────────────────────────────────── */}
      <div className="px-4 mt-6">
        <div className="mb-5">
          <h2 className="text-xl font-black text-gray-900">Where are you?</h2>
          <p className="text-gray-500 text-sm mt-0.5">Tap to get your best card instantly</p>
        </div>

        {enabledCards.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-4xl mb-3">🃏</p>
            <p className="text-gray-500 text-sm font-medium">No cards enabled</p>
            <Link href="/wallet" className="inline-block mt-3 text-indigo-600 text-sm font-semibold hover:underline">
              Enable cards in your Wallet →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {DASHBOARD_MERCHANTS.map(merchant => {
              const preview = scenarioPreviews[merchant.id];
              return (
                <button key={merchant.id} onClick={() => handleScenario(merchant.id)}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 active:scale-[0.98] transition-all">
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {merchant.emoji}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-gray-900">{merchant.displayName}</p>
                    <p className="text-sm text-gray-500">{merchant.scenarioLabel}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {preview && (
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        preview.isHV ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {preview.isHV && <Zap size={10}/>}
                        {preview.cpd.toFixed(1)}¢/$
                      </div>
                    )}
                    <ChevronRight size={16} className="text-gray-300"/>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Location CTA if not enabled */}
        {!state.locationSettings.enabled && (
          <Link href="/settings"
            className="flex items-center gap-3 mt-4 p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/40 transition-all">
            <MapPin size={18} className="text-gray-400"/>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600">Enable nearby detection</p>
              <p className="text-xs text-gray-400">Get proactive tips based on your real location</p>
            </div>
            <ChevronRight size={14} className="text-gray-300"/>
          </Link>
        )}
      </div>

      <RecommendationModal recommendation={activeRec} onClose={() => setActiveRec(null)}/>
      <BottomNav/>
    </div>
  );
}
