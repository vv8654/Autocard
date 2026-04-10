'use client';

/**
 * Settings Page — Iteration 3
 *
 * Before: No settings at all. Every simulated scenario triggered a recommendation.
 * After:  Users can control notification frequency (all / high-value only / off)
 *         and choose which spending categories they care about.
 *
 * Why it matters: Notification fatigue is a top product risk. This screen lets
 * users tune their experience without disabling the app entirely.
 */

import { Bell, BellOff, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, NotificationFrequency } from '../../types';
import { BottomNav } from '../../components/BottomNav';

const FREQUENCY_OPTIONS: {
  value: NotificationFrequency;
  label: string;
  description: string;
  Icon: React.ElementType;
}[] = [
  {
    value: 'all',
    label: 'All Recommendations',
    description: 'Get a recommendation every time you simulate a purchase',
    Icon: Bell,
  },
  {
    value: 'high-value',
    label: 'High Value Only',
    description: 'Only show recommendations where you can earn 5¢+ per dollar',
    Icon: Zap,
  },
  {
    value: 'off',
    label: 'Off',
    description: 'Disable recommendations — browse cards manually',
    Icon: BellOff,
  },
];

const CATEGORY_OPTIONS: { id: Category; label: string; emoji: string }[] = [
  { id: 'dining',    label: 'Dining',             emoji: '🍽️' },
  { id: 'grocery',   label: 'Grocery',             emoji: '🛒' },
  { id: 'travel',    label: 'Travel',              emoji: '✈️' },
  { id: 'transit',   label: 'Transit / Rideshare', emoji: '🚗' },
  { id: 'pharmacy',  label: 'Pharmacy',            emoji: '💊' },
  { id: 'streaming', label: 'Streaming',           emoji: '🎬' },
  { id: 'gas',       label: 'Gas',                 emoji: '⛽' },
];

export default function SettingsPage() {
  const { state, updateNotificationSettings } = useApp();
  const { notificationSettings: settings } = state;

  function setFrequency(frequency: NotificationFrequency) {
    updateNotificationSettings({ ...settings, frequency });
  }

  function toggleCategory(category: Category) {
    const current = settings.enabledCategories;
    const next = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    updateNotificationSettings({ ...settings, enabledCategories: next });
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-5 pt-14 pb-7">
        <h1 className="text-white text-2xl font-black">Settings</h1>
        <p className="text-indigo-200 text-sm mt-1">
          Customize how AutoCard surfaces recommendations
        </p>
      </div>

      <div className="px-4 pt-6 space-y-8">
        {/* ── Notification Frequency ──────────────────────────────────── */}
        <section>
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
            Notification Frequency
          </h2>
          <div className="space-y-2">
            {FREQUENCY_OPTIONS.map(({ value, label, description, Icon }) => {
              const active = settings.frequency === value;
              return (
                <button
                  key={value}
                  onClick={() => setFrequency(value)}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all ${
                    active
                      ? 'border-indigo-300 bg-indigo-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${active ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                  </div>
                  {/* Selection indicator */}
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    active
                      ? 'border-indigo-600 bg-indigo-600'
                      : 'border-gray-300'
                  }`}>
                    {active && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Category Preferences ────────────────────────────────────── */}
        <section>
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1">
            Categories I care about
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Uncheck categories to reduce noise from purchases you rarely make
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_OPTIONS.map(({ id, label, emoji }) => {
              const active = settings.enabledCategories.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleCategory(id)}
                  className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 text-left transition-all ${
                    active
                      ? 'border-indigo-200 bg-indigo-50'
                      : 'border-gray-100 bg-white opacity-50'
                  }`}
                >
                  <span className="text-xl leading-none">{emoji}</span>
                  <span className={`text-xs font-semibold ${active ? 'text-indigo-700' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Prototype Disclaimer ────────────────────────────────────── */}
        <section className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="font-semibold text-gray-500">Prototype note:</span> AutoCard uses
            mock purchase context to simulate recommendations. No real location data, banking
            APIs, or account linking is used. All card data is illustrative.
          </p>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
