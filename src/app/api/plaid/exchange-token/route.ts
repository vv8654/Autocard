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

function getEncryptionKey(): Buffer {
  const hex = process.env.PLAID_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) throw new Error('PLAID_ENCRYPTION_KEY must be 64 hex chars (32 bytes)');
  return Buffer.from(hex, 'hex');
}

function encryptToken(plaintext: string): string {
  const key = getEncryptionKey();
  const iv  = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('hex'), enc.toString('hex'), tag.toString('hex')].join(':');
}

export async function POST(req: NextRequest) {
  try {
    const { public_token } = await req.json();
    const client   = getClient();
    const response = await client.itemPublicTokenExchange({ public_token });
    const encrypted_token = encryptToken(response.data.access_token);
    return NextResponse.json({ encrypted_token, item_id: response.data.item_id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
