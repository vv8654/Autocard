'use client';

import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import {
  AppState, Bonus, CreditCard, LocationSettings, ManualLocation,
  NotificationSettings, PlaidConnection, PlaidTransaction, RedemptionStyle, Recommendation,
} from '../types';
import { loadState, saveState } from '../lib/storage';
import { CARDS, PRESET_BONUSES } from '../data/cards';

interface AppContextValue {
  state: AppState;
  enabledCards: CreditCard[];
  toggleCard:                 (id: string) => void;
  addToHistory:               (rec: Recommendation) => void;
  updateNotificationSettings: (s: NotificationSettings) => void;
  updateLocationSettings:     (s: LocationSettings) => void;
  updateRedemptionStyle:      (style: RedemptionStyle) => void;
  activateBonus:              (cardId: string) => void;
  deactivateBonus:            (cardId: string) => void;
  updateBonusSpend:           (cardId: string, amount: number) => void;
  setManualLocation:          (loc: ManualLocation | null) => void;
  clearHistory:               () => void;
  addPlaidConnection:         (conn: PlaidConnection) => void;
  removePlaidConnection:      (itemId: string) => void;
  updatePlaidTransactions:    (itemId: string, transactions: PlaidTransaction[], lastSynced: string) => void;
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
    setState(prev => {
      const newHistory = [rec, ...prev.history].slice(0, 20);
      // Auto-increment currentSpend for active bonus on the recommended card
      const bonuses = prev.bonuses.map(b => {
        if (b.cardId === rec.best.card.id && b.active && b.currentSpend < b.requiredSpend) {
          return {
            ...b,
            currentSpend: Math.min(b.requiredSpend, b.currentSpend + rec.context.estimatedAmount),
          };
        }
        return b;
      });
      return { ...prev, history: newHistory, bonuses };
    });
  }

  function updateNotificationSettings(s: NotificationSettings) {
    setState(prev => ({ ...prev, notificationSettings: s }));
  }

  function updateLocationSettings(s: LocationSettings) {
    setState(prev => ({ ...prev, locationSettings: s }));
  }

  function updateRedemptionStyle(style: RedemptionStyle) {
    setState(prev => ({ ...prev, redemptionStyle: style }));
  }

  function activateBonus(cardId: string) {
    setState(prev => {
      const existing = prev.bonuses.find(b => b.cardId === cardId);
      if (existing) {
        // Re-activate if already exists
        return {
          ...prev,
          bonuses: prev.bonuses.map(b =>
            b.cardId === cardId ? { ...b, active: true } : b,
          ),
        };
      }
      // Create from preset
      const preset = PRESET_BONUSES.find(p => p.cardId === cardId);
      if (!preset) return prev;
      const newBonus: Bonus = { ...preset, currentSpend: 0, active: true };
      return { ...prev, bonuses: [...prev.bonuses, newBonus] };
    });
  }

  function deactivateBonus(cardId: string) {
    setState(prev => ({
      ...prev,
      bonuses: prev.bonuses.map(b =>
        b.cardId === cardId ? { ...b, active: false } : b,
      ),
    }));
  }

  function updateBonusSpend(cardId: string, amount: number) {
    setState(prev => ({
      ...prev,
      bonuses: prev.bonuses.map(b => {
        if (b.cardId !== cardId) return b;
        return { ...b, currentSpend: Math.min(b.requiredSpend, Math.max(0, b.currentSpend + amount)) };
      }),
    }));
  }

  function clearHistory() {
    setState(prev => ({ ...prev, history: [] }));
  }

  function setManualLocation(loc: ManualLocation | null) {
    setState(prev => ({ ...prev, manualLocation: loc }));
  }

  function addPlaidConnection(conn: PlaidConnection) {
    setState(prev => ({
      ...prev,
      plaidConnections: [
        // Replace existing connection with same item_id if present
        ...prev.plaidConnections.filter(c => c.id !== conn.id),
        conn,
      ],
    }));
  }

  function removePlaidConnection(itemId: string) {
    setState(prev => ({
      ...prev,
      plaidConnections: prev.plaidConnections.filter(c => c.id !== itemId),
    }));
  }

  function updatePlaidTransactions(itemId: string, transactions: PlaidTransaction[], lastSynced: string) {
    setState(prev => ({
      ...prev,
      plaidConnections: prev.plaidConnections.map(c =>
        c.id === itemId ? { ...c, transactions, lastSynced } : c,
      ),
    }));
  }

  return (
    <AppContext.Provider value={{
      state, enabledCards,
      toggleCard, addToHistory,
      updateNotificationSettings, updateLocationSettings,
      updateRedemptionStyle,
      activateBonus, deactivateBonus, updateBonusSpend,
      setManualLocation,
      clearHistory,
      addPlaidConnection,
      removePlaidConnection,
      updatePlaidTransactions,
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
