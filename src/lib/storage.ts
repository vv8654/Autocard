import { AppState, Bonus, NotificationSettings, LocationSettings, ManualLocation, RedemptionStyle } from '../types';
import { DEFAULT_ENABLED_CARD_IDS } from '../data/cards';

const STORAGE_KEY = 'autocard_v2';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  frequency: 'all',
  enabledCategories: ['dining', 'grocery', 'travel', 'transit', 'pharmacy'],
  highValueThreshold: 5,
};

const DEFAULT_LOCATION_SETTINGS: LocationSettings = {
  enabled: false,
  notifyNearby: true,
  browserNotifications: false,
};

const DEFAULT_REDEMPTION_STYLE: RedemptionStyle = 'balanced';
const DEFAULT_BONUSES: Bonus[] = [];
const DEFAULT_MANUAL_LOCATION: ManualLocation | null = null;

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        enabledCardIds:       parsed.enabledCardIds       ?? DEFAULT_ENABLED_CARD_IDS,
        notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS, ...(parsed.notificationSettings ?? {}) },
        locationSettings:     { ...DEFAULT_LOCATION_SETTINGS,     ...(parsed.locationSettings     ?? {}) },
        history:              parsed.history              ?? [],
        bonuses:              parsed.bonuses              ?? DEFAULT_BONUSES,
        redemptionStyle:      parsed.redemptionStyle      ?? DEFAULT_REDEMPTION_STYLE,
        manualLocation:       parsed.manualLocation       ?? DEFAULT_MANUAL_LOCATION,
      };
    }
    // Migrate from v1
    const v1Raw = localStorage.getItem('autocard_v1');
    if (v1Raw) {
      const v1 = JSON.parse(v1Raw) as Partial<AppState>;
      return {
        enabledCardIds:       v1.enabledCardIds       ?? DEFAULT_ENABLED_CARD_IDS,
        notificationSettings: { ...DEFAULT_NOTIFICATION_SETTINGS, ...(v1.notificationSettings ?? {}) },
        locationSettings:     { ...DEFAULT_LOCATION_SETTINGS,     ...(v1.locationSettings     ?? {}) },
        history:              v1.history              ?? [],
        bonuses:              DEFAULT_BONUSES,
        redemptionStyle:      DEFAULT_REDEMPTION_STYLE,
        manualLocation:       DEFAULT_MANUAL_LOCATION,
      };
    }
    return defaultState();
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function defaultState(): AppState {
  return {
    enabledCardIds:       DEFAULT_ENABLED_CARD_IDS,
    notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
    locationSettings:     DEFAULT_LOCATION_SETTINGS,
    history:              [],
    bonuses:              DEFAULT_BONUSES,
    redemptionStyle:      DEFAULT_REDEMPTION_STYLE,
    manualLocation:       DEFAULT_MANUAL_LOCATION,
  };
}
