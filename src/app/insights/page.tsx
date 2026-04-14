'use client';

import { useState, useMemo } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CARDS } from '../../data/cards';
import { simulateCard } from '../../lib/insights';
import { BottomNav } from '../../components/BottomNav';
import { CardArtwork } from '../../components/CardArtwork';

const CATEGORY_EMOJI: Record<string, string> = {
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

export default function InsightsPage() {
  const { state } = useApp();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const simulation = useMemo(() => {
    if (!selectedCardId) return null;
    return simulateCard(selectedCardId, state.history, CARDS);
  }, [selectedCardId, state.history]);

  const selectedCard = CARDS.find(c => c.id === selectedCardId);

  const hasHistory = state.history.length > 0;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-5 pt-14 pb-7">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={22} className="text-white"/>
          <h1 className="text-white text-2xl font-black">Insights</h1>
        </div>
        <p className="text-indigo-200 text-sm">
          Replay your history with any card to see what you would have earned.
        </p>
      </div>

      <div className="px-4 pt-5 space-y-6">

        {/* ── History summary strip ─────────────────────────────────────── */}
        <section>
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
            Your Purchase History
          </h2>
          {!hasHistory ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-gray-500 text-sm font-medium">No history yet</p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed px-6">
                Tap a scenario on the Home tab or search for a business to build your history first.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {state.history.slice(0, 20).map(rec => (
                <div
                  key={rec.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100"
                >
                  <span className="text-xl leading-none flex-shrink-0">
                    {CATEGORY_EMOJI[rec.context.merchant.category] ?? '🏪'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {rec.context.merchant.displayName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {rec.best.card.shortName} · {rec.best.effectiveCPD.toFixed(1)}¢/$
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    ${((rec.best.effectiveCPD / 100) * rec.context.estimatedAmount).toFixed(2)} earned
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Card selector ─────────────────────────────────────────────── */}
        {hasHistory && (
          <section>
            <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1">
              What If I Had…
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Select any card below to simulate your earnings
            </p>
            <div className="space-y-2.5">
              {CARDS.map(card => {
                const active = selectedCardId === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCardId(prev => prev === card.id ? null : card.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                      active
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    {/* Mini card gradient swatch */}
                    <div className={`flex-shrink-0 w-10 h-6 rounded-lg bg-gradient-to-br ${card.gradient}`}/>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${active ? 'text-indigo-800' : 'text-gray-900'}`}>
                        {card.shortName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{card.keyBenefit}</p>
                    </div>
                    {!state.enabledCardIds.includes(card.id) && (
                      <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        not in wallet
                      </span>
                    )}
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      active ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                    }`}>
                      {active && <div className="w-1.5 h-1.5 bg-white rounded-full"/>}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Simulation results ────────────────────────────────────────── */}
        {simulation && selectedCard && (
          <section>
            <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
              Simulation Results
            </h2>

            {/* Summary banner */}
            <div className={`p-4 rounded-2xl border mb-4 ${
              simulation.netDelta > 0
                ? 'bg-green-50 border-green-200'
                : simulation.netDelta < 0
                  ? 'bg-red-50 border-red-100'
                  : 'bg-gray-50 border-gray-100'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {simulation.netDelta > 0
                  ? <TrendingUp size={16} className="text-green-600 flex-shrink-0"/>
                  : simulation.netDelta < 0
                    ? <TrendingDown size={16} className="text-red-500 flex-shrink-0"/>
                    : <Minus size={16} className="text-gray-400 flex-shrink-0"/>
                }
                <p className={`text-sm font-black ${
                  simulation.netDelta > 0 ? 'text-green-700' : simulation.netDelta < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {simulation.netDelta > 0
                    ? `+$${simulation.netDelta.toFixed(2)} more with ${selectedCard.shortName}`
                    : simulation.netDelta < 0
                      ? `$${Math.abs(simulation.netDelta).toFixed(2)} less with ${selectedCard.shortName}`
                      : `Same earnings with ${selectedCard.shortName}`}
                </p>
              </div>
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Actual earned</p>
                  <p className="text-base font-black text-gray-800">${simulation.totalActualValue.toFixed(2)}</p>
                </div>
                <div className="w-px bg-gray-200"/>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">With {selectedCard.shortName}</p>
                  <p className={`text-base font-black ${
                    simulation.netDelta >= 0 ? 'text-green-700' : 'text-red-600'
                  }`}>${simulation.totalSimulatedValue.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Based on your last {simulation.rows.length} purchase{simulation.rows.length !== 1 ? 's' : ''} · $50 avg spend assumed
              </p>
            </div>

            {/* Per-row breakdown */}
            <div className="space-y-2">
              {simulation.rows.map((row, i) => {
                const delta = row.deltaPerDollar;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100"
                  >
                    <span className="text-lg leading-none flex-shrink-0">
                      {CATEGORY_EMOJI[row.recommendation.context.merchant.category] ?? '🏪'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {row.recommendation.context.merchant.displayName}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Actual: {row.actualCPD.toFixed(1)}¢/$ · Simulated: {row.simulatedCPD.toFixed(1)}¢/$
                      </p>
                    </div>
                    <div className={`text-xs font-bold flex-shrink-0 ${
                      delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {delta > 0 ? '+' : ''}{delta.toFixed(1)}¢/$
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty simulation prompt */}
        {hasHistory && !selectedCardId && (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">Select a card above to run the simulation</p>
          </div>
        )}

      </div>

      <BottomNav/>
    </div>
  );
}
