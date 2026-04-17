import { Bonus, CreditCard, RotatingCategoryEntry } from '../types';

// Point valuations sourced from The Points Guy monthly valuations (April 2026)
// MR = 2.0¢, UR = 2.05¢ (using 2.0¢ for conservative estimates), Capital One miles = 1.85¢

export const CARDS: CreditCard[] = [
  {
    id: 'amex-gold',
    name: 'American Express Gold Card',
    shortName: 'Amex Gold',
    issuer: 'American Express',
    network: 'Amex',
    gradient: 'from-yellow-400 via-amber-400 to-orange-400',
    lastFour: '2847',
    annualFee: 325,
    pointsName: 'MR pts',
    pointValue: 2.0,
    rewardsType: 'MR',
    baseMultiplier: 1,
    keyBenefit: '4x dining & US groceries; $325 fee offset by $424 in credits',
    rewards: [
      { category: 'dining',  multiplier: 4, capAmount: 50000, notes: 'Restaurants worldwide, up to $50k/yr' },
      { category: 'grocery', multiplier: 4, capAmount: 25000, notes: 'US supermarkets, up to $25k/yr' },
      { category: 'travel',  multiplier: 3, notes: 'Flights booked directly with airlines or amextravel.com' },
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
    pointsName: 'cash back',
    pointValue: 1.0,
    rewardsType: 'Cash',
    baseMultiplier: 1,
    keyBenefit: '5x rotating categories + 5x Chase Travel + 3x dining & pharmacy',
    rewards: [
      { category: 'travel',    multiplier: 5, notes: 'Chase Travel portal (non-rotating, always on)' },
      { category: 'dining',    multiplier: 3, notes: 'Restaurants' },
      { category: 'pharmacy',  multiplier: 3, notes: 'Drug stores' },
      // Rotating 5x category is applied dynamically from ROTATING_SCHEDULES
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
    rewardsType: 'Cash',
    baseMultiplier: 1,
    keyBenefit: '5% on your #1 spend category (up to $500/mo) — auto-selected each billing cycle',
    rewards: [
      { category: 'dining',    multiplier: 5, capAmount: 500, notes: 'Auto-selected if dining is your top category this billing cycle' },
      { category: 'grocery',   multiplier: 5, capAmount: 500, notes: 'Auto-selected if grocery is your top category this billing cycle' },
      { category: 'gas',       multiplier: 5, capAmount: 500, notes: 'Auto-selected if gas is your top category this billing cycle' },
      { category: 'transit',   multiplier: 5, capAmount: 500, notes: 'Auto-selected if transit is your top category this billing cycle' },
      { category: 'pharmacy',  multiplier: 5, capAmount: 500, notes: 'Auto-selected if pharmacy is your top category this billing cycle' },
      { category: 'travel',    multiplier: 5, capAmount: 500, notes: 'Auto-selected if travel is your top category this billing cycle' },
      { category: 'streaming', multiplier: 5, capAmount: 500, notes: 'Auto-selected if streaming is your top category this billing cycle' },
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
    rewardsType: 'Miles',
    baseMultiplier: 2,
    keyBenefit: '2x on everything; 5x flights, 10x hotels & car rentals via Capital One Travel',
    rewards: [
      { category: 'travel', multiplier: 5, notes: 'Flights via Capital One Travel portal (hotels/rental cars earn 10x)' },
      // baseMultiplier: 2 covers all other purchases — this card earns 2x everywhere
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
    rewardsType: 'UR',
    baseMultiplier: 1,
    keyBenefit: '5x Chase Travel; 3x dining, streaming & online grocery; 2x all travel',
    rewards: [
      { category: 'travel',    multiplier: 5, notes: 'Booked through Chase Travel portal' },
      { category: 'dining',    multiplier: 3, notes: 'Restaurants worldwide' },
      { category: 'streaming', multiplier: 3, notes: 'Select streaming services (Netflix, Spotify, Hulu, Disney+, etc.)' },
      { category: 'grocery',   multiplier: 3, notes: 'Online grocery orders (excludes Target, Walmart, wholesale clubs)' },
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
    rewardsType: 'Cash',
    baseMultiplier: 1,
    keyBenefit: '6% US groceries & streaming; 3% US gas & transit',
    rewards: [
      { category: 'grocery',   multiplier: 6, capAmount: 6000, notes: 'US supermarkets, up to $6k/yr; then 1%' },
      { category: 'streaming', multiplier: 6, notes: 'Select US streaming subscriptions (Netflix, Spotify, Disney+, etc.)' },
      { category: 'transit',   multiplier: 3, notes: 'Taxis, rideshare (Uber/Lyft), parking, tolls, trains, buses, ferries' },
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

// Freedom Flex quarterly rotating 5x categories
// Q1/Q2 2026 confirmed by Chase; Q3/Q4 updated as announced
export const ROTATING_SCHEDULES: RotatingCategoryEntry[] = [
  { cardId: 'chase-freedom-flex', quarter: 1, months: [0, 1, 2],  category: 'dining',  label: 'Dining & Norwegian Cruise Line' },
  { cardId: 'chase-freedom-flex', quarter: 2, months: [3, 4, 5],  category: 'grocery', label: 'Amazon, Whole Foods & Chase Travel' },
  { cardId: 'chase-freedom-flex', quarter: 3, months: [6, 7, 8],  category: 'grocery', label: 'Grocery & Streaming (TBD)' },
  { cardId: 'chase-freedom-flex', quarter: 4, months: [9, 10, 11],category: 'online',  label: 'Amazon & Walmart (TBD)' },
];

export const PRESET_BONUSES: Omit<Bonus, 'currentSpend' | 'active'>[] = [
  { cardId: 'amex-gold',           label: 'Welcome Offer', totalValue: 200, requiredSpend: 6000 },
  { cardId: 'chase-freedom-flex',  label: 'Welcome Offer', totalValue: 200, requiredSpend: 500  },
  { cardId: 'citi-custom-cash',    label: 'Welcome Offer', totalValue: 200, requiredSpend: 1500 },
  { cardId: 'venture-x',           label: 'Welcome Offer', totalValue: 750, requiredSpend: 4000 },
  { cardId: 'sapphire-preferred',  label: 'Welcome Offer', totalValue: 750, requiredSpend: 4000 },
  { cardId: 'blue-cash-preferred', label: 'Welcome Offer', totalValue: 250, requiredSpend: 3000 },
];
