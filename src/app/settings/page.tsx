'use client';

import { Bell, BellOff, Zap, MapPin, MapPinOff, TrendingUp, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, NotificationFrequency, RedemptionStyle } from '../../types';
import { BottomNav } from '../../components/BottomNav';
import { requestNotificationPermission } from '../../lib/location';
import { REDEMPTION_STYLE_INFO } from '../../lib/pointValues';
import { PlaidConnect } from '../../components/PlaidConnect';

const FREQUENCY_OPTIONS: {
  value: NotificationFrequency;
  label: string;
  description: string;
  Icon: React.ElementType;
}[] = [
  { value: 'all',        label: 'All Recommendations',  description: 'Get a tip every time you simulate a purchase',               Icon: Bell    },
  { value: 'high-value', label: 'High Value Only',       description: 'Only when you can earn 5¢+ per dollar — the big moments',    Icon: Zap     },
  { value: 'off',        label: 'Off',                   description: 'No tips — browse cards and search manually',                  Icon: BellOff },
];

const CATEGORY_OPTIONS: { id: Category; label: string; emoji: string }[] = [
  { id: 'dining',    label: 'Dining',             emoji: '🍽️' },
  { id: 'grocery',   label: 'Grocery',             emoji: '🛒' },
  { id: 'travel',    label: 'Travel',              emoji: '✈️' },
  { id: 'transit',   label: 'Transit / Rideshare', emoji: '🚗' },
  { id: 'pharmacy',  label: 'Pharmacy',            emoji: '💊' },
  { id: 'streaming', label: 'Streaming',           emoji: '🎬' },
  { id: 'gas',       label: 'Gas',                 emoji: '⛽' },
  { id: 'online',    label: 'Online Shopping',     emoji: '📦' },
];

const STYLE_OPTIONS: RedemptionStyle[] = ['simple', 'balanced', 'max'];

