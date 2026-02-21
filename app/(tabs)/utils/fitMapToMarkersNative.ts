import type { RefObject } from 'react';
import type MapView from 'react-native-maps';
import { hasValidCoordinates, DEFAULT_COORDINATES } from '../../../lib/utils/coordinates';
import { getMarkersBounds, getMarkersCenter } from './fitMapToMarkers';

type CoordinateObject = { latitude?: number; longitude?: number };

export interface FitBoundsOptionsNative {
  padding?: number;
  animated?: boolean;
}

/**
 * Centers and zooms a react-native-maps MapView so all markers are visible.
 * Uses fitToCoordinates for multiple markers, or animateToRegion for a single one.
 */
export function fitMapToMarkersNative(
  mapRef: RefObject<MapView>,
  markers: CoordinateObject[],
  options: FitBoundsOptionsNative = {}
): void {
  if (!mapRef.current) return;

  const { padding = 80, animated = true } = options;
  const valid = markers.filter(hasValidCoordinates);

  if (valid.length === 0) return;

  if (valid.length === 1) {
    mapRef.current.animateToRegion(
      {
        latitude: valid[0].latitude,
        longitude: valid[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      animated ? 800 : 0
    );
    return;
  }

  const edgePadding = { top: padding, right: padding, bottom: padding, left: padding };
  mapRef.current.fitToCoordinates(
    valid.map((m) => ({ latitude: m.latitude, longitude: m.longitude })),
    { edgePadding, animated }
  );
}

export { getMarkersBounds, getMarkersCenter };
