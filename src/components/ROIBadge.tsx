'use client';

import { CardROIResult } from '../types';

export function ROIBadge({ roi }: { roi: CardROIResult }) {
  if (roi.annualFee === 0) return null;

  const earned  = roi.estimatedRewardsValue.toFixed(2);
  const gap     = Math.abs(roi.netROI).toFixed(2);

  return (
    <div className={`mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
      roi.isAhead
        ? 'bg-green-50 border-green-200 text-green-700'
        : 'bg-red-50  border-red-100  text-red-600'
    }`}>
      <span className="text-base leading-none">{roi.isAhead ? '↑' : '↓'}</span>
      <span className="font-semibold">
        {roi.isAhead
          ? `$${earned} earned vs $${roi.annualFee} fee — you're $${gap} ahead`
          : `$${earned} earned vs $${roi.annualFee} fee — $${gap} to break even`}
      </span>
    </div>
  );
}
