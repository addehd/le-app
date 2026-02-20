import { useQuery } from '@tanstack/react-query';
import { fetchPropertiesFromTable, Property } from '../api/properties-table';

/**
 * React Query hook for fetching properties from the properties table
 * (separate from property_links table)
 */
export function usePropertiesTable() {
  const query = useQuery({
    queryKey: ['properties-table'],
    queryFn: fetchPropertiesFromTable,
  });

  return {
    properties: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get a single property by ID from the properties table
 */
export function usePropertyFromTable(id: number | undefined) {
  const { properties, isLoading } = usePropertiesTable();

  const property = properties.find((p) => p.id === id);

  return {
    property,
    isLoading,
  };
}
