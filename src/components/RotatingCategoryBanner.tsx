'use client';

import { useApp } from '../context/AppContext';
import { getCurrentRotating } from '../lib/rotatingCategory';

const CATEGORY_EMOJI: Record<string, string> = {
  grocery: '🛒',
  gas:     '⛽',
  online:  '📦',
  dining:  '🍽️',
};

export function RotatingCategoryBanner() {
  const { state } = useApp();

  // Only show when Freedom Flex is enabled
  if (!state.enabledCardIds.includes('chase-freedom-flex')) return null;

  const schedule = getCurrentRotating('chase-freedom-flex');
  if (!schedule || schedule.daysRemaining === 0) return null;

  const { entry, daysRemaining, percentElapsed } = schedule;
  const emoji = CATEGORY_EMOJI[entry.category] ?? '⭐';
  const urgent = daysRemaining <= 14;

  return (
    <div className="mx-4 mt-4">
      <div className={`p-4 rounded-2xl border ${
        urgent
          ? 'bg-amber-50 border-amber-200'
          : 'bg-blue-50 border-blue-100'
      }`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <span className="text-xl leading-none mt-0.5">{emoji}</span>
            <div>
              <p className={`text-[10px] uppercase tracking-widest font-bold ${
                urgent ? 'text-amber-600' : 'text-blue-500'
              }`}>
                Freedom Flex · Q{entry.quarter} Bonus
              </p>
              <p className={`text-sm font-bold mt-0.5 ${
                urgent ? 'text-amber-800' : 'text-gray-800'
              }`}>
                5x {entry.label}
              </p>
            </div>
          </div>

          {/* Days pill */}
          <div className={`flex-shrink-0 text-center px-2.5 py-1.5 rounded-xl ${
            urgent ? 'bg-amber-100' : 'bg-blue-100'
          }`}>
            <p className={`text-lg font-black leading-none ${
              urgent ? 'text-amber-700' : 'text-blue-700'
            }`}>{daysRemaining}</p>
            <p className={`text-[9px] font-semibold leading-none mt-0.5 ${
              urgent ? 'text-amber-600' : 'text-blue-500'
            }`}>days left</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              urgent ? 'bg-amber-400' : 'bg-blue-400'
            }`}
            style={{ width: `${percentElapsed}%` }}
          />
        </div>
        <p className={`text-[10px] mt-1 ${urgent ? 'text-amber-500' : 'text-blue-400'}`}>
          {percentElapsed}% of quarter elapsed{urgent ? ' — use it before it resets!' : ''}
        </p>
      </div>
    </div>
  );
}
