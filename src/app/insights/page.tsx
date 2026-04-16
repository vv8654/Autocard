'use client';

import { useState, useMemo } from 'react';
import { BarChart2, TrendingUp, TrendingDown, Minus, CreditCard, RefreshCw, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CARDS } from '../../data/cards';
import { simulateCard } from '../../lib/insights';
import { BottomNav } from '../../components/BottomNav';
import { plaidCategoryToAutoCard, CATEGORY_LABEL } from '../../lib/plaidCategories';
import { Category, PlaidTransaction } from '../../types';

type Tab = 'simulator' | 'spending';

const CATEGORY_EMOJI: Record<string, string> = {
  dining:    '🍽️',
  grocery:   '🛒',
  travel:    '✈️',
  transit:   '🚗',
  pharmacy:  '💊',
  streaming: '🎬',
  gas:       '⛽',
  online:    '📦',
  general:   '🏪',
};

// Compute which card would have been best for a Plaid transaction
function bestCardForTx(tx: PlaidTransaction, enabledCardIds: string[]) {
  const enabledCards = CARDS.filter(c => enabledCardIds.includes(c.id));
  if (!enabledCards.length) return null;
  let best = enabledCards[0];
  let bestRate = 0;
  for (const card of enabledCards) {
    const rr = card.rewards.find(r => r.category === tx.category);
    const rate = (rr?.multiplier ?? card.baseMultiplier) * card.pointValue;
    if (rate > bestRate) { bestRate = rate; best = card; }
  }
  return { card: best, centsPerDollar: bestRate };
}

