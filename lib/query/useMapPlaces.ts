import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPlaces, addPlace, Place } from '../api/mapPlaces';

/**
 * React Query hook for map places management
 * Handles fetching and adding places with local storage + Supabase sync
 */
export function useMapPlaces() {
  const queryClient = useQueryClient();

  // Fetch all places
  const query = useQuery({
    queryKey: ['mapPlaces'],
    queryFn: fetchPlaces,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Add place mutation with optimistic updates
  const addMutation = useMutation({
    mutationFn: addPlace,
    onMutate: async (newPlace: Place) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['mapPlaces'] });

      // Snapshot previous value
      const previousPlaces = queryClient.getQueryData<Place[]>(['mapPlaces']);

      // Optimistically update to the new value
      queryClient.setQueryData<Place[]>(['mapPlaces'], (old) => 
        [...(old || []), newPlace]
      );

      return { previousPlaces };
    },
    onError: (err, newPlace, context) => {
      // Rollback on error
      if (context?.previousPlaces) {
        queryClient.setQueryData(['mapPlaces'], context.previousPlaces);
      }
      console.error('Failed to add place:', err);
    },
    onSuccess: () => {
      // Refetch to ensure sync
      queryClient.invalidateQueries({ queryKey: ['mapPlaces'] });
    },
  });

  return {
    // Query state
    places: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Mutations
    addPlace: addMutation.mutate,
    addPlaceAsync: addMutation.mutateAsync,
    isAddingPlace: addMutation.isPending,
  };
}
