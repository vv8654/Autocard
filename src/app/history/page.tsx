'use client';

import { Trash2, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BottomNav } from '../../components/BottomNav';
import { Recommendation } from '../../types';

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function HistoryItem({ rec }: { rec: Recommendation }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-3.5 px-4 pt-4 pb-2">
        {/* Card color swatch */}
        <div
          className={`w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br ${rec.best.card.gradient}`}
        />

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">
              {rec.context.merchant.emoji} {rec.context.merchant.displayName}
            </span>
            {rec.isHighValue && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                <Zap size={9} />
                High Value
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {rec.best.card.shortName} · {rec.best.multiplier}x · {rec.best.effectiveCPD.toFixed(1)}¢/dollar
          </p>
        </div>

        <p className="text-xs text-gray-400 flex-shrink-0">{timeAgo(rec.timestamp)}</p>
      </div>

      {/* Explanation */}
      <p className="text-xs text-gray-500 px-4 pb-3.5 leading-relaxed">
        {rec.explanation}
      </p>
    </div>
  );
}

export default function HistoryPage() {
  const { state, clearHistory } = useApp();
  const { history } = state;

  // Group into "today" vs "earlier"
  const todayStr = new Date().toDateString();
  const todayRecs = history.filter(r => new Date(r.timestamp).toDateString() === todayStr);
  const earlierRecs = history.filter(r => new Date(r.timestamp).toDateString() !== todayStr);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-5 pt-14 pb-7">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-white text-2xl font-black">History</h1>
            <p className="text-indigo-200 text-sm mt-1">
              {history.length} recommendation{history.length !== 1 ? 's' : ''}
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1.5 text-indigo-300 hover:text-white text-xs font-medium transition-colors mb-0.5"
            >
              <Trash2 size={13} />
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-5">
        {history.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-4">
              🎯
            </div>
            <p className="text-gray-700 font-semibold">No history yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Tap a scenario on the Home screen to get your first recommendation
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {todayRecs.length > 0 && (
              <section>
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
                  Today
                </h3>
                <div className="space-y-3">
                  {todayRecs.map(rec => (
                    <HistoryItem key={rec.id} rec={rec} />
                  ))}
                </div>
              </section>
            )}
            {earlierRecs.length > 0 && (
              <section>
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
                  Earlier
                </h3>
                <div className="space-y-3">
                  {earlierRecs.map(rec => (
                    <HistoryItem key={rec.id} rec={rec} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
