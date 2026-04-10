'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
} from 'react';
import { AppState, Recommendation, NotificationSettings } from '../types';
import { loadState, saveState } from '../lib/storage';
import { CARDS } from '../data/cards';
import { CreditCard } from '../types';

interface AppContextValue {
  state: AppState;
  enabledCards: CreditCard[];
  toggleCard: (cardId: string) => void;
  addToHistory: (rec: Recommendation) => void;
  updateNotificationSettings: (s: NotificationSettings) => void;
  clearHistory: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  // Persist to localStorage whenever state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  const enabledCards = useMemo(
    () => CARDS.filter(c => state.enabledCardIds.includes(c.id)),
    [state.enabledCardIds]
  );

  function toggleCard(cardId: string) {
    setState(prev => ({
      ...prev,
      enabledCardIds: prev.enabledCardIds.includes(cardId)
        ? prev.enabledCardIds.filter(id => id !== cardId)
        : [...prev.enabledCardIds, cardId],
    }));
  }

  function addToHistory(rec: Recommendation) {
    setState(prev => ({
      ...prev,
      history: [rec, ...prev.history].slice(0, 20), // cap at 20 entries
    }));
  }

  function updateNotificationSettings(s: NotificationSettings) {
    setState(prev => ({ ...prev, notificationSettings: s }));
  }

  function clearHistory() {
    setState(prev => ({ ...prev, history: [] }));
  }

  return (
    <AppContext.Provider
      value={{
        state,
        enabledCards,
        toggleCard,
        addToHistory,
        updateNotificationSettings,
        clearHistory,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