export default function InsightsPage() {
  const { state, updatePlaidTransactions } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('simulator');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null); // item_id being synced

  const simulation = useMemo(() => {
    if (!selectedCardId) return null;
    return simulateCard(selectedCardId, state.history, CARDS);
  }, [selectedCardId, state.history]);

  const selectedCard = CARDS.find(c => c.id === selectedCardId);
  const hasHistory   = state.history.length > 0;
  const hasPlaid     = state.plaidConnections.length > 0;

  // Aggregate all transactions across connections
  const allTransactions = useMemo(() =>
    state.plaidConnections.flatMap(c => c.transactions)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [state.plaidConnections]
  );

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    for (const tx of allTransactions) {
      if (tx.amount <= 0) continue; // skip credits/refunds
      const key = tx.category;
      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += tx.amount;
      map[key].count += 1;
    }
    return Object.entries(map)
      .map(([cat, v]) => ({ category: cat as Category, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [allTransactions]);

  const totalSpend = useMemo(
    () => allTransactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    [allTransactions]
  );

  // Missed rewards: for each tx, compute best card vs 1% baseline
  const missedRewards = useMemo(() => {
    let missed = 0;
    for (const tx of allTransactions) {
      if (tx.amount <= 0) continue;
      const result = bestCardForTx(tx, state.enabledCardIds);
      if (!result) continue;
      // Baseline: 1¢/$ (1% flat)
      missed += ((result.centsPerDollar - 1) / 100) * tx.amount;
    }
    return missed;
  }, [allTransactions, state.enabledCardIds]);

  async function syncConnection(itemId: string, encryptedToken: string) {
    setSyncing(itemId);
    try {
      const res  = await fetch('/api/plaid/transactions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ encrypted_token: encryptedToken }),
      });
      const data = await res.json() as {
        transactions?: Array<{
          transaction_id: string; date: string; name: string; amount: number;
          personal_finance_category?: { primary?: string; detailed?: string };
          category?: string[]; account_id: string;
        }>;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Sync failed');
      const transactions = (data.transactions ?? []).map(t => ({
        id:          t.transaction_id,
        date:        t.date,
        name:        t.name,
        amount:      t.amount,
        category:    plaidCategoryToAutoCard(
          t.personal_finance_category?.detailed ?? t.personal_finance_category?.primary ?? null,
          t.category ?? null,
        ),
        rawCategory: t.personal_finance_category?.primary ?? t.category?.[0] ?? 'Unknown',
        accountId:   t.account_id,
      }));
      updatePlaidTransactions(itemId, transactions, new Date().toISOString());
    } catch { /* silent — UI stays as-is */ }
    setSyncing(null);
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 px-5 pt-14 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <BarChart2 size={22} className="text-white"/>
          <h1 className="text-white text-2xl font-black">Insights</h1>
        </div>
        <p className="text-indigo-200 text-sm">
          Simulate card performance and analyze your real spending.
        </p>
        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          {(['simulator', 'spending'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white text-indigo-700'
                  : 'bg-white/20 text-white/80 hover:bg-white/30'
              }`}
            >
              {tab === 'simulator' ? 'What If?' : 'Spending'}
            </button>
          ))}
        </div>
      </div>

      {/* ── SIMULATOR TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'simulator' && (
        <div className="px-4 pt-5 space-y-6">

          {/* History summary strip */}
          <section>
            <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
              Your Purchase History
            </h2>
            {!hasHistory ? (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-gray-500 text-sm font-medium">No history yet</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed px-6">
                  Tap a scenario on the Home tab or search for a business to build your history first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {state.history.slice(0, 20).map(rec => (
                  <div
                    key={rec.id}
                    className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100"
                  >
                    <span className="text-xl leading-none flex-shrink-0">
                      {CATEGORY_EMOJI[rec.context.merchant.category] ?? '🏪'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {rec.context.merchant.displayName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {rec.best.card.shortName} · {rec.best.effectiveCPD.toFixed(1)}¢/$
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      ${((rec.best.effectiveCPD / 100) * rec.context.estimatedAmount).toFixed(2)} earned
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Card selector */}
          {hasHistory && (
            <section>
              <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-1">
                What If I Had…
              </h2>
              <p className="text-xs text-gray-500 mb-3">
                Select any card below to simulate your earnings
              </p>
              <div className="space-y-2.5">
                {CARDS.map(card => {
                  const active = selectedCardId === card.id;
                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(prev => prev === card.id ? null : card.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                        active ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-10 h-6 rounded-lg bg-gradient-to-br ${card.gradient}`}/>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${active ? 'text-indigo-800' : 'text-gray-900'}`}>
                          {card.shortName}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">{card.keyBenefit}</p>
                      </div>
                      {!state.enabledCardIds.includes(card.id) && (
                        <span className="text-[9px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          not in wallet
                        </span>
                      )}
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        active ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                      }`}>
                        {active && <div className="w-1.5 h-1.5 bg-white rounded-full"/>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Simulation results */}
          {simulation && selectedCard && (
            <section>
              <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
                Simulation Results
              </h2>
              <div className={`p-4 rounded-2xl border mb-4 ${
                simulation.netDelta > 0 ? 'bg-green-50 border-green-200'
                  : simulation.netDelta < 0 ? 'bg-red-50 border-red-100'
                  : 'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {simulation.netDelta > 0
                    ? <TrendingUp size={16} className="text-green-600 flex-shrink-0"/>
                    : simulation.netDelta < 0
                      ? <TrendingDown size={16} className="text-red-500 flex-shrink-0"/>
                      : <Minus size={16} className="text-gray-400 flex-shrink-0"/>
                  }
                  <p className={`text-sm font-black ${
                    simulation.netDelta > 0 ? 'text-green-700' : simulation.netDelta < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {simulation.netDelta > 0
                      ? `+$${simulation.netDelta.toFixed(2)} more with ${selectedCard.shortName}`
                      : simulation.netDelta < 0
                        ? `$${Math.abs(simulation.netDelta).toFixed(2)} less with ${selectedCard.shortName}`
                        : `Same earnings with ${selectedCard.shortName}`}
                  </p>
                </div>
                <div className="flex gap-4 mt-2">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Actual earned</p>
                    <p className="text-base font-black text-gray-800">${simulation.totalActualValue.toFixed(2)}</p>
                  </div>
                  <div className="w-px bg-gray-200"/>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">With {selectedCard.shortName}</p>
                    <p className={`text-base font-black ${simulation.netDelta >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                      ${simulation.totalSimulatedValue.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  Based on your last {simulation.rows.length} purchase{simulation.rows.length !== 1 ? 's' : ''} · $50 avg spend assumed
                </p>
              </div>
              <div className="space-y-2">
                {simulation.rows.map((row, i) => {
                  const delta = row.deltaPerDollar;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100"
                    >
                      <span className="text-lg leading-none flex-shrink-0">
                        {CATEGORY_EMOJI[row.recommendation.context.merchant.category] ?? '🏪'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">
                          {row.recommendation.context.merchant.displayName}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Actual: {row.actualCPD.toFixed(1)}¢/$ · Simulated: {row.simulatedCPD.toFixed(1)}¢/$
                        </p>
                      </div>
                      <div className={`text-xs font-bold flex-shrink-0 ${
                        delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}¢/$
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {hasHistory && !selectedCardId && (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">Select a card above to run the simulation</p>
            </div>
          )}
        </div>
      )}

      {/* ── SPENDING TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'spending' && (
        <div className="px-4 pt-5 space-y-6">

          {!hasPlaid ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-4xl mb-3">🏦</p>
              <p className="text-gray-700 text-sm font-semibold">No accounts connected</p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed px-6">
                Go to Settings → Connected Accounts to link your bank or credit card via Plaid.
              </p>
            </div>
          ) : (
            <>
              {/* Sync buttons */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400">
                    Connected Accounts
                  </h2>
                </div>
                <div className="space-y-2">
                  {state.plaidConnections.map(conn => (
                    <div key={conn.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                      <span className="text-lg">🏦</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{conn.institutionName}</p>
                        <p className="text-xs text-gray-400">
                          {conn.transactions.length} transactions
                          {conn.lastSynced ? ` · ${new Date(conn.lastSynced).toLocaleDateString()}` : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => syncConnection(conn.id, conn.encryptedToken)}
                        disabled={syncing === conn.id}
                        className="p-2 text-indigo-400 hover:text-indigo-600 disabled:opacity-50"
                        aria-label="Refresh"
                      >
                        {syncing === conn.id
                          ? <Loader2 size={16} className="animate-spin"/>
                          : <RefreshCw size={16}/>
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Spend overview */}
              <section>
                <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
                  Last 30 Days
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl border border-gray-100 p-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Total Spend</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">${totalSpend.toFixed(0)}</p>
                    <p className="text-xs text-gray-400">{allTransactions.filter(t => t.amount > 0).length} transactions</p>
                  </div>
                  <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
                    <p className="text-[10px] text-indigo-400 uppercase tracking-wide">Potential Extra</p>
                    <p className="text-2xl font-black text-indigo-700 mt-1">
                      +${missedRewards.toFixed(2)}
                    </p>
                    <p className="text-xs text-indigo-400">vs 1% flat baseline</p>
                  </div>
                </div>
              </section>

              {/* Category breakdown */}
              {categoryBreakdown.length > 0 && (
                <section>
                  <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
                    Spending by Category
                  </h2>
                  <div className="space-y-2">
                    {categoryBreakdown.map(({ category, total, count }) => {
                      const pct = totalSpend > 0 ? (total / totalSpend) * 100 : 0;
                      return (
                        <div key={category} className="bg-white rounded-xl border border-gray-100 p-3">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <span className="text-lg leading-none">{CATEGORY_EMOJI[category] ?? '🏪'}</span>
                            <span className="text-sm font-semibold text-gray-900 flex-1">
                              {CATEGORY_LABEL[category as Category] ?? category}
                            </span>
                            <span className="text-sm font-bold text-gray-700">${total.toFixed(0)}</span>
                          </div>
                          {/* Progress bar */}
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-400 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {count} transaction{count !== 1 ? 's' : ''} · {pct.toFixed(0)}% of spend
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Recent transactions feed */}
              <section>
                <h2 className="text-[11px] uppercase tracking-widest font-bold text-gray-400 mb-3">
                  Recent Transactions
                </h2>
                <div className="space-y-1.5">
                  {allTransactions.slice(0, 30).map(tx => {
                    const best = bestCardForTx(tx, state.enabledCardIds);
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100"
                      >
                        <span className="text-base leading-none flex-shrink-0">
                          {CATEGORY_EMOJI[tx.category] ?? '🏪'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{tx.name}</p>
                          <p className="text-[10px] text-gray-400">
                            {tx.date}
                            {best && (
                              <> · <span className="text-indigo-500 font-medium">
                                <CreditCard size={9} className="inline -mt-0.5 mr-0.5"/>
                                {best.card.shortName}
                              </span></>
                            )}
                          </p>
                        </div>
                        <span className={`text-xs font-bold flex-shrink-0 ${
                          tx.amount < 0 ? 'text-green-600' : 'text-gray-700'
                        }`}>
                          {tx.amount < 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      )}

      <BottomNav/>
    </div>
  );
}