export default function SettingsPage() {
  const { state, updateNotificationSettings, updateLocationSettings, updateRedemptionStyle, removePlaidConnection } = useApp();
  const { notificationSettings: ns, locationSettings: ls, redemptionStyle } = state;

  function setFrequency(frequency: NotificationFrequency) {
    updateNotificationSettings({ ...ns, frequency });
  }

  function toggleCategory(category: Category) {
    const next = ns.enabledCategories.includes(category)
      ? ns.enabledCategories.filter(c => c !== category)
      : [...ns.enabledCategories, category];
    updateNotificationSettings({ ...ns, enabledCategories: next });
  }

  async function toggleLocation() {
    if (ls.enabled) {
      updateLocationSettings({ ...ls, enabled: false });
    } else {
      const perm = await requestNotificationPermission();
      updateLocationSettings({ ...ls, enabled: true, browserNotifications: perm === 'granted' });
    }
  }

  async function toggleBrowserNotifications() {
    if (ls.browserNotifications) {
      updateLocationSettings({ ...ls, browserNotifications: false });
    } else {
      const perm = await requestNotificationPermission();
      updateLocationSettings({ ...ls, browserNotifications: perm === 'granted' });
    }
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-5 pt-14 pb-7">
        <h1 className="text-white text-2xl font-black">Settings</h1>
        <p className="text-indigo-200 text-sm mt-1">Customize your AutoCard experience</p>
      </div>

      <div className="px-4 pt-6 space-y-8">

        {/* ── How Do You Use Points? ─────────────────────────────────────── */}
        <section>
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1">
            How Do You Use Points?
          </h2>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            This changes how point-based rewards (MR, UR, Miles) are valued in recommendations.
          </p>
          <div className="space-y-2">
            {STYLE_OPTIONS.map(style => {
              const info   = REDEMPTION_STYLE_INFO[style];
              const active = redemptionStyle === style;
              return (
                <button
                  key={style}
                  onClick={() => updateRedemptionStyle(style)}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all ${
                    active ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
                    <TrendingUp size={18}/>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${active ? 'text-indigo-700' : 'text-gray-800'}`}>
                      {info.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{info.description}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5 italic">{info.example}</p>
                  </div>
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    active ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                  }`}>
                    {active && <div className="w-2 h-2 bg-white rounded-full"/>}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-2 px-1">
            &quot;Balanced&quot; is the default. Switch to &quot;Max Value&quot; if you regularly transfer points to airline partners.
          </p>
        </section>

        {/* ── Location & Nearby ─────────────────────────────────────────── */}
        <section>
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
            Location & Nearby Alerts
          </h2>

          <button
            onClick={toggleLocation}
            className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 text-left transition-all mb-2 ${
              ls.enabled ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-white'
            }`}
          >
            <div className={`flex-shrink-0 ${ls.enabled ? 'text-indigo-600' : 'text-gray-400'}`}>
              {ls.enabled ? <MapPin size={20}/> : <MapPinOff size={20}/>}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${ls.enabled ? 'text-indigo-700' : 'text-gray-800'}`}>
                Detect Nearby Businesses
              </p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                AutoCard watches your location and surfaces the best card when you&apos;re near a restaurant, store, or gas station.
              </p>
            </div>
            <div className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors relative ${
              ls.enabled ? 'bg-indigo-600' : 'bg-gray-200'
            }`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                ls.enabled ? 'left-6' : 'left-1'
              }`}/>
            </div>
          </button>

          {ls.enabled && (
            <button
              onClick={toggleBrowserNotifications}
              className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 text-left transition-all ${
                ls.browserNotifications ? 'border-indigo-200 bg-indigo-50/60' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className={`flex-shrink-0 ${ls.browserNotifications ? 'text-indigo-500' : 'text-gray-400'}`}>
                <Bell size={18}/>
              </div>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${ls.browserNotifications ? 'text-indigo-700' : 'text-gray-700'}`}>
                  Browser Notifications
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {ls.browserNotifications
                    ? 'Enabled — you\'ll get alerts even when the app is in the background'
                    : 'Tap to request permission for background alerts'}
                </p>
              </div>
              <div className={`flex-shrink-0 w-11 h-6 rounded-full transition-colors relative ${
                ls.browserNotifications ? 'bg-indigo-500' : 'bg-gray-200'
              }`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  ls.browserNotifications ? 'left-6' : 'left-1'
                }`}/>
              </div>
            </button>
          )}

          {ls.enabled && (
            <p className="text-[11px] text-gray-400 mt-2 px-1 leading-relaxed">
              Uses your browser&apos;s Geolocation API + OpenStreetMap. No data leaves your device.
            </p>
          )}
        </section>

        {/* ── Notification Frequency ────────────────────────────────────── */}
        <section>
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
            Recommendation Frequency
          </h2>
          <div className="space-y-2">
            {FREQUENCY_OPTIONS.map(({ value, label, description, Icon }) => {
              const active = ns.frequency === value;
              return (
                <button
                  key={value}
                  onClick={() => setFrequency(value)}
                  className={`w-full flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all ${
                    active ? 'border-indigo-300 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className={`mt-0.5 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-gray-400'}`}>
                    <Icon size={18}/>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${active ? 'text-indigo-700' : 'text-gray-800'}`}>{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
                  </div>
                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    active ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                  }`}>
                    {active && <div className="w-2 h-2 bg-white rounded-full"/>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Category Preferences ──────────────────────────────────────── */}
        <section>
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1">
            Categories I Care About
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Uncheck categories to filter out recommendations you don&apos;t need
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_OPTIONS.map(({ id, label, emoji }) => {
              const active = ns.enabledCategories.includes(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleCategory(id)}
                  className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 text-left transition-all ${
                    active ? 'border-indigo-200 bg-indigo-50' : 'border-gray-100 bg-white opacity-50'
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

        {/* ── Connected Accounts ────────────────────────────────────────── */}
        <section>
          <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1">
            Connected Accounts
          </h2>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Link your bank or credit card to import real transactions and get more accurate recommendations.
          </p>

          {/* Existing connections */}
          {state.plaidConnections.length > 0 && (
            <div className="space-y-2 mb-3">
              {state.plaidConnections.map(conn => (
                <div
                  key={conn.id}
                  className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-100"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                    <span className="text-lg">🏦</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{conn.institutionName}</p>
                    <p className="text-xs text-gray-400">
                      {conn.accounts.length} account{conn.accounts.length !== 1 ? 's' : ''} ·{' '}
                      {conn.transactions.length} transactions
                      {conn.lastSynced ? ` · synced ${new Date(conn.lastSynced).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => removePlaidConnection(conn.id)}
                    className="flex-shrink-0 p-2 text-gray-300 hover:text-red-400 transition-colors"
                    aria-label="Remove connection"
                  >
                    <Trash2 size={16}/>
                  </button>
                </div>
              ))}
            </div>
          )}

          <PlaidConnect/>

          <p className="text-[11px] text-gray-400 mt-2 px-1 leading-relaxed">
            Read-only access only. Your credentials are never stored — only an encrypted token is kept locally.
            By connecting, you agree to{' '}
            <a
              href="https://plaid.com/legal/#end-user-privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-indigo-400"
            >
              Plaid&apos;s End User Privacy Policy
            </a>{' '}
            and our{' '}
            <a href="/privacy" className="underline text-indigo-400">Privacy Policy</a>.
          </p>
        </section>

        {/* Disclaimer */}
        <section className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed">
            <span className="font-semibold text-gray-500">Prototype note:</span> Location uses your browser&apos;s Geolocation API
            and OpenStreetMap&apos;s free Overpass API.
          </p>
        </section>
      </div>

      <BottomNav/>
    </div>
  );
}
