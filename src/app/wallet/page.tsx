'use client';

import { CheckCircle2, Circle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CARDS } from '../../data/cards';
import { BottomNav } from '../../components/BottomNav';

export default function WalletPage() {
  const { state, toggleCard } = useApp();
  const enabledCount = state.enabledCardIds.length;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-5 pt-14 pb-7">
        <h1 className="text-white text-2xl font-black">Your Wallet</h1>
        <p className="text-indigo-200 text-sm mt-1">
          {enabledCount} of {CARDS.length} cards active
        </p>
        <p className="text-indigo-300 text-xs mt-2 leading-relaxed">
          Toggle cards on or off — only active cards are included in recommendations.
        </p>
      </div>

      {/* Cards */}
      <div className="px-4 pt-5 space-y-4">
        {CARDS.map(card => {
          const enabled = state.enabledCardIds.includes(card.id);

          return (
            <button
              key={card.id}
              onClick={() => toggleCard(card.id)}
              className={`w-full text-left rounded-2xl overflow-hidden border-2 transition-all active:scale-[0.99] ${
                enabled
                  ? 'border-indigo-300 shadow-md shadow-indigo-100'
                  : 'border-gray-100 opacity-55'
              }`}
            >
              {/* Card Visual */}
              <div
                className={`bg-gradient-to-br ${card.gradient} px-5 py-4 flex items-start justify-between`}
              >
                <div>
                  <p className="text-white/60 text-xs font-mono tracking-widest">
                    •••• {card.lastFour}
                  </p>
                  <p className="text-white text-xl font-black mt-1 leading-tight">
                    {card.shortName}
                  </p>
                  <p className="text-white/70 text-xs mt-0.5">{card.issuer} · {card.network}</p>
                </div>
                <div className="mt-0.5">
                  {enabled ? (
                    <CheckCircle2 size={22} className="text-white drop-shadow" />
                  ) : (
                    <Circle size={22} className="text-white/40" />
                  )}
                </div>
              </div>

              {/* Card Details */}
              <div className="bg-white px-5 py-3.5">
                <p className="text-sm font-semibold text-gray-800 mb-2">{card.keyBenefit}</p>
                <div className="flex flex-wrap gap-1.5">
                  {card.rewards.slice(0, 4).map((r, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium"
                    >
                      {r.multiplier}x {r.category}
                    </span>
                  ))}
                  {card.annualFee > 0 ? (
                    <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                      ${card.annualFee}/yr fee
                    </span>
                  ) : (
                    <span className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      No annual fee
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
