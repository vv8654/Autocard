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
  multiplier: number;
  capAmount?: number;
  notes?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  shortName: string;
  issuer: string;
  network: 'Visa' | 'Mastercard' | 'Amex' | 'Discover';
  gradient: string;
  lastFour: string;
  annualFee: number;
  pointsName: string;
  pointValue: number;
  baseMultiplier: number;
  keyBenefit: string;
  rewards: RewardRate[];
}

export interface Merchant {
  id: string;
  name: string;
  displayName: string;
  category: Category;
  emoji: string;
  scenarioLabel: string;
}

export interface PurchaseContext {
  merchantId: string;
  merchant: Merchant;
  estimatedAmount: number;
}

export interface RankedCard {
  card: CreditCard;
  multiplier: number;
  effectiveCPD: number;
  rank: number;
  note?: string;
}

export interface Recommendation {
  id: string;
  context: PurchaseContext;
  best: RankedCard;
  alternatives: RankedCard[];
  explanation: string;
  timestamp: string;
  isHighValue: boolean;
}

export type NotificationFrequency = 'all' | 'high-value' | 'off';

export interface NotificationSettings {
  frequency: NotificationFrequency;
  enabledCategories: Category[];
  highValueThreshold: number;
}

export interface LocationSettings {
  enabled: boolean;
  notifyNearby: boolean;       // show banner/notification for nearby high-value spots
  browserNotifications: boolean; // Web Notifications API permission granted
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: Category;
  distance?: number; // meters
}

export interface AppState {
  enabledCardIds: string[];
  notificationSettings: NotificationSettings;
  locationSettings: LocationSettings;
  history: Recommendation[];
}

// ── Feature: Rotating Category Countdown ────────────────────────────────────

export interface RotatingCategoryEntry {
  cardId: string;
  quarter: number;
  months: number[]; // 0-indexed (Jan=0)
  category: Category;
  label: string;
}

export interface RotatingCategorySchedule {
  entry: RotatingCategoryEntry;
  daysRemaining: number;
  daysIntoQuarter: number;
  percentElapsed: number;
}

// ── Feature: Annual Fee ROI Calculator ──────────────────────────────────────

export interface CardROIResult {
  cardId: string;
  annualFee: number;
  estimatedRewardsValue: number; // sum of (CPD/100 × amount) across history wins
  netROI: number;                // estimatedRewardsValue - annualFee
  isAhead: boolean;
}

// ── Feature: Ghost Card Detection ───────────────────────────────────────────

export interface GhostCard {
  cardId: string;
  daysSinceLastWin: number; // Infinity if never won
  annualFee: number;
  suggestedAction: string;
}

// ── Feature: What-If Simulator ───────────────────────────────────────────────

export interface SimulatedHistoryRow {
  recommendation: Recommendation;
  simulatedCard: RankedCard;
  actualCPD: number;
  simulatedCPD: number;
  deltaPerDollar: number; // simulatedCPD - actualCPD
}

export interface SimulationResult {
  cardId: string;
  totalActualValue: number;
  totalSimulatedValue: number;
  netDelta: number; // positive = would have earned more with simulated card
  rows: SimulatedHistoryRow[];
}
