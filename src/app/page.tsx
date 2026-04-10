'use client';

import { useMemo, useState } from 'react';
import { Bell, ChevronRight, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MERCHANTS, DASHBOARD_SCENARIO_IDS } from '../data/merchants';
import { buildContext, getRecommendation } from '../lib/recommendation';
import { RecommendationModal } from '../components/RecommendationModal';
import { BottomNav } from '../components/BottomNav';
import { Recommendation } from '../types';
import Link from 'next/link';

// Precompute the list of dashboard merchants (stable — based on constants)
const DASHBOARD_MERCHANTS = DASHBOARD_SCENARIO_IDS
  .map(id => MERCHANTS.find(m => m.id === id))
  .filter((m): m is NonNullable<typeof m> => m !== undefined);

export default function HomePage() {
  const { enabledCards, addToHistory, state } = useApp();
  const [activeRec, setActiveRec] = useState<Recommendation | null>(null);

  /**
   * Iteration 1 — Preview earn rate badges on scenario buttons.
   * Before: Buttons showed no data — users had to tap to see any value signal.
   * After:  Each button shows the best CPD for that context before tapping,
   *         so high-value moments are immediately visible.
   */
  const scenarioPreviews = useMemo(() => {
    if (enabledCards.length === 0) return {} as Record<string, { cpd: number; isHV: boolean }>;
    const out: Record<string, { cpd: number; isHV: boolean }> = {};
    for (const merchant of DASHBOARD_MERCHANTS) {
      const ctx = buildContext(merchant.id);
      if (!ctx) continue;
      try {
        const rec = getRecommendation(ctx, enabledCards);
        out[merchant.id] = { cpd: rec.best.effectiveCPD, isHV: rec.isHighValue };
      } catch {
        // skip
      }
    }
    return out;
  }, [enabledCards]);

  function handleScenario(merchantId: string) {
    if (enabledCards.length === 0) return;
    const ctx = buildContext(merchantId);
    if (!ctx) return;
    try {
      const rec = getRecommendation(ctx, enabledCards);
      setActiveRec(rec);
      addToHistory(rec);
    } catch {
      // no-op
    }
  }

  const latestRec = state.history[0];

  return (
    <div className="pb-24">
      {/* ── Header / Hero ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-5 pt-14 pb-7">
        {/* App bar */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <h1 className="text-white text-3xl font-black tracking-tight leading-none">
              AutoCard
            </h1>
            <p className="text-indigo-200 text-sm mt-1">Right card. Right moment.</p>
          </div>
          <div className="relative">
            <Bell size={22} className="text-indigo-200" />
            {latestRec && (
              <span className="absolute -top-1 -right-0.5 w-2.5 h-2.5 bg-rose-400 rounded-full ring-2 ring-indigo-700" />
            )}
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
                <div
                  key={card.id}
                  className={`flex-shrink-0 bg-gradient-to-br ${card.gradient} rounded-2xl px-3.5 py-2.5 w-32 shadow-md`}
                >
                  <p className="text-white/60 text-[10px] font-mono tracking-widest">
                    •••• {card.lastFour}
                  </p>
                  <p className="text-white text-xs font-bold mt-1 leading-tight">
                    {card.shortName}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Link
              href="/wallet"
              className="block text-center py-3 bg-white/10 rounded-2xl border border-white/20 text-indigo-200 text-sm hover:bg-white/20 transition-colors"
            >
              + Add cards to your wallet
            </Link>
          )}
        </div>
      </div>

      {/* ── Latest Tip Banner ───────────────────────────────────────────── */}
      {latestRec && (
        <div className="mx-4 mt-4">
          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100">
            <div
              className={`w-10 h-10 flex-shrink-0 rounded-xl bg-gradient-to-br ${latestRec.best.card.gradient}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-indigo-400">
                Latest tip
              </p>
              <p className="text-sm text-gray-800 font-medium mt-0.5 leading-snug">
                {latestRec.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Scenario Section ────────────────────────────────────────────── */}
      <div className="px-4 mt-6">
        <div className="mb-5">
          <h2 className="text-xl font-black text-gray-900">Where are you?</h2>
          <p className="text-gray-500 text-sm mt-0.5">Tap to get your best card instantly</p>
        </div>

        {enabledCards.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-4xl mb-3">🃏</p>
            <p className="text-gray-500 text-sm font-medium">No cards enabled</p>
            <Link
              href="/wallet"
              className="inline-block mt-3 text-indigo-600 text-sm font-semibold hover:underline"
            >
              Enable cards in your Wallet →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {DASHBOARD_MERCHANTS.map(merchant => {
              const preview = scenarioPreviews[merchant.id];
              return (
                <button
                  key={merchant.id}
                  onClick={() => handleScenario(merchant.id)}
                  className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 active:scale-[0.98] transition-all"
                >
                  {/* Merchant icon */}
                  <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {merchant.emoji}
                  </div>

                  {/* Merchant info */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-gray-900">{merchant.displayName}</p>
                    <p className="text-sm text-gray-500">{merchant.scenarioLabel}</p>
                  </div>

                  {/* Iteration 1: Preview badge — earn rate before you tap */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {preview && (
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        preview.isHV
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {preview.isHV && <Zap size={10} />}
                        {preview.cpd.toFixed(1)}¢/$
                      </div>
                    )}
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Recommendation Modal */}
      <RecommendationModal
        recommendation={activeRec}
        onClose={() => setActiveRec(null)}
      />

      <BottomNav />
    </div>
  );
}
