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

export type RewardsType = 'MR' | 'UR' | 'Miles' | 'Cash';
export type RedemptionStyle = 'simple' | 'balanced' | 'max';

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
  pointValue: number;     // kept for fallback / display; engine uses rewardsType + style
  rewardsType: RewardsType;
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
  effectiveCPD: number;   // total score = baseCPD + bonusCPD
  baseCPD?: number;       // earn_rate × pointValue (no bonus)
  bonusCPD?: number;      // bonus contribution to score
  bonusApplied?: boolean;
  rank: number;
  note?: string;
}

export interface BonusContext {
  totalValue: number;
  remainingSpend: number;
  bonusCPD: number;
  baseCPD: number;
  // best card by base score alone (if different from bonus-boosted winner)
  baselineBest?: { cardId: string; shortName: string; effectiveCPD: number };
}

export interface Recommendation {
  id: string;
  context: PurchaseContext;
  best: RankedCard;
  alternatives: RankedCard[];
  explanation: string;
  timestamp: string;
  isHighValue: boolean;
  bonusContext?: BonusContext;
}

// ── Bonus tracking ──────────────────────────────────────────────────────────

export interface Bonus {
  cardId: string;
  label: string;          // e.g. "Welcome Offer"
  totalValue: number;     // dollar value of the bonus reward
  requiredSpend: number;  // spend threshold to earn it
  currentSpend: number;   // tracked spend so far
  deadline?: string;      // ISO date string (optional)
  active: boolean;
}

export interface ManualLocation {
  lat: number;
  lon: number;
  label: string; // human-readable place name shown in the UI
}

export type NotificationFrequency = 'all' | 'high-value' | 'off';

export interface NotificationSettings {
  frequency: NotificationFrequency;
  enabledCategories: Category[];
  highValueThreshold: number;
}

export interface LocationSettings {
  enabled: boolean;
  notifyNearby: boolean;
  browserNotifications: boolean;
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: Category;
  distance?: number;
  address?: string;   // short address when available from OSM tags
}

// ── Plaid bank/card connection ───────────────────────────────────────────────

export interface PlaidAccount {
  id: string;        // Plaid account_id
  name: string;      // e.g. "Plaid Checking"
  mask: string;      // last-4 digits
  type: string;      // depository | credit | loan | investment
  subtype: string;   // checking | savings | credit card | etc.
}

export interface PlaidTransaction {
  id: string;            // Plaid transaction_id
  date: string;          // YYYY-MM-DD
  name: string;          // merchant name from Plaid
  amount: number;        // positive = debit (money out), negative = credit
  category: Category;    // mapped via plaidCategories.ts
  rawCategory: string;   // original Plaid personal_finance_category or legacy[0]
  accountId: string;
}

export interface PlaidConnection {
  id: string;                     // item_id from Plaid
  institutionName: string;        // set by user or derived
  encryptedToken: string;         // AES-256-GCM encrypted access token
  accounts: PlaidAccount[];
  lastSynced: string | null;      // ISO timestamp of last successful sync
  transactions: PlaidTransaction[];
}

export interface AppState {
  enabledCardIds: string[];
  notificationSettings: NotificationSettings;
  locationSettings: LocationSettings;
  history: Recommendation[];
  bonuses: Bonus[];
  redemptionStyle: RedemptionStyle;
  manualLocation: ManualLocation | null;
  plaidConnections: PlaidConnection[];
}

// ── Feature: Rotating Category Countdown ────────────────────────────────────

export interface RotatingCategoryEntry {
  cardId: string;
  quarter: number;
  months: number[];
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
  estimatedRewardsValue: number;
  netROI: number;
  isAhead: boolean;
}

// ── Feature: Ghost Card Detection ───────────────────────────────────────────

export interface GhostCard {
  cardId: string;
  daysSinceLastWin: number;
  annualFee: number;
  suggestedAction: string;
}

// ── Feature: What-If Simulator ───────────────────────────────────────────────

export interface SimulatedHistoryRow {
  recommendation: Recommendation;
  simulatedCard: RankedCard;
  actualCPD: number;
  simulatedCPD: number;
  deltaPerDollar: number;
}

export interface SimulationResult {
  cardId: string;
  totalActualValue: number;
  totalSimulatedValue: number;
  netDelta: number;
  rows: SimulatedHistoryRow[];
}
