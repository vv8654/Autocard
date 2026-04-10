import { Merchant } from '../types';

export const MERCHANTS: Merchant[] = [
  {
    id: 'heb',
    name: 'H-E-B',
    displayName: 'H-E-B',
    category: 'grocery',
    emoji: '🛒',
    scenarioLabel: 'Groceries',
  },
  {
    id: 'chipotle',
    name: 'Chipotle Mexican Grill',
    displayName: 'Chipotle',
    category: 'dining',
    emoji: '🌮',
    scenarioLabel: 'Dining',
  },
  {
    id: 'delta',
    name: 'Delta Airlines',
    displayName: 'Delta',
    category: 'travel',
    emoji: '✈️',
    scenarioLabel: 'Travel',
  },
  {
    id: 'uber',
    name: 'Uber',
    displayName: 'Uber',
    category: 'transit',
    emoji: '🚗',
    scenarioLabel: 'Transit / Rideshare',
  },
  {
    id: 'walgreens',
    name: 'Walgreens',
    displayName: 'Walgreens',
    category: 'pharmacy',
    emoji: '💊',
    scenarioLabel: 'Pharmacy',
  },
  {
    id: 'whole-foods',
    name: 'Whole Foods Market',
    displayName: 'Whole Foods',
    category: 'grocery',
    emoji: '🌿',
    scenarioLabel: 'Groceries',
  },
  {
    id: 'netflix',
    name: 'Netflix',
    displayName: 'Netflix',
    category: 'streaming',
    emoji: '🎬',
    scenarioLabel: 'Streaming',
  },
  {
    id: 'shell',
    name: 'Shell',
    displayName: 'Shell Gas',
    category: 'gas',
    emoji: '⛽',
    scenarioLabel: 'Gas',
  },
];

/** The 5 scenarios shown as quick-pick buttons on the dashboard */
export const DASHBOARD_SCENARIO_IDS = ['heb', 'chipotle', 'delta', 'uber', 'walgreens'];
