import { Category, NearbyPlace } from '../types';
import { detectCategoryFromName } from './categoryDetect';

// Multiple public Overpass mirrors — tried in order until one succeeds
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const RADIUS_METERS  = 1000;  // 1 km — wide enough to always return results
const FETCH_TIMEOUT  = 12_000; // 12s client-side abort
const SERVER_TIMEOUT = 10;     // seconds, passed to Overpass

// Maps OSM amenity/shop/tourism tags → card categories
const TAG_MAP: Record<string, Category> = {
  restaurant:   'dining',
  cafe:         'dining',
  fast_food:    'dining',
  bar:          'dining',
  pub:          'dining',
  food_court:   'dining',
  ice_cream:    'dining',
  bakery:       'dining',
  pharmacy:     'pharmacy',
  fuel:         'gas',
  bus_station:  'transit',
  car_rental:   'transit',
  hotel:        'travel',
  hostel:       'travel',
  motel:        'travel',
  supermarket:  'grocery',
  grocery:      'grocery',
  convenience:  'grocery',
  greengrocer:  'grocery',
};

interface OsmElement {
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    brand?: string;
    amenity?: string;
    shop?: string;
    tourism?: string;
  };
}

function buildQuery(lat: number, lon: number): string {
  return `[out:json][timeout:${SERVER_TIMEOUT}];(
node["amenity"~"restaurant|cafe|fast_food|pharmacy|fuel|bar|pub|food_court|ice_cream|bakery"](around:${RADIUS_METERS},${lat},${lon});
node["shop"~"supermarket|grocery|convenience|fuel|pharmacy|greengrocer"](around:${RADIUS_METERS},${lat},${lon});
node["tourism"~"hotel|hostel|motel"](around:${RADIUS_METERS},${lat},${lon});
);out body 25;`;
}

/** Fetch raw OSM elements from one mirror. Returns null on any failure. */
async function fetchFromMirror(url: string, query: string): Promise<OsmElement[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' },
      signal: controller.signal,
    });
    // 429 = rate limited, 503/504 = overloaded — try next mirror
    if (!res.ok) return null;
    const json = await res.json() as { elements?: OsmElement[] };
    return json.elements ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Query Overpass API for businesses near the given coordinates.
 * Tries multiple mirrors in sequence; returns [] (never throws) if all fail.
 */
export async function fetchNearbyPlaces(lat: number, lon: number): Promise<NearbyPlace[]> {
  const query = buildQuery(lat, lon);

  for (const mirror of OVERPASS_MIRRORS) {
    const elements = await fetchFromMirror(mirror, query);
    if (elements === null) continue;

    return elements
      .filter(el => el.lat && el.lon && (el.tags?.name || el.tags?.brand))
      .map(el => {
        const tags = el.tags!;
        const name = tags.brand ?? tags.name!;
        const osmTag = tags.amenity ?? tags.shop ?? tags.tourism ?? '';
        const category: Category = TAG_MAP[osmTag] ?? detectCategoryFromName(name);
        const distance = haversineMeters(lat, lon, el.lat, el.lon);
        return { id: String(el.id), name, category, distance: Math.round(distance) };
      })
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      .slice(0, 12);
  }

  // All mirrors failed — return empty rather than throwing
  return [];
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Request browser notification permission. Returns the resulting state. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

/** Fire a Web Notification (foreground). Silently fails if permission not granted. */
export function sendBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag: 'autocard' });
  } catch {
    // Some browsers block notifications in certain contexts — ignore
  }
}
