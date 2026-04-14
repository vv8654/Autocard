'use client';

import { useState } from 'react';
import { GhostCard } from '../types';

export function GhostCardBanner({ ghost }: { ghost: GhostCard }) {
  const [expanded, setExpanded] = useState(false);
  const days = isFinite(ghost.daysSinceLastWin)
    ? `${ghost.daysSinceLastWin} days`
    : 'never';

  return (
    <button
      onClick={() => setExpanded(prev => !prev)}
      className="mt-2.5 w-full text-left px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl"
    >
      <div className="flex items-center gap-2">
        <span className="text-base leading-none">⚠️</span>
        <p className="text-xs font-semibold text-amber-700 flex-1">
          Top recommendation: {days} — fee is ${ghost.annualFee}/yr
        </p>
        <span className="text-amber-400 text-[10px]">{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <p className="mt-2 text-[11px] text-amber-600 leading-relaxed pl-6">
          {ghost.suggestedAction}
        </p>
      )}
    </button>
  );
}
