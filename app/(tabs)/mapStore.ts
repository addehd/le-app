/**
 * @deprecated This file now only exports types. Use useMapPlaces hook from lib/query/useMapPlaces.ts instead.
 * 
 * Migration guide:
 * - Replace: const { places, isLoading, error, fetchPlaces, addProperty } = useMapStore();
 * - With: const { places, isLoading, error, refetch, addPlace } = useMapPlaces();
 */

// Re-export types from the API module
export type { PropertyData, Place } from '../../lib/api/mapPlaces';
