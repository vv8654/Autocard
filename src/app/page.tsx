'use client';

import { useMemo, useState, useEffect } from 'react';
import { Bell, ChevronRight, Zap, X, MapPin, Loader2, Navigation } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MERCHANTS, DASHBOARD_SCENARIO_IDS } from '../data/merchants';
import { buildContext, getRecommendation } from '../lib/recommendation';
import { sendBrowserNotification, distanceLabel, WALK_THRESHOLD_M, reverseGeocode } from '../lib/location';
import { useNearbyPlaces } from '../hooks/useNearbyPlaces';
import { RecommendationModal } from '../components/RecommendationModal';
import { BottomNav } from '../components/BottomNav';
import { RotatingCategoryBanner } from '../components/RotatingCategoryBanner';
import { LocationPicker } from '../components/LocationPicker';
import { Bonus, CreditCard, Merchant, NearbyPlace, Recommendation, RedemptionStyle } from '../types';
import { rewardLabel, earnedDollars } from '../lib/displayReward';
import { estimateAmount } from '../lib/estimateAmount';
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

const CAT_EMOJI: Record<string, string> = {
  dining: '🍽️', grocery: '🛒', gas: '⛽', travel: '✈️',
  transit: '🚗', pharmacy: '💊', streaming: '🎬', online: '📦', general: '🏪',
};

// ── Nearby place row ──────────────────────────────────────────────────────────

