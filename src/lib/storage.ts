import { AppState, NotificationSettings } from '../types';
import { DEFAULT_ENABLED_CARD_IDS } from '../data/cards';

const STORAGE_KEY = 'autocard_v1';

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  frequency: 'all',
  enabledCategories: ['dining', 'grocery', 'travel', 'transit', 'pharmacy'],
  highValueThreshold: 5,
};

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      enabledCardIds: parsed.enabledCardIds ?? DEFAULT_ENABLED_CARD_IDS,
      notificationSettings: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        ...(parsed.notificationSettings ?? {}),
      },
      history: parsed.history ?? [],
    };
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently ignore quota/security errors
  }
}

function defaultState(): AppState {
  return {
    enabledCardIds: DEFAULT_ENABLED_CARD_IDS,
    notificationSettings: DEFAULT_NOTIFICATION_SETTINGS,
    history: [],
  };
}
