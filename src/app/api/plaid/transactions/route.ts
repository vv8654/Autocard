import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import crypto from 'crypto';

function getClient() {
  const clientId = process.env.PLAID_CLIENT_ID!;
  const secret   = process.env.PLAID_SECRET!;
  const env      = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments;
  return new PlaidApi(new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: { headers: { 'PLAID-CLIENT-ID': clientId, 'PLAID-SECRET': secret } },
  }));
}

function decryptToken(ciphertext: string): string {
  const hex = process.env.PLAID_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) throw new Error('PLAID_ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
  const key = Buffer.from(hex, 'hex');
  const [ivHex, encHex, tagHex] = ciphertext.split(':');
  if (!ivHex || !encHex || !tagHex) throw new Error('Invalid encrypted token format');
  const iv  = Buffer.from(ivHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

export async function POST(req: NextRequest) {
  try {
    const { encrypted_token } = await req.json();
    if (!encrypted_token) {
      return NextResponse.json({ error: 'encrypted_token required' }, { status: 400 });
    }

    const access_token = decryptToken(encrypted_token);
    const client = getClient();

    const endDate   = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const response = await client.transactionsGet({
      access_token,
      start_date: startDate,
      end_date:   endDate,
      options:    { count: 100, offset: 0 },
    });

    return NextResponse.json({
      transactions: response.data.transactions,
      accounts:     response.data.accounts,
      total_transactions: response.data.total_transactions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
