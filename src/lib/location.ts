import { Category, NearbyPlace } from '../types';
import { detectCategoryFromName } from './categoryDetect';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const RADIUS_METERS = 300;

// Maps OSM amenity/shop tags → card categories
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

/**
 * Query OpenStreetMap Overpass API for businesses within RADIUS_METERS
 * of the given coordinates. No API key required.
 */
export async function fetchNearbyPlaces(lat: number, lon: number): Promise<NearbyPlace[]> {
  const query = `[out:json][timeout:10];(
node["amenity"~"restaurant|cafe|fast_food|pharmacy|fuel|bar|pub|food_court|ice_cream|bakery"](around:${RADIUS_METERS},${lat},${lon});
node["shop"~"supermarket|grocery|convenience|fuel|pharmacy|greengrocer"](around:${RADIUS_METERS},${lat},${lon});
node["tourism"~"hotel|hostel|motel"](around:${RADIUS_METERS},${lat},${lon});
);out body 12;`;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'text/plain' },
  });

  if (!res.ok) throw new Error(`Overpass error ${res.status}`);
  const json = await res.json() as { elements: OsmElement[] };

  return json.elements
    .filter(el => el.tags?.name || el.tags?.brand)
    .map(el => {
      const tags = el.tags!;
      const name = tags.brand ?? tags.name!;
      const osmTag = tags.amenity ?? tags.shop ?? tags.tourism ?? '';
      const category: Category = TAG_MAP[osmTag] ?? detectCategoryFromName(name);
      const distance = haversineMeters(lat, lon, el.lat, el.lon);
      return { id: String(el.id), name, category, distance: Math.round(distance) };
    })
    .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
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
    // renotify: true replaces the previous AutoCard notification
    new Notification(title, { body, tag: 'autocard' });
  } catch {
    // Some browsers block notifications in certain contexts — ignore
  }
}
