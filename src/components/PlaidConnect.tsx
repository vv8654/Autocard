'use client';

import { useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Building2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PlaidConnection, PlaidAccount } from '../types';
import { plaidCategoryToAutoCard } from '../lib/plaidCategories';

type Status = 'idle' | 'loading-token' | 'ready' | 'exchanging' | 'success' | 'error';

interface Props {
  onSuccess?: (conn: PlaidConnection) => void;
}

export function PlaidConnect({ onSuccess }: Props) {
  const { addPlaidConnection } = useApp();
  const [status, setStatus]     = useState<Status>('idle');
  const [error, setError]       = useState<string | null>(null);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const fetchLinkToken = useCallback(async () => {
    setStatus('loading-token');
    setError(null);
    try {
      const res  = await fetch('/api/plaid/create-link-token', { method: 'POST', body: JSON.stringify({}) });
      const data = await res.json() as { link_token?: string; error?: string };
      if (!res.ok || !data.link_token) throw new Error(data.error ?? 'Failed to create link token');
      setLinkToken(data.link_token);
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setStatus('error');
    }
  }, []);

  const onPlaidSuccess = useCallback(async (publicToken: string) => {
    setStatus('exchanging');
    setError(null);
    try {
      // Exchange public token for encrypted access token
      const exchRes  = await fetch('/api/plaid/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken }),
      });
      const exchData = await exchRes.json() as { encrypted_token?: string; item_id?: string; error?: string };
      if (!exchRes.ok || !exchData.encrypted_token || !exchData.item_id) {
        throw new Error(exchData.error ?? 'Token exchange failed');
      }

      // Fetch initial transactions
      const txRes  = await fetch('/api/plaid/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encrypted_token: exchData.encrypted_token }),
      });
      const txData = await txRes.json() as {
        transactions?: Array<{
          transaction_id: string;
          date: string;
          name: string;
          amount: number;
          personal_finance_category?: { primary?: string; detailed?: string };
          category?: string[];
          account_id: string;
        }>;
        accounts?: Array<{
          account_id: string;
          name: string;
          mask: string;
          type: string;
          subtype: string;
        }>;
        error?: string;
      };

      const accounts: PlaidAccount[] = (txData.accounts ?? []).map(a => ({
        id:      a.account_id,
        name:    a.name,
        mask:    a.mask ?? '????',
        type:    a.type ?? 'unknown',
        subtype: a.subtype ?? 'unknown',
      }));

      const transactions = (txData.transactions ?? []).map(t => ({
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

      // Derive institution name from first account type or fallback
      const institutionName = accounts.length > 0
        ? `${accounts[0].name.split(' ')[0]} Bank`
        : 'Connected Bank';

      const conn: PlaidConnection = {
        id:               exchData.item_id,
        institutionName,
        encryptedToken:   exchData.encrypted_token,
        accounts,
        lastSynced:       new Date().toISOString(),
        transactions,
      };

      addPlaidConnection(conn);
      onSuccess?.(conn);
      setStatus('success');
      setLinkToken(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setStatus('error');
    }
  }, [addPlaidConnection, onSuccess]);

  const { open, ready } = usePlaidLink({
    token:     linkToken ?? '',
    onSuccess: (publicToken) => onPlaidSuccess(publicToken),
    onExit:    () => { setStatus('idle'); setLinkToken(null); },
  });

  // Auto-open Plaid Link once token is ready
  const handleConnect = async () => {
    if (status === 'idle' || status === 'error') {
      await fetchLinkToken();
    }
  };

  // Once we have a token and the hook is ready, open the Link UI
  if (status === 'ready' && ready && linkToken) {
    open();
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
        <CheckCircle size={20} className="text-green-600 flex-shrink-0"/>
        <div>
          <p className="text-sm font-semibold text-green-800">Account connected!</p>
          <p className="text-xs text-green-600">Transactions imported. Tap again to add another.</p>
        </div>
        <button
          onClick={() => setStatus('idle')}
          className="ml-auto text-xs text-green-600 font-semibold underline"
        >
          Add more
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={status === 'loading-token' || status === 'exchanging'}
      className="w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 text-left transition-all hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-60"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
        {(status === 'loading-token' || status === 'exchanging')
          ? <Loader2 size={20} className="text-indigo-600 animate-spin"/>
          : <Building2 size={20} className="text-indigo-600"/>
        }
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-indigo-700">
          {status === 'loading-token' ? 'Preparing connection…'
            : status === 'exchanging'  ? 'Importing transactions…'
            : 'Connect Bank or Credit Card'}
        </p>
        <p className="text-xs text-indigo-400 mt-0.5">
          {status === 'error'
            ? <span className="text-red-500">{error}</span>
            : 'Powered by Plaid · read-only · secure'}
        </p>
      </div>
      {status !== 'loading-token' && status !== 'exchanging' && (
        <AlertCircle
          size={16}
          className={`flex-shrink-0 ${status === 'error' ? 'text-red-400' : 'text-indigo-300'}`}
        />
      )}
    </button>
  );
}
