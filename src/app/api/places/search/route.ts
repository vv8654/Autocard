import { NextRequest, NextResponse } from 'next/server';
import { Category } from '../../../../types';

const FSQ_CATEGORY_MAP: Record<number, Category> = {
  13000: 'dining', 13065: 'dining', 13032: 'dining', 13003: 'dining',
  13199: 'dining', 13009: 'dining', 13046: 'dining', 13049: 'dining',
  13145: 'dining',
  17069: 'grocery', 17034: 'grocery', 17070: 'grocery',
  15014: 'pharmacy', 15039: 'pharmacy',
  19040: 'gas', 19041: 'gas',
  19047: 'travel', 19050: 'travel', 19046: 'travel',
  19014: 'transit', 19061: 'transit', 19057: 'transit', 19069: 'transit',
  10027: 'streaming',
  17000: 'general', 11000: 'general',
};

function mapFsqCategory(categories: Array<{ id: number; name: string }>): Category {
  for (const { id } of (categories ?? [])) {
    if (FSQ_CATEGORY_MAP[id]) return FSQ_CATEGORY_MAP[id];
    const broad = Math.floor(id / 1000) * 1000;
    if (FSQ_CATEGORY_MAP[broad]) return FSQ_CATEGORY_MAP[broad];
  }
  return 'general';
}

interface FsqPlace {
  fsq_id: string;
  name: string;
  categories?: Array<{ id: number; name: string }>;
  location?: {
    address?: string;
    locality?: string;
    region?: string;
    formatted_address?: string;
  };
  distance?: number;
}

function formatPlace(p: FsqPlace) {
  const category = mapFsqCategory(p.categories ?? []);
  const address  =
    p.location?.formatted_address ??
    [p.location?.address, p.location?.locality].filter(Boolean).join(', ') ??
    undefined;
  return { id: p.fsq_id, name: p.name, category, address, distance: p.distance };
}

const BASE = 'https://api.foursquare.com/v3';
const FIELDS = 'fsq_id,name,categories,location,distance';

async function autocomplete(
  query: string,
  apiKey: string,
  coords?: { lat: string; lon: string },
): Promise<ReturnType<typeof formatPlace>[]> {
  const params = new URLSearchParams({ query, limit: '10', types: 'place', fields: FIELDS });
  if (coords) params.set('ll', `${coords.lat},${coords.lon}`);

  const res = await fetch(`${BASE}/autocomplete?${params}`, {
    headers: { Authorization: apiKey, Accept: 'application/json' },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];

  const data = await res.json() as {
    results?: Array<{ type: string; place?: FsqPlace }>
  };
  return (data.results ?? [])
    .filter(r => r.type === 'place' && r.place)
    .map(r => formatPlace(r.place!));
}

async function nearbySearch(
  query: string,
  apiKey: string,
  coords?: { lat: string; lon: string },
): Promise<ReturnType<typeof formatPlace>[]> {
  const params = new URLSearchParams({
    query,
    limit: '10',
    fields: FIELDS,
    sort: coords ? 'DISTANCE' : 'RELEVANCE',
  });
  if (coords) {
    params.set('ll', `${coords.lat},${coords.lon}`);
    params.set('radius', '40000');
  } else {
    params.set('near', 'United States');
  }

  const res = await fetch(`${BASE}/places/search?${params}`, {
    headers: { Authorization: apiKey, Accept: 'application/json' },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];

  const data = await res.json() as { results?: FsqPlace[] };
  return (data.results ?? []).map(formatPlace);
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'FOURSQUARE_API_KEY not configured' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') ?? '';
  const lat   = searchParams.get('lat') ?? undefined;
  const lon   = searchParams.get('lon') ?? undefined;

  if (!query.trim()) return NextResponse.json({ results: [] });

  const coords = lat && lon ? { lat, lon } : undefined;

  // Try autocomplete first (best for typeahead — handles partial queries)
  let results = await autocomplete(query, apiKey, coords);

  // If autocomplete returns nothing, fall back to regular search
  if (results.length === 0) {
    results = await nearbySearch(query, apiKey, coords);
  }

  // If still nothing and we have coords, broaden to nearby-only (no query filter)
  if (results.length === 0 && coords) {
    results = await nearbySearch(query, apiKey); // US-wide as last resort
  }

  return NextResponse.json({ results });
}
