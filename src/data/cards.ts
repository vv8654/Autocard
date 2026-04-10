import { CreditCard } from '../types';

/**
 * Mock credit card data with simplified (but realistic) reward structures.
 *
 * Point value assumptions:
 *   - Amex Membership Rewards: ~2.0¢/pt (via airline/hotel transfer partners)
 *   - Chase Ultimate Rewards (Sapphire): ~2.0¢/pt (via transfer partners)
 *   - Chase UR (Freedom Flex): ~1.5¢/pt (via travel portal; or 1¢ as cash back)
 *   - Capital One Miles: ~1.85¢/mile (via transfer partners)
 *   - Cash back cards (Citi, Blue Cash): 1¢ per 1% — face value
 *
 * Caps are noted in `notes` but not enforced in this prototype.
 */
export const CARDS: CreditCard[] = [
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    shortName: 'Amex Gold',
    issuer: 'American Express',
    network: 'Amex',
    gradient: 'from-yellow-400 via-amber-400 to-orange-400',
    lastFour: '2847',
    annualFee: 250,
    pointsName: 'MR pts',
    pointValue: 2.0,
    baseMultiplier: 1,
    keyBenefit: '4x dining & US groceries worldwide',
    rewards: [
      { category: 'dining',  multiplier: 4, notes: 'Restaurants worldwide' },
      { category: 'grocery', multiplier: 4, capAmount: 25000, notes: 'US supermarkets, up to $25k/yr' },
      { category: 'travel',  multiplier: 3, notes: 'Flights booked directly with airlines' },
    ],
  },
  {
    id: 'chase-freedom-flex',
    name: 'Chase Freedom Flex',
    shortName: 'Freedom Flex',
    issuer: 'Chase',
    network: 'Mastercard',
    gradient: 'from-blue-500 to-blue-800',
    lastFour: '5391',
    annualFee: 0,
    pointsName: 'Chase UR pts',
    pointValue: 1.5,
    baseMultiplier: 1,
    keyBenefit: '5x rotating categories + 3x dining & pharmacy',
    rewards: [
      { category: 'dining',   multiplier: 3, notes: 'Restaurants' },
      { category: 'pharmacy', multiplier: 3, notes: 'Drug stores' },
      // Q3 rotating: grocery stores
      { category: 'grocery',  multiplier: 5, capAmount: 1500, notes: 'Q3 rotating category — grocery, up to $1,500/quarter' },
    ],
  },
  {
    id: 'citi-custom-cash',
    name: 'Citi Custom Cash Card',
    shortName: 'Citi Custom Cash',
    issuer: 'Citi',
    network: 'Mastercard',
    gradient: 'from-rose-500 to-red-700',
    lastFour: '7723',
    annualFee: 0,
    pointsName: '% cash back',
    pointValue: 1.0,
    baseMultiplier: 1,
    keyBenefit: '5% on your #1 spend category (up to $500/mo)',
    rewards: [
      // Assumes this purchase category IS the user's top monthly spend
      { category: 'dining',    multiplier: 5, capAmount: 500, notes: 'If dining is your top category this billing cycle' },
      { category: 'grocery',   multiplier: 5, capAmount: 500, notes: 'If grocery is your top category this billing cycle' },
      { category: 'gas',       multiplier: 5, capAmount: 500, notes: 'If gas is your top category this billing cycle' },
      { category: 'transit',   multiplier: 5, capAmount: 500, notes: 'If transit is your top category this billing cycle' },
      { category: 'pharmacy',  multiplier: 5, capAmount: 500, notes: 'If pharmacy is your top category this billing cycle' },
      { category: 'travel',    multiplier: 5, capAmount: 500, notes: 'If travel is your top category this billing cycle' },
      { category: 'streaming', multiplier: 5, capAmount: 500, notes: 'If streaming is your top category this billing cycle' },
    ],
  },
  {
    id: 'venture-x',
    name: 'Capital One Venture X',
    shortName: 'Venture X',
    issuer: 'Capital One',
    network: 'Visa',
    gradient: 'from-zinc-700 to-zinc-900',
    lastFour: '4108',
    annualFee: 395,
    pointsName: 'miles',
    pointValue: 1.85,
    baseMultiplier: 2, // 2x on everything — the key differentiator
    keyBenefit: '2x on everything, 5–10x on travel',
    rewards: [
      { category: 'travel', multiplier: 5, notes: 'Flights via Capital One Travel portal' },
    ],
  },
  {
    id: 'sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    shortName: 'Sapphire Preferred',
    issuer: 'Chase',
    network: 'Visa',
    gradient: 'from-sky-400 to-cyan-600',
    lastFour: '9062',
    annualFee: 95,
    pointsName: 'Chase UR pts',
    pointValue: 2.0,
    baseMultiplier: 1,
    keyBenefit: '3x dining, streaming & online grocery; 2x travel',
    rewards: [
      { category: 'dining',    multiplier: 3, notes: 'Restaurants worldwide' },
      { category: 'streaming', multiplier: 3, notes: 'Streaming services' },
      { category: 'grocery',   multiplier: 3, notes: 'Online grocery' },
      { category: 'travel',    multiplier: 2, notes: 'All travel' },
    ],
  },
  {
    id: 'blue-cash-preferred',
    name: 'Blue Cash Preferred Card',
    shortName: 'Blue Cash Preferred',
    issuer: 'American Express',
    network: 'Amex',
    gradient: 'from-indigo-500 to-violet-700',
    lastFour: '3361',
    annualFee: 95,
    pointsName: '% cash back',
    pointValue: 1.0,
    baseMultiplier: 1,
    keyBenefit: '6% groceries & streaming, 3% transit & gas',
    rewards: [
      { category: 'grocery',   multiplier: 6, capAmount: 6000, notes: 'US supermarkets, up to $6k/yr' },
      { category: 'streaming', multiplier: 6, notes: 'US streaming subscriptions' },
      { category: 'transit',   multiplier: 3, notes: 'Uber, Lyft, subway, buses, ferries' },
      { category: 'gas',       multiplier: 3, notes: 'US gas stations' },
    ],
  },
];

// Cards enabled by default on first load
export const DEFAULT_ENABLED_CARD_IDS = [
  'amex-gold',
  'sapphire-preferred',
  'venture-x',
];
