'use client';

import { useState, useEffect, useRef } from 'react';
import { NearbyPlace } from '../types';
import { fetchNearbyPlaces } from '../lib/location';

const MIN_INTERVAL_MS = 90_000;
const MIN_MOVE_METERS = 40;

export interface UseNearbyPlacesResult {
  places: NearbyPlace[];
  loading: boolean;
  error: string | null;       // GPS-level errors (permission denied, timeout)
  apiError: boolean;          // Overpass unavailable — show gentle message
  searched: boolean;          // true after first query completes (success or empty)
  permissionDenied: boolean;
  refresh: () => void;
}

export function useNearbyPlaces(enabled: boolean): UseNearbyPlacesResult {
  const [places, setPlaces]         = useState<NearbyPlace[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [apiError, setApiError]     = useState(false);
  const [searched, setSearched]     = useState(false);
  const [permissionDenied, setDenied] = useState(false);

  const lastFetchAt = useRef(0);
  const lastPos     = useRef<{ lat: number; lon: number } | null>(null);
  const watchIdRef  = useRef<number | null>(null);

  async function doFetch(lat: number, lon: number) {
    setLoading(true);
    setError(null);
    setApiError(false);
    try {
      const results = await fetchNearbyPlaces(lat, lon);
      setPlaces(results);
    } catch (err) {
      if (err instanceof Error && err.message === 'OVERPASS_UNAVAILABLE') {
        setApiError(true);
        setPlaces([]);
      }
      // Other unexpected errors: stay silent, keep old places
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  function refresh() {
    if (lastPos.current) {
      lastFetchAt.current = 0;
      doFetch(lastPos.current.lat, lastPos.current.lon);
    }
  }

  useEffect(() => {
    if (!enabled) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setPlaces([]);
      setError(null);
      setApiError(false);
      setSearched(false);
      setDenied(false);
      return;
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    const onPosition = (pos: GeolocationPosition) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const now = Date.now();

      if (lastPos.current) {
        const moved =
          Math.hypot(lat - lastPos.current.lat, lon - lastPos.current.lon) * 111_000;
        if (moved < MIN_MOVE_METERS && now - lastFetchAt.current < MIN_INTERVAL_MS) return;
      }

      lastPos.current     = { lat, lon };
      lastFetchAt.current = now;
      doFetch(lat, lon);
    };

    const onError = (err: GeolocationPositionError) => {
      if (err.code === err.PERMISSION_DENIED) {
        setDenied(true);
        setError('Location access denied. Enable it in your browser settings.');
      } else if (err.code === err.TIMEOUT) {
        setError('Getting your location is taking a while. Try moving to an open area.');
      } else {
        setError('Could not get your location. Try again.');
      }
      setLoading(false);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 30_000,
      timeout: 20_000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [enabled]);

  return { places, loading, error, apiError, searched, permissionDenied, refresh };
}
