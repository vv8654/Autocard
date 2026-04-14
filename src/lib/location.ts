import { Category, NearbyPlace } from '../types';
import { detectCategoryFromName } from './categoryDetect';

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const RADIUS_METERS  = 800;   // ~10 min walk
const FETCH_TIMEOUT  = 12_000;
const SERVER_TIMEOUT = 10;

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

// OSM element — nodes have lat/lon directly; ways have a center object
interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    brand?: string;
    amenity?: string;
    shop?: string;
    tourism?: string;
  };
}

function buildQuery(lat: number, lon: number): string {
  const around = `around:${RADIUS_METERS},${lat},${lon}`;
  const amenity = 'restaurant|cafe|fast_food|pharmacy|fuel|bar|pub|food_court|ice_cream|bakery';
  const shop    = 'supermarket|grocery|convenience|fuel|pharmacy|greengrocer';
  const tourism = 'hotel|hostel|motel';
  // nwr = node + way + relation in one line; catches points, building outlines, and POI relations
  return `[out:json][timeout:${SERVER_TIMEOUT}];(
nwr["amenity"~"${amenity}"](${around});
nwr["shop"~"${shop}"](${around});
nwr["tourism"~"${tourism}"](${around});
);out body center 30;`;
}

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
 * Returns nearby businesses sorted by distance.
 * Throws 'OVERPASS_UNAVAILABLE' if all mirrors fail so the hook can show
 * a specific message. Returns [] (no throw) when the API responds but
 * genuinely finds nothing nearby.
 */
export async function fetchNearbyPlaces(lat: number, lon: number): Promise<NearbyPlace[]> {
  const query = buildQuery(lat, lon);

  for (const mirror of OVERPASS_MIRRORS) {
    const elements = await fetchFromMirror(mirror, query);
    if (elements === null) continue;

    return elements
      .filter(el => {
        // Accept nodes with direct coords, or ways/relations with a center
        const hasCoords = (el.lat && el.lon) || (el.center?.lat && el.center?.lon);
        return hasCoords && (el.tags?.name || el.tags?.brand);
      })
      .map(el => {
        const elLat = el.lat ?? el.center!.lat;
        const elLon = el.lon ?? el.center!.lon;
        const tags   = el.tags!;
        const name   = tags.brand ?? tags.name!;
        const osmTag = tags.amenity ?? tags.shop ?? tags.tourism ?? '';
        const category: Category = TAG_MAP[osmTag] ?? detectCategoryFromName(name);
        const distance = haversineMeters(lat, lon, elLat, elLon);
        return { id: String(el.id), name, category, distance: Math.round(distance) };
      })
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0))
      .slice(0, 12);
  }

  // All mirrors failed — let the hook surface a gentle message
  throw new Error('OVERPASS_UNAVAILABLE');
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

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export function sendBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag: 'autocard' });
  } catch { /* ignore */ }
}
