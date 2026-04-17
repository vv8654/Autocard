import { NextRequest, NextResponse } from 'next/server';
import { Category } from '../../../../types';

// HERE Places category → AutoCard category
function mapHereCategory(categoryId: string, name: string): Category {
  const id  = categoryId.toLowerCase();
  const nm  = name.toLowerCase();
  if (id.includes('restaurant') || id.includes('dining') || id.includes('food') ||
      nm.includes('restaurant') || nm.includes('taco') || nm.includes('burger') ||
      nm.includes('pizza') || nm.includes('sushi') || nm.includes('cafe') ||
      nm.includes('coffee') || nm.includes('bakery') || nm.includes('bar'))
    return 'dining';
  if (id.includes('grocery') || id.includes('supermarket') || nm.includes('grocery') ||
      nm.includes('h-e-b') || nm.includes('kroger') || nm.includes('whole foods') ||
      nm.includes('trader joe') || nm.includes('walmart') || nm.includes('costco'))
    return 'grocery';
  if (id.includes('petrol') || id.includes('fuel') || id.includes('gas') ||
      nm.includes('shell') || nm.includes('chevron') || nm.includes('exxon') ||
      nm.includes('bp ') || nm.includes('mobil') || nm.includes('gas station'))
    return 'gas';
  if (id.includes('pharmacy') || id.includes('drug') || nm.includes('cvs') ||
      nm.includes('walgreens') || nm.includes('pharmacy') || nm.includes('rite aid'))
    return 'pharmacy';
  if (id.includes('hotel') || id.includes('lodging') || id.includes('motel') ||
      nm.includes('hotel') || nm.includes('marriott') || nm.includes('hilton') ||
      nm.includes('hyatt') || nm.includes('airbnb'))
    return 'travel';
  if (id.includes('transport') || id.includes('transit') || id.includes('airport') ||
      nm.includes('uber') || nm.includes('lyft') || nm.includes('airport'))
    return 'transit';
  return 'general';
}

interface HereResult {
  id: string;
  title: string;
  address: { label?: string; street?: string; city?: string };
  categories?: Array<{ id: string; name: string; primary?: boolean }>;
  distance?: number;
  position?: { lat: number; lng: number };
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.HERE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'HERE_API_KEY not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') ?? '';
  const lat   = searchParams.get('lat');
  const lon   = searchParams.get('lon');

  if (!query.trim()) return NextResponse.json({ results: [] });

  const params = new URLSearchParams({
    q:      query,
    apiKey,
    limit:  '10',
    lang:   'en',
  });

  if (lat && lon) {
    params.set('at', `${lat},${lon}`);
  } else {
    // US bounding box as fallback
    params.set('in', 'countryCode:USA');
    params.set('at', '39.8283,-98.5795'); // geographic center of US
  }

  const res = await fetch(
    `https://discover.search.hereapi.com/v1/discover?${params}`,
    { next: { revalidate: 0 } },
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `HERE error ${res.status}: ${text}` }, { status: res.status });
  }

  const data = await res.json() as { items?: HereResult[] };

  const results = (data.items ?? []).map(item => {
    const primary = item.categories?.find(c => c.primary) ?? item.categories?.[0];
    const category = primary
      ? mapHereCategory(primary.id, item.title)
      : mapHereCategory('', item.title);
    const address = item.address?.label
      ?? [item.address?.street, item.address?.city].filter(Boolean).join(', ')
      ?? undefined;
    return {
      id:       item.id,
      name:     item.title,
      category,
      address,
      distance: item.distance,
    };
  });

  return NextResponse.json({ results });
}
