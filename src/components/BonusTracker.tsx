'use client';

import { Bonus } from '../types';
import { PRESET_BONUSES } from '../data/cards';

interface Props {
  cardId: string;
  bonus: Bonus | undefined;
  onActivate:        () => void;
  onDeactivate:      () => void;
  onAddSpend:        (amount: number) => void;
}

const QUICK_AMOUNTS = [50, 200, 500];

export function BonusTracker({ cardId, bonus, onActivate, onDeactivate, onAddSpend }: Props) {
  const preset = PRESET_BONUSES.find(p => p.cardId === cardId);

  // No preset bonus available for this card
  if (!preset) return null;

  // ── Inactive: show "Activate" prompt ────────────────────────────────────
  if (!bonus || !bonus.active) {
    return (
      <div className="mt-2.5 flex items-center justify-between gap-3 px-3.5 py-3 bg-violet-50 border border-violet-100 rounded-xl">
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">🎁</span>
          <div>
            <p className="text-xs font-bold text-violet-800">{preset.label}</p>
            <p className="text-[11px] text-violet-500">
              ${preset.totalValue} after ${preset.requiredSpend.toLocaleString()} spend
            </p>
          </div>
        </div>
        <button
          onClick={onActivate}
          className="flex-shrink-0 text-[11px] font-bold bg-violet-600 text-white px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
        >
          Track Bonus
        </button>
      </div>
    );
  }

  // ── Active: show progress ────────────────────────────────────────────────
  const progress   = Math.min(1, bonus.currentSpend / bonus.requiredSpend);
  const pct        = Math.round(progress * 100);
  const remaining  = Math.max(0, bonus.requiredSpend - bonus.currentSpend);
  const isComplete = remaining === 0;

  return (
    <div className={`mt-2.5 px-3.5 py-3 rounded-xl border ${
      isComplete
        ? 'bg-green-50 border-green-200'
        : 'bg-violet-50 border-violet-100'
    }`}>
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{isComplete ? '✅' : '🎯'}</span>
          <div>
            <p className={`text-xs font-bold ${isComplete ? 'text-green-700' : 'text-violet-800'}`}>
              {isComplete ? 'Bonus Earned!' : `$${bonus.totalValue} ${bonus.label}`}
            </p>
            {!isComplete && (
              <p className="text-[10px] text-violet-400">
                ${bonus.currentSpend.toLocaleString()} of ${bonus.requiredSpend.toLocaleString()} spent
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onDeactivate}
          className="text-[10px] font-semibold text-gray-400 hover:text-gray-600 transition-colors"
        >
          Remove
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/70 rounded-full overflow-hidden mb-1.5">
        <div
          className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-violet-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-[10px] font-semibold ${isComplete ? 'text-green-600' : 'text-violet-500'}`}>
          {isComplete ? 'Complete — great work!' : `$${remaining.toLocaleString()} remaining · ${pct}%`}
        </p>
      </div>

      {/* Quick-add spend buttons */}
      {!isComplete && (
        <div className="flex items-center gap-1.5 mt-2.5">
          <p className="text-[10px] text-gray-400 mr-0.5">Log spend:</p>
          {QUICK_AMOUNTS.map(amt => (
            <button
              key={amt}
              onClick={() => onAddSpend(amt)}
              className="text-[10px] font-bold text-violet-600 bg-white border border-violet-200 px-2 py-1 rounded-lg active:scale-95 transition-transform"
            >
              +${amt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