function NearbyPlaceRow({
  place, onTap, enabledCards, bonuses, redemptionStyle,
}: {
  place: NearbyPlace;
  onTap: (place: NearbyPlace) => void;
  enabledCards: CreditCard[];
  bonuses: Bonus[];
  redemptionStyle: RedemptionStyle;
}) {
  const rec = (() => {
    if (enabledCards.length === 0) return null;
    const merchant: Merchant = {
      id: place.id, name: place.name, displayName: place.name,
      category: place.category, emoji: CAT_EMOJI[place.category] ?? '🏪',
      scenarioLabel: place.category,
    };
    try {
      return getRecommendation(
        { merchantId: place.id, merchant, estimatedAmount: estimateAmount(place.category, place.name) },
        enabledCards, bonuses, redemptionStyle,
      );
    } catch { return null; }
  })();

  const { label: distLbl, mode } = distanceLabel(place.distance ?? 0);

  return (
    <button
      onClick={() => onTap(place)}
      className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 active:scale-[0.98] transition-all text-left"
    >
      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
        {CAT_EMOJI[place.category] ?? '🏪'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-sm truncate">{place.name}</p>
        {place.address && (
          <p className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
            <MapPin size={9} className="flex-shrink-0 text-gray-300"/>
            {place.address}
          </p>
        )}
        <p className="text-xs text-gray-400 capitalize mt-0.5">
          {place.category}
          <span className={`ml-1.5 font-medium ${mode === 'drive' ? 'text-sky-500' : 'text-emerald-500'}`}>
            · {mode === 'drive' ? '🚗' : '🚶'} {distLbl}
          </span>
        </p>
      </div>
      {rec ? (
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <div className={`w-10 h-6 rounded-md bg-gradient-to-br ${rec.best.card.gradient} shadow-sm`}/>
          <p className={`text-[11px] font-bold ${rec.isHighValue ? 'text-green-600' : 'text-gray-700'}`}>
            {earnedDollars(rec.best.effectiveCPD, rec.context.estimatedAmount)} back
          </p>
          <p className="text-[10px] text-gray-400">
            on ${rec.context.estimatedAmount}
          </p>
        </div>
      ) : (
        <ChevronRight size={14} className="text-gray-300 flex-shrink-0"/>
      )}
    </button>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 animate-pulse">
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex-shrink-0"/>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-100 rounded-full w-2/3"/>
        <div className="h-2.5 bg-gray-100 rounded-full w-1/2"/>
        <div className="h-2 bg-gray-100 rounded-full w-1/3"/>
      </div>
      <div className="flex-shrink-0 space-y-1.5 flex flex-col items-end">
        <div className="w-10 h-6 bg-gray-100 rounded-md"/>
        <div className="w-12 h-4 bg-gray-100 rounded-full"/>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { enabledCards, addToHistory, state, setManualLocation } = useApp();
  const [activeRec,          setActiveRec]          = useState<Recommendation | null>(null);
  const [showNotifications,  setShowNotifications]  = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const manualCoords = state.manualLocation
    ? { lat: state.manualLocation.lat, lon: state.manualLocation.lon }
    : undefined;

  const nearbyActive = state.locationSettings.enabled || !!state.manualLocation;

  const {
    places, loading: nearbyLoading, error: nearbyError,
    apiError: nearbyApiError, searched: nearbySearched, gpsCoords,
  } = useNearbyPlaces(nearbyActive, manualCoords);

  // Reverse-geocode GPS to short label
  const [gpsLabel, setGpsLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!gpsCoords || state.manualLocation) return;
    reverseGeocode(gpsCoords.lat, gpsCoords.lon).then(label => {
      if (label) setGpsLabel(label);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gpsCoords ? Math.round(gpsCoords.lat * 10) / 10 : null,
    gpsCoords ? Math.round(gpsCoords.lon * 10) / 10 : null,
    !!state.manualLocation,
  ]);

  // Precompute static scenario previews (fallback when no location)
  const scenarioPreviews = useMemo(() => {
    if (enabledCards.length === 0) return {} as Record<string, { cpd: number; isHV: boolean; amount: number }>;
    const out: Record<string, { cpd: number; isHV: boolean; amount: number }> = {};
    for (const merchant of DASHBOARD_MERCHANTS) {
      const amt = estimateAmount(merchant.category, merchant.name);
      const ctx = buildContext(merchant.id, amt);
      if (!ctx) continue;
      try {
        const rec = getRecommendation(ctx, enabledCards, state.bonuses, state.redemptionStyle);
        out[merchant.id] = { cpd: rec.best.effectiveCPD, isHV: rec.isHighValue, amount: amt };
      } catch { /* skip */ }
    }
    return out;
  }, [enabledCards, state.bonuses, state.redemptionStyle]);

  // Browser notification on new high-value nearby place
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
      const rec = getRecommendation(ctx, enabledCards, state.bonuses, state.redemptionStyle);
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
    const merchant = DASHBOARD_MERCHANTS.find(m => m.id === merchantId);
    const amt = merchant ? estimateAmount(merchant.category, merchant.name) : 50;
    const ctx = buildContext(merchantId, amt);
    if (!ctx) return;
    try {
      const rec = getRecommendation(ctx, enabledCards, state.bonuses, state.redemptionStyle);
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
      const rec = getRecommendation(ctx, enabledCards, state.bonuses, state.redemptionStyle);
      setActiveRec(rec);
      addToHistory(rec);
    } catch { /* no-op */ }
  }

  const latestRec    = state.history[0];
  const locationLabel = state.manualLocation?.label ?? gpsLabel ?? (nearbyActive ? 'Near you' : null);
  const showNearby   = nearbyActive;
  const maxDist      = places.length > 0 ? Math.max(...places.map(p => p.distance ?? 0)) : 0;
  const isDriving    = maxDist >= WALK_THRESHOLD_M;

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
            {/* Location pill */}
            <button
              onClick={() => setShowLocationPicker(true)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:bg-white/30 rounded-full px-3 py-1.5 transition-colors"
            >
              {state.manualLocation ? (
                <>
                  <Navigation size={10} className="text-sky-300"/>
                  <span className="text-sky-300 text-[11px] font-semibold max-w-[90px] truncate">
                    {state.manualLocation.label}
                  </span>
                </>
              ) : nearbyActive ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                  <span className="text-emerald-300 text-[11px] font-semibold max-w-[90px] truncate">
                    {gpsLabel ?? 'Live'}
                  </span>
                </>
              ) : (
                <>
                  <MapPin size={10} className="text-indigo-300"/>
                  <span className="text-indigo-300 text-[11px] font-semibold">Set location</span>
                </>
              )}
            </button>

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

      {/* ── Notifications Drawer ──────────────────────────────────────────── */}
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
                <p className="text-gray-300 text-xs mt-1">Tap a business below to get started</p>
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
                        {rec.best.card.shortName} · {rewardLabel(rec.best.card.rewardsType, rec.best.multiplier)}
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

      {/* ── Rotating Category Countdown ───────────────────────────────────── */}
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

      {/* ── Main Section ──────────────────────────────────────────────────── */}
      <div className="px-4 mt-6">

        {enabledCards.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-4xl mb-3">🃏</p>
            <p className="text-gray-500 text-sm font-medium">No cards enabled</p>
            <Link href="/wallet" className="inline-block mt-3 text-indigo-600 text-sm font-semibold hover:underline">
              Enable cards in your Wallet →
            </Link>
          </div>
        ) : showNearby ? (
          /* ── NEARBY MODE ─────────────────────────────────────────────── */
          <div>
            {/* Section header */}
            <div className="flex items-center justify-between mb-4 px-0.5">
              <div>
                <div className="flex items-center gap-1.5">
                  {isDriving
                    ? <MapPin size={13} className="text-sky-500"/>
                    : <MapPin size={13} className="text-emerald-500"/>
                  }
                  <h2 className="text-xl font-black text-gray-900">
                    {locationLabel ? `Near ${locationLabel}` : 'Nearby'}
                  </h2>
                </div>
                <p className="text-gray-400 text-xs mt-0.5 pl-0.5">
                  {nearbyLoading
                    ? 'Finding businesses…'
                    : places.length > 0
                      ? `${places.length} places · tap for best card`
                      : nearbySearched
                        ? 'No businesses found nearby'
                        : 'Locating…'
                  }
                </p>
              </div>
              {places.length > 0 && (
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                  isDriving ? 'bg-sky-50 text-sky-500' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {isDriving ? `up to ${distanceLabel(maxDist).label}` : 'walking distance'}
                </span>
              )}
            </div>

            {/* Loading skeletons */}
            {nearbyLoading && places.length === 0 && (
              <div className="space-y-3">
                <SkeletonCard/>
                <SkeletonCard/>
                <SkeletonCard/>
                <SkeletonCard/>
              </div>
            )}

            {/* API error */}
            {nearbyApiError && (
              <div className="text-center py-8 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-2xl mb-2">📡</p>
                <p className="text-gray-500 text-sm font-medium">Business data unavailable</p>
                <p className="text-gray-400 text-xs mt-1">Check your connection and try again</p>
              </div>
            )}

            {/* Error */}
            {nearbyError && (
              <div className="py-4 px-4 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-xs text-amber-600">{nearbyError}</p>
              </div>
            )}

            {/* Nearby results */}
            {places.length > 0 && (
              <div className="space-y-3">
                {places.map(place => (
                  <NearbyPlaceRow
                    key={place.id}
                    place={place}
                    onTap={handleNearbyTap}
                    enabledCards={enabledCards}
                    bonuses={state.bonuses}
                    redemptionStyle={state.redemptionStyle}
                  />
                ))}
              </div>
            )}

            {/* Fallback: show static scenarios if nothing loaded yet */}
            {!nearbyLoading && places.length === 0 && nearbySearched && !nearbyApiError && (
              <div>
                <p className="text-[11px] uppercase tracking-widest font-bold text-gray-400 px-0.5 mb-3">
                  Quick scenarios
                </p>
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
                        {preview && (
                          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            preview.isHV ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {preview.isHV && <Zap size={10}/>}
                            {earnedDollars(preview.cpd, preview.amount)} back
                          </div>
                        )}
                        <ChevronRight size={16} className="text-gray-300 flex-shrink-0"/>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── STATIC SCENARIO MODE (no location) ──────────────────────── */
          <div>
            <div className="mb-5">
              <h2 className="text-xl font-black text-gray-900">Where are you?</h2>
              <p className="text-gray-500 text-sm mt-0.5">Tap to get your best card instantly</p>
            </div>
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
                          {earnedDollars(preview.cpd, preview.amount)} back
                        </div>
                      )}
                      <ChevronRight size={16} className="text-gray-300"/>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Location CTA */}
            <div className="flex gap-2 mt-4">
              <Link href="/settings"
                className="flex-1 flex items-center gap-3 p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50/40 transition-all">
                <MapPin size={18} className="text-gray-400"/>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600">Enable GPS detection</p>
                  <p className="text-xs text-gray-400">See what&apos;s around you</p>
                </div>
              </Link>
              <button
                onClick={() => setShowLocationPicker(true)}
                className="flex items-center gap-2 px-4 py-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl hover:border-sky-300 hover:bg-sky-50/40 transition-all"
              >
                <Navigation size={16} className="text-gray-400"/>
                <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">Pin location</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <RecommendationModal recommendation={activeRec} onClose={() => setActiveRec(null)}/>

      {showLocationPicker && (
        <LocationPicker
          current={state.manualLocation}
          onSelect={loc => setManualLocation(loc)}
          onClear={() => setManualLocation(null)}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      <BottomNav/>
    </div>
  );
}
