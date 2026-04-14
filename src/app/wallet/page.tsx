'use client';

import { useApp } from '../../context/AppContext';
import { CARDS } from '../../data/cards';
import { CreditCard } from '../../types';
import { BottomNav } from '../../components/BottomNav';

// ── Network logos as inline SVG marks ───────────────────────────────────────

function VisaLogo() {
  return (
    <svg viewBox="0 0 48 16" className="h-5 w-auto" aria-label="Visa">
      <text x="0" y="14" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="16" fill="white" letterSpacing="-0.5">
        VISA
      </text>
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg viewBox="0 0 38 24" className="h-6 w-auto" aria-label="Mastercard">
      <circle cx="13" cy="12" r="12" fill="#EB001B" />
      <circle cx="25" cy="12" r="12" fill="#F79E1B" />
      <path d="M19 4.8a12 12 0 0 1 0 14.4A12 12 0 0 1 19 4.8z" fill="#FF5F00" />
    </svg>
  );
}

function AmexLogo() {
  return (
    <svg viewBox="0 0 52 16" className="h-4 w-auto" aria-label="American Express">
      <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="13" fill="white" letterSpacing="1">
        AMEX
      </text>
    </svg>
  );
}

function NetworkLogo({ network }: { network: CreditCard['network'] }) {
  if (network === 'Visa')       return <VisaLogo />;
  if (network === 'Mastercard') return <MastercardLogo />;
  if (network === 'Amex')       return <AmexLogo />;
  return <span className="text-white/70 text-xs font-bold">{network}</span>;
}

// ── EMV Chip ─────────────────────────────────────────────────────────────────

function Chip() {
  return (
    <svg width="36" height="28" viewBox="0 0 36 28" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="35" height="27" rx="4.5" fill="#D4A843" stroke="#B8922E" strokeWidth="1"/>
      <rect x="0.5" y="0.5" width="35" height="27" rx="4.5" fill="url(#chip-shine)" stroke="#B8922E" strokeWidth="1"/>
      {/* horizontal lines */}
      <line x1="0" y1="9" x2="36" y2="9" stroke="#B8922E" strokeWidth="0.75"/>
      <line x1="0" y1="19" x2="36" y2="19" stroke="#B8922E" strokeWidth="0.75"/>
      {/* vertical lines */}
      <line x1="12" y1="0" x2="12" y2="28" stroke="#B8922E" strokeWidth="0.75"/>
      <line x1="24" y1="0" x2="24" y2="28" stroke="#B8922E" strokeWidth="0.75"/>
      {/* center contact */}
      <rect x="12.5" y="9.5" width="11" height="9" rx="1" fill="#C4952A"/>
      <defs>
        <linearGradient id="chip-shine" x1="0" y1="0" x2="36" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Card face component ───────────────────────────────────────────────────────

function CreditCardFace({ card, enabled, onToggle }: {
  card: CreditCard;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full transition-all active:scale-[0.98] ${!enabled ? 'opacity-50' : ''}`}
    >
      {/* Physical card proportions: standard CR80 is ~1.586:1 */}
      <div className={`relative w-full bg-gradient-to-br ${card.gradient} rounded-2xl overflow-hidden shadow-lg`}
           style={{ aspectRatio: '1.586 / 1' }}>

        {/* Subtle card texture overlay */}
        <div className="absolute inset-0 opacity-10"
             style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />

        {/* Enabled ring */}
        {enabled && (
          <div className="absolute inset-0 rounded-2xl ring-2 ring-white/40 ring-inset pointer-events-none" />
        )}

        {/* Top row: issuer name + enabled badge */}
        <div className="absolute top-4 left-5 right-5 flex items-start justify-between">
          <p className="text-white/80 text-[11px] font-semibold tracking-wide leading-tight">
            {card.issuer}
          </p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            enabled
              ? 'bg-white/25 text-white'
              : 'bg-black/20 text-white/60'
          }`}>
            {enabled ? 'Active' : 'Off'}
          </span>
        </div>

        {/* Chip */}
        <div className="absolute left-5" style={{ top: '34%' }}>
          <Chip />
        </div>

        {/* Card number */}
        <div className="absolute left-5 right-5" style={{ top: '58%' }}>
          <p className="text-white font-mono text-base tracking-[0.2em] font-medium">
            •••• •••• •••• {card.lastFour}
          </p>
        </div>

        {/* Bottom row: card name + network logo */}
        <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
          <div>
            <p className="text-white/60 text-[9px] uppercase tracking-widest mb-0.5">Card name</p>
            <p className="text-white text-sm font-black leading-tight">{card.shortName}</p>
          </div>
          <NetworkLogo network={card.network} />
        </div>
      </div>
    </button>
  );
}

// ── Reward pills ──────────────────────────────────────────────────────────────

function RewardPills({ card }: { card: CreditCard }) {
  return (
    <div className="mt-3 px-1">
      <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-2">
        Reward rates
      </p>
      <div className="flex flex-wrap gap-1.5">
        {card.rewards.map((r, i) => (
          <div key={i} className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
            <span className="text-indigo-600 text-xs font-black">{r.multiplier}x</span>
            <span className="text-gray-600 text-xs font-medium capitalize">{r.category}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
          <span className="text-gray-400 text-xs font-black">{card.baseMultiplier}x</span>
          <span className="text-gray-400 text-xs font-medium">everything else</span>
        </div>
      </div>

      {/* Annual fee */}
      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100">
        <span className="text-xs text-gray-500">{card.keyBenefit}</span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          card.annualFee > 0
            ? 'bg-amber-50 text-amber-700'
            : 'bg-green-50 text-green-700'
        }`}>
          {card.annualFee > 0 ? `$${card.annualFee}/yr` : 'No fee'}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
          Tap a card to toggle it on or off — only active cards appear in recommendations.
        </p>
      </div>

      {/* Cards */}
      <div className="px-4 pt-5 space-y-6">
        {CARDS.map(card => {
          const enabled = state.enabledCardIds.includes(card.id);
          return (
            <div key={card.id}>
              <CreditCardFace
                card={card}
                enabled={enabled}
                onToggle={() => toggleCard(card.id)}
              />
              <RewardPills card={card} />
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
