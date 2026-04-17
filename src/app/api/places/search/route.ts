import { NextRequest, NextResponse } from 'next/server';
import { Category } from '../../../../types';

// Foursquare category IDs → AutoCard categories
// https://docs.foursquare.com/data-products/docs/categories
const FSQ_CATEGORY_MAP: Record<number, Category> = {
  13000: 'dining',   // Food
  13065: 'dining',   // Restaurant
  13032: 'dining',   // Café
  13003: 'dining',   // Bar
  13199: 'dining',   // Fast Food
  13009: 'dining',   // Bakery
  13046: 'dining',   // Food Truck
  17069: 'grocery',  // Grocery Store
  17034: 'grocery',  // Convenience Store
  17070: 'grocery',  // Supermarket
  15014: 'pharmacy', // Pharmacy
  63: 'gas',         // Gas Station
  19040: 'gas',      // Gas Station (travel)
  19047: 'travel',   // Hotel
  19050: 'travel',   // Motel
  19014: 'transit',  // Airport
  19061: 'transit',  // Bus Station
  19057: 'transit',  // Taxi
  10027: 'streaming',// Movie Theater
  17000: 'online',   // Retail
};

function mapFsqCategory(categories: Array<{ id: number }>): Category {
  for (const { id } of categories) {
    // Check exact match
    if (FSQ_CATEGORY_MAP[id]) return FSQ_CATEGORY_MAP[id];
    // Check broad group (first 2 digits)
    const broad = Math.floor(id / 1000) * 1000;
    if (FSQ_CATEGORY_MAP[broad]) return FSQ_CATEGORY_MAP[broad];
  }
  return 'general';
}

interface FsqPlace {
  fsq_id: string;
  name: string;
  categories: Array<{ id: number; name: string }>;
  location: {
    address?: string;
    locality?: string;
    region?: string;
    formatted_address?: string;
  };
  distance?: number;
  geocodes?: { main?: { latitude: number; longitude: number } };
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FOURSQUARE_API_KEY not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') ?? '';
  const lat   = searchParams.get('lat');
  const lon   = searchParams.get('lon');

  if (!query) return NextResponse.json({ results: [] });

  const params = new URLSearchParams({
    query,
    limit: '10',
    fields: 'fsq_id,name,categories,location,distance,geocodes',
  });

  if (lat && lon) {
    params.set('ll', `${lat},${lon}`);
    params.set('radius', '40000'); // 40km radius
    params.set('sort', 'DISTANCE');
  } else {
    params.set('near', 'United States');
  }

  const res = await fetch(`https://api.foursquare.com/v3/places/search?${params}`, {
    headers: {
      Authorization: apiKey,
      Accept: 'application/json',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: `Foursquare error: ${res.status}` }, { status: res.status });
  }

  const data = await res.json() as { results: FsqPlace[] };

  const results = (data.results ?? []).map(p => {
    const category = mapFsqCategory(p.categories ?? []);
    const address  = p.location?.formatted_address
      ?? [p.location?.address, p.location?.locality].filter(Boolean).join(', ')
      ?? undefined;
    return {
      id:       p.fsq_id,
      name:     p.name,
      category,
      address,
      distance: p.distance,
    };
  });

  return NextResponse.json({ results });
}
