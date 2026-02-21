import type { RefObject } from 'react';
import type { MapRef } from 'react-map-gl/maplibre';
import { hasValidCoordinates, DEFAULT_COORDINATES } from '../../../lib/utils/coordinates';

type CoordinateObject = { latitude?: number; longitude?: number };

type LngLatBounds = [[number, number], [number, number]];

export interface FitBoundsOptions {
  padding?: number;
  maxZoom?: number;
  duration?: number;
}

/**
 * Returns SW/NE bounds from a list of map objects.
 * Returns null if no valid coordinates are found.
 */
export function getMarkersBounds(markers: CoordinateObject[]): LngLatBounds | null {
  const valid = markers.filter(hasValidCoordinates);
  if (valid.length === 0) return null;

  const lngs = valid.map((m) => m.longitude);
  const lats = valid.map((m) => m.latitude);

  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}

/**
 * Returns the geographic center of the given markers.
 * Falls back to DEFAULT_COORDINATES if no valid coordinates exist.
 */
export function getMarkersCenter(markers: CoordinateObject[]): { latitude: number; longitude: number } {
  const valid = markers.filter(hasValidCoordinates);
  if (valid.length === 0) return DEFAULT_COORDINATES;

  const latitude = valid.reduce((sum, m) => sum + m.latitude, 0) / valid.length;
  const longitude = valid.reduce((sum, m) => sum + m.longitude, 0) / valid.length;

  return { latitude, longitude };
}

/**
 * Centers and zooms the map so all provided markers are visible.
 * Uses MapLibre's fitBounds for accurate zoom based on actual viewport size.
 * For a single marker, flies to it at a fixed zoom level instead.
 */
export function fitMapToMarkers(
  mapRef: RefObject<MapRef>,
  markers: CoordinateObject[],
  options: FitBoundsOptions = {}
): void {
  if (!mapRef.current) return;

  const { padding = 80, maxZoom = 15, duration = 800 } = options;
  const valid = markers.filter(hasValidCoordinates);

  if (valid.length === 0) return;

  if (valid.length === 1) {
    mapRef.current.flyTo({
      center: [valid[0].longitude, valid[0].latitude],
      zoom: maxZoom,
      duration,
    });
    return;
  }

  const bounds = getMarkersBounds(markers);
  if (!bounds) return;

  mapRef.current.fitBounds(bounds, { padding, maxZoom, duration });
}
