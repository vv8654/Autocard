import { NextRequest, NextResponse } from 'next/server';

/**
 * Plaid OAuth return endpoint.
 * After a user authenticates with an OAuth institution (e.g. Chase, Bank of America),
 * Plaid redirects back here with an oauth_state_id query param.
 * We redirect to the app's settings page so the PlaidConnect component can
 * resume the Link flow using the received oauth_state_id.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const oauthStateId = searchParams.get('oauth_state_id') ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://autocard-nine.vercel.app';
  // Pass the state back to the client via query param so PlaidLink can resume
  return NextResponse.redirect(`${appUrl}/settings?oauth_state_id=${oauthStateId}`);
}
