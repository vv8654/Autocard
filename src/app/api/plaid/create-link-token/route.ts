import { NextRequest, NextResponse } from 'next/server';
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

function getClient() {
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret   = process.env.PLAID_SECRET;
  const env      = (process.env.PLAID_ENV ?? 'sandbox') as keyof typeof PlaidEnvironments;
  if (!clientId || !secret) throw new Error('PLAID_CLIENT_ID / PLAID_SECRET not configured');
  return new PlaidApi(new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: { headers: { 'PLAID-CLIENT-ID': clientId, 'PLAID-SECRET': secret } },
  }));
}

export async function POST(req: NextRequest) {
  try {
    const client = getClient();
    const { userId = 'autocard-user' } = await req.json().catch(() => ({}));
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autocard-nine.vercel.app';
    const redirectUri = `${appUrl}/api/plaid/oauth-return`;

    const body: Parameters<typeof client.linkTokenCreate>[0] = {
      user: { client_user_id: String(userId) },
      client_name: 'AutoCard',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    // redirect_uri is required for OAuth institutions in production
    if (process.env.PLAID_ENV === 'production') {
      body.redirect_uri = redirectUri;
    }

    const response = await client.linkTokenCreate(body);
    return NextResponse.json({ link_token: response.data.link_token });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
