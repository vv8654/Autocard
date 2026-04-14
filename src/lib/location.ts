import { Category, NearbyPlace } from '../types';
import { detectCategoryFromName } from './categoryDetect';

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

// Try progressively larger radii — stops once MIN_USEFUL results are found.
// 600 m ≈ walkable urban, 2 000 m ≈ suburban strip, 5 000 m ≈ rural/sparse area.
const RADII_METERS    = [600, 2_000, 5_000];
const MIN_USEFUL      = 3;    // expand if fewer results than this
const MAX_RESULTS     = 8;    // max returned to the UI
const FETCH_LIMIT     = 25;   // Overpass server-side cap
const FETCH_TIMEOUT   = 14_000;
const SERVER_TIMEOUT  = 12;

const TAG_MAP: Record<string, Category> = {
  restaurant:  'dining',
  cafe:        'dining',
  fast_food:   'dining',
  bar:         'dining',
  pub:         'dining',
  food_court:  'dining',
  ice_cream:   'dining',
  bakery:      'dining',
  pharmacy:    'pharmacy',
  fuel:        'gas',
  bus_station: 'transit',
  car_rental:  'transit',
  hotel:       'travel',
  hostel:      'travel',
  motel:       'travel',
  supermarket: 'grocery',
  grocery:     'grocery',
  convenience: 'grocery',
  greengrocer: 'grocery',
};

// OSM element — nodes have lat/lon directly; ways/relations have a center object
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

function buildQuery(lat: number, lon: number, radius: number): string {
  const around  = `around:${radius},${lat},${lon}`;
  const amenity = 'restaurant|cafe|fast_food|pharmacy|fuel|bar|pub|food_court|ice_cream|bakery';
  const shop    = 'supermarket|grocery|convenience|fuel|pharmacy|greengrocer';
  const tourism = 'hotel|hostel|motel';
  // nwr covers node + way + relation in one sweep
  return `[out:json][timeout:${SERVER_TIMEOUT}];(
nwr["amenity"~"${amenity}"](${around});
nwr["shop"~"${shop}"](${around});
nwr["tourism"~"${tourism}"](${around});
);out body center ${FETCH_LIMIT};`;
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

function mapElements(elements: OsmElement[], lat: number, lon: number): NearbyPlace[] {
  return elements
    .filter(el => {
      const hasCoords = (el.lat && el.lon) || (el.center?.lat && el.center?.lon);
      return hasCoords && (el.tags?.name || el.tags?.brand);
    })
    .map(el => {
      const elLat = el.lat ?? el.center!.lat;
      const elLon = el.lon ?? el.center!.lon;
      const tags  = el.tags!;
      const name  = tags.brand ?? tags.name!;
      const osmTag = tags.amenity ?? tags.shop ?? tags.tourism ?? '';
      const category: Category = TAG_MAP[osmTag] ?? detectCategoryFromName(name);
      const distance = haversineMeters(lat, lon, elLat, elLon);
      return { id: String(el.id), name, category, distance: Math.round(distance) };
    })
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

/**
 * Returns nearby businesses sorted by distance, expanding search radius
 * automatically for suburban / rural areas.
 *
 * Throws 'OVERPASS_UNAVAILABLE' if all mirrors fail at every radius.
 * Returns [] when the API responds but finds nothing in the area.
 */
export async function fetchNearbyPlaces(lat: number, lon: number): Promise<NearbyPlace[]> {
  for (const radius of RADII_METERS) {
    const query = buildQuery(lat, lon, radius);
    const isLast = radius === RADII_METERS[RADII_METERS.length - 1];

    for (const mirror of OVERPASS_MIRRORS) {
      const elements = await fetchFromMirror(mirror, query);
      if (elements === null) continue; // try next mirror

      const places = mapElements(elements, lat, lon);

      // Return if we have enough results, or this is the widest radius
      if (places.length >= MIN_USEFUL || isLast) {
        return places.slice(0, MAX_RESULTS);
      }

      // Got a valid API response but too few results → expand to next radius
      break;
    }
    // All mirrors failed at this radius → try next radius (different servers may succeed)
  }

  throw new Error('OVERPASS_UNAVAILABLE');
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R    = 6_371_000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Threshold between walking and driving distance (meters). */
export const WALK_THRESHOLD_M = 600;

/** Human-readable distance label aware of walk vs drive context. */
export function distanceLabel(meters: number): { label: string; mode: 'walk' | 'drive' } {
  if (meters < WALK_THRESHOLD_M) {
    const mins = Math.max(1, Math.ceil(meters / 80)); // ~80 m/min walking
    return { label: `${mins} min walk`, mode: 'walk' };
  }
  if (meters < 5_000) {
    const mins = Math.max(1, Math.ceil(meters / 500)); // ~30 km/h suburban
    return { label: `${mins} min drive`, mode: 'drive' };
  }
  return { label: `${(meters / 1000).toFixed(1)} km drive`, mode: 'drive' };
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
