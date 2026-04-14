'use client';

import { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CARDS } from '../../data/cards';
import { CreditCard } from '../../types';
import { BottomNav } from '../../components/BottomNav';
import { CardArtwork } from '../../components/CardArtwork';
import { ROIBadge } from '../../components/ROIBadge';
import { GhostCardBanner } from '../../components/GhostCardBanner';
import { computeCardROI } from '../../lib/roi';
import { detectGhostCards } from '../../lib/ghostCards';
import { getCurrentRotating } from '../../lib/rotatingCategory';

function RewardPills({ card }: { card: CreditCard }) {
  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        {card.rewards.map((r, i) => (
          <div key={i} className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
            <span className="text-indigo-600 text-xs font-black">{r.multiplier}x</span>
            <span className="text-gray-600 text-xs font-medium capitalize">{r.category}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
          <span className="text-gray-400 text-xs font-black">{card.baseMultiplier}x</span>
          <span className="text-gray-400 text-xs">everything else</span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100">
        <span className="text-xs text-gray-500 flex-1 mr-3 leading-snug">{card.keyBenefit}</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
          card.annualFee > 0
            ? 'bg-amber-50 text-amber-700'
            : 'bg-green-50 text-green-700'
        }`}>
          {card.annualFee > 0 ? `$${card.annualFee}/yr` : 'No annual fee'}
        </span>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { state, toggleCard, enabledCards } = useApp();
  const enabledCount = state.enabledCardIds.length;

  const roiMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof computeCardROI>> = {};
    for (const card of CARDS) {
      map[card.id] = computeCardROI(card.id, state.history, CARDS);
    }
    return map;
  }, [state.history]);

  const ghostSet = useMemo(() => {
    const ghosts = detectGhostCards(enabledCards, state.history);
    return new Map(ghosts.map(g => [g.cardId, g]));
  }, [enabledCards, state.history]);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-5 pt-14 pb-7">
        <h1 className="text-white text-2xl font-black">Your Wallet</h1>
        <p className="text-indigo-200 text-sm mt-1">
          {enabledCount} of {CARDS.length} cards active
        </p>
        <p className="text-indigo-300 text-xs mt-2">
          Tap a card to toggle it on or off.
        </p>
      </div>

      <div className="px-4 pt-5 space-y-7">
        {CARDS.map(card => {
          const enabled = state.enabledCardIds.includes(card.id);
          const roi     = roiMap[card.id];
          const ghost   = ghostSet.get(card.id);
          const rotating = enabled ? getCurrentRotating(card.id) : null;

          return (
            <div key={card.id}>
              {/* Card artwork — tappable */}
              <button
                onClick={() => toggleCard(card.id)}
                className={`w-full transition-all active:scale-[0.985] ${
                  enabled ? 'opacity-100' : 'opacity-40 grayscale'
                }`}
                aria-label={`${enabled ? 'Disable' : 'Enable'} ${card.shortName}`}
              >
                <div className="relative">
                  <CardArtwork cardId={card.id} lastFour={card.lastFour}/>
                  {/* Active / Off pill overlaid on card */}
                  <div className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    enabled
                      ? 'bg-white/25 text-white backdrop-blur-sm'
                      : 'bg-black/40 text-white/70'
                  }`}>
                    {enabled ? '● Active' : '○ Off'}
                  </div>

                  {/* Rotating category countdown pill */}
                  {rotating && rotating.daysRemaining > 0 && (
                    <div className={`absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold backdrop-blur-sm ${
                      rotating.daysRemaining <= 14
                        ? 'bg-amber-500/90 text-white'
                        : 'bg-white/25 text-white'
                    }`}>
                      ⚡ {rotating.daysRemaining}d left · 5x {rotating.entry.label.split(' ')[0]}
                    </div>
                  )}
                </div>
              </button>

              {/* Reward info below the card */}
              {enabled && (
                <>
                  <RewardPills card={card}/>
                  {roi && <ROIBadge roi={roi}/>}
                  {ghost && <GhostCardBanner ghost={ghost}/>}
                </>
              )}
              {!enabled && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  Tap to activate
                </p>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav/>
    </div>
  );
}
