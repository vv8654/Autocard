// ─── Core domain types for AutoCard ────────────────────────────────────────

export type Category =
  | 'dining'
  | 'grocery'
  | 'travel'
  | 'transit'
  | 'pharmacy'
  | 'streaming'
  | 'gas'
  | 'online'
  | 'general';

export interface RewardRate {
  category: Category;
  multiplier: number;    // e.g. 4 = 4x points / 4% cash back
  capAmount?: number;    // monthly spend cap in dollars (undefined = no cap)
  notes?: string;        // e.g. "US supermarkets only, up to $25k/yr"
}

export interface CreditCard {
  id: string;
  name: string;          // Full formal name
  shortName: string;     // UI display name
  issuer: string;
  network: 'Visa' | 'Mastercard' | 'Amex' | 'Discover';
  gradient: string;      // Tailwind bg-gradient-to-br classes
  lastFour: string;      // Mock last 4 digits
  annualFee: number;
  pointsName: string;    // "Membership Rewards pts" | "miles" | "% cash back"
  pointValue: number;    // Estimated cents per point (for apples-to-apples CPD calc)
  baseMultiplier: number; // Catch-all earn rate (all other purchases)
  keyBenefit: string;    // One-liner shown in Wallet
  rewards: RewardRate[];
}

export interface Merchant {
  id: string;
  name: string;
  displayName: string;
  category: Category;
  emoji: string;
  scenarioLabel: string; // e.g. "Dining"
}

export interface PurchaseContext {
  merchantId: string;
  merchant: Merchant;
  estimatedAmount: number; // default $50
}

export interface RankedCard {
  card: CreditCard;
  multiplier: number;
  effectiveCPD: number;  // cents per dollar earned
  rank: number;
  note?: string;         // e.g. "Rotating category this quarter"
}

export interface Recommendation {
  id: string;
  context: PurchaseContext;
  best: RankedCard;
  alternatives: RankedCard[];
  explanation: string;
  timestamp: string;     // ISO string (serializable)
  isHighValue: boolean;  // true when best CPD >= 5¢
}

export type NotificationFrequency = 'all' | 'high-value' | 'off';

export interface NotificationSettings {
  frequency: NotificationFrequency;
  enabledCategories: Category[];
  highValueThreshold: number; // CPD threshold for "high-value" mode
}

export interface AppState {
  enabledCardIds: string[];
  notificationSettings: NotificationSettings;
  history: Recommendation[];
}
