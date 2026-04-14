'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { AppState, Recommendation, NotificationSettings, LocationSettings, CreditCard } from '../types';
import { loadState, saveState } from '../lib/storage';
import { CARDS } from '../data/cards';

interface AppContextValue {
  state: AppState;
  enabledCards: CreditCard[];
  toggleCard:                    (id: string) => void;
  addToHistory:                  (rec: Recommendation) => void;
  updateNotificationSettings:    (s: NotificationSettings) => void;
  updateLocationSettings:        (s: LocationSettings) => void;
  clearHistory:                  () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => { saveState(state); }, [state]);

  const enabledCards = useMemo(
    () => CARDS.filter(c => state.enabledCardIds.includes(c.id)),
    [state.enabledCardIds],
  );

  function toggleCard(id: string) {
    setState(prev => ({
      ...prev,
      enabledCardIds: prev.enabledCardIds.includes(id)
        ? prev.enabledCardIds.filter(x => x !== id)
        : [...prev.enabledCardIds, id],
    }));
  }

  function addToHistory(rec: Recommendation) {
    setState(prev => ({ ...prev, history: [rec, ...prev.history].slice(0, 20) }));
  }

  function updateNotificationSettings(s: NotificationSettings) {
    setState(prev => ({ ...prev, notificationSettings: s }));
  }

  function updateLocationSettings(s: LocationSettings) {
    setState(prev => ({ ...prev, locationSettings: s }));
  }

  function clearHistory() {
    setState(prev => ({ ...prev, history: [] }));
  }

  return (
    <AppContext.Provider value={{
      state, enabledCards,
      toggleCard, addToHistory,
      updateNotificationSettings, updateLocationSettings,
      clearHistory,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside <AppProvider>');
  return ctx;
}
