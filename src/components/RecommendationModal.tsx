'use client';

import { useState } from 'react';
import { X, Zap, ChevronDown, ChevronUp, Gift } from 'lucide-react';
import { Recommendation, RankedCard } from '../types';

interface Props {
  recommendation: Recommendation | null;
  onClose: () => void;
}

export function RecommendationModal({ recommendation, onClose }: Props) {
  const [showAlternatives, setShowAlternatives] = useState(false);

  if (!recommendation) return null;

  const { best, alternatives, explanation, context, isHighValue, bonusContext } = recommendation;
  const estimatedEarned = ((best.effectiveCPD / 100) * context.estimatedAmount).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="relative w-full max-w-[480px] bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-0">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-3 pb-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest font-semibold text-gray-400">
              Best card for
            </p>
            <h2 className="text-xl font-black text-gray-900 mt-0.5">
              {context.merchant.emoji} {context.merchant.displayName}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {context.merchant.scenarioLabel} · estimated ${context.estimatedAmount} purchase
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-1 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Best Card Block ── */}
        <div className="mx-4 mb-3">
          <div className={`bg-gradient-to-br ${best.card.gradient} rounded-2xl p-5 relative overflow-hidden`}>
            {isHighValue && !bonusContext && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                <Zap size={11} className="text-white" />
                <span className="text-white text-[11px] font-bold tracking-wide">High Value</span>
              </div>
            )}
            {bonusContext && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                <Gift size={11} className="text-white" />
                <span className="text-white text-[11px] font-bold tracking-wide">Bonus Active</span>
              </div>
            )}

            <p className="text-white/60 text-[10px] uppercase tracking-widest font-semibold mb-1">
              Recommended
            </p>
            <h3 className="text-white text-2xl font-black leading-tight mb-4">
              {best.card.shortName}
            </h3>

            <div className="flex items-end gap-6">
              <div>
                <p className="text-white/70 text-xs font-medium">{best.multiplier}x {best.card.pointsName}</p>
                <p className="text-white text-4xl font-black leading-none">
                  {best.effectiveCPD.toFixed(1)}<span className="text-2xl">¢</span>
                </p>
                <p className="text-white/60 text-xs mt-0.5">per dollar spent</p>
              </div>
              <div className="pb-0.5">
                <p className="text-white/70 text-xs font-medium">On ${context.estimatedAmount}</p>
                <p className="text-white text-xl font-bold">≈${estimatedEarned}</p>
                <p className="text-white/60 text-xs">earned back</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bonus Context Block ── */}
        {bonusContext && (
          <div className="mx-4 mb-3 p-4 bg-violet-50 rounded-2xl border border-violet-100">
            <div className="flex items-start gap-2.5">
              <Gift size={15} className="text-violet-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-bold text-violet-800 mb-1">
                  Bonus boosting this recommendation
                </p>
                {/* Score breakdown */}
                <div className="flex gap-3 text-xs mb-2">
                  <div>
                    <p className="text-violet-400">Base earn</p>
                    <p className="font-bold text-violet-700">{bonusContext.baseCPD.toFixed(1)}¢/$</p>
                  </div>
                  <div className="text-violet-200">+</div>
                  <div>
                    <p className="text-violet-400">Bonus boost</p>
                    <p className="font-bold text-violet-700">{bonusContext.bonusCPD.toFixed(1)}¢/$</p>
                  </div>
                  <div className="text-violet-200">=</div>
                  <div>
                    <p className="text-violet-400">Effective</p>
                    <p className="font-bold text-violet-800">{best.effectiveCPD.toFixed(1)}¢/$</p>
                  </div>
                </div>
                <p className="text-[11px] text-violet-500 leading-relaxed">
                  ${bonusContext.remainingSpend.toLocaleString()} to unlock a $
                  {bonusContext.totalValue} bonus — each dollar spent here counts.
                </p>
                {bonusContext.baselineBest && (
                  <p className="text-[11px] text-violet-400 mt-1">
                    Without the bonus, {bonusContext.baselineBest.shortName} would be best (
                    {bonusContext.baselineBest.effectiveCPD.toFixed(1)}¢/$).
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Explanation ── */}
        <div className="mx-4 mb-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
          <p className="text-indigo-900 text-sm leading-relaxed font-medium">
            {explanation}
          </p>
        </div>

        {/* ── Alternatives ── */}
        {alternatives.length > 0 && (
          <div className="mx-4 mb-2">
            <button
              onClick={() => setShowAlternatives(prev => !prev)}
              className="w-full flex items-center justify-between py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span>{showAlternatives ? 'Hide' : 'Compare'} {alternatives.length} other cards</span>
              {showAlternatives ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showAlternatives && (
              <div className="space-y-2 mt-1">
                {alternatives.map(ranked => (
                  <AlternativeRow key={ranked.card.id} ranked={ranked} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}

function AlternativeRow({ ranked }: { ranked: RankedCard }) {
  const { card, multiplier, effectiveCPD, baseCPD, bonusApplied, rank } = ranked;
  const displayCPD = effectiveCPD;
  const isZero = displayCPD <= 1.0;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${isZero ? 'bg-gray-50 opacity-60' : 'bg-gray-50'}`}>
      <span className="text-gray-400 text-xs font-bold w-4 text-center flex-shrink-0">
        {rank}
      </span>

      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.gradient} flex-shrink-0`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-gray-900 truncate">{card.shortName}</p>
          {bonusApplied && (
            <span className="text-[9px] font-bold text-violet-500 bg-violet-100 px-1 py-0.5 rounded-full flex-shrink-0">
              +bonus
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">{multiplier}x {card.pointsName}</p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-bold ${displayCPD >= 5 ? 'text-green-600' : 'text-gray-700'}`}>
          {displayCPD.toFixed(1)}¢
        </p>
        {bonusApplied && baseCPD !== undefined && (
          <p className="text-[10px] text-violet-400">{baseCPD.toFixed(1)}¢ base</p>
        )}
        {!bonusApplied && <p className="text-[10px] text-gray-400">per $1</p>}
      </div>
    </div>
  );
}
