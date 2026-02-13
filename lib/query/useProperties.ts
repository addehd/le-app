import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProperties,
  addProperty,
  updateProperty,
  deleteProperty,
  updateFinancialData,
  AddPropertyInput,
} from '../api/properties';
import { PropertyLink, FinancialData } from '../store/propertyLinkStore';

/**
 * React Query hook for property management
 * Handles fetching, adding, updating, and deleting properties with optimistic updates
 */
export function useProperties() {
  const queryClient = useQueryClient();

  // Fetch all properties
  const query = useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties,
  });

  // Add property mutation with optimistic updates
  const addMutation = useMutation({
    mutationFn: addProperty,
    onMutate: async (newPropertyInput: AddPropertyInput) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['properties'] });

      // Snapshot previous value
      const previousProperties = queryClient.getQueryData<PropertyLink[]>(['properties']);

      // Optimistically create a temporary property
      const tempProperty: PropertyLink = {
        id: `temp-${Date.now()}`,
        url: newPropertyInput.url,
        title: 'Loading...',
        sharedBy: newPropertyInput.sharedBy,
        sharedAt: new Date().toISOString(),
        latitude: newPropertyInput.latitude,
        longitude: newPropertyInput.longitude,
      };

      // Optimistically update to the new value
      queryClient.setQueryData<PropertyLink[]>(['properties'], (old) => 
        [tempProperty, ...(old || [])]
      );

      return { previousProperties };
    },
    onError: (err, newProperty, context) => {
      // Rollback on error
      if (context?.previousProperties) {
        queryClient.setQueryData(['properties'], context.previousProperties);
      }
      console.error('Failed to add property:', err);
    },
    onSuccess: () => {
      // Refetch to get the real data
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  // Update property mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PropertyLink> }) =>
      updateProperty(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['properties'] });
      const previousProperties = queryClient.getQueryData<PropertyLink[]>(['properties']);

      queryClient.setQueryData<PropertyLink[]>(['properties'], (old) =>
        (old || []).map((property) =>
          property.id === id ? { ...property, ...updates } : property
        )
      );

      return { previousProperties };
    },
    onError: (err, variables, context) => {
      if (context?.previousProperties) {
        queryClient.setQueryData(['properties'], context.previousProperties);
      }
      console.error('Failed to update property:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  // Delete property mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: deleteProperty,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['properties'] });
      const previousProperties = queryClient.getQueryData<PropertyLink[]>(['properties']);

      queryClient.setQueryData<PropertyLink[]>(['properties'], (old) =>
        (old || []).filter((property) => property.id !== id)
      );

      return { previousProperties };
    },
    onError: (err, id, context) => {
      if (context?.previousProperties) {
        queryClient.setQueryData(['properties'], context.previousProperties);
      }
      console.error('Failed to delete property:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  // Update financial data mutation
  const updateFinancialMutation = useMutation({
    mutationFn: ({ id, financialData }: { id: string; financialData: FinancialData }) =>
      updateFinancialData(id, financialData),
    onMutate: async ({ id, financialData }) => {
      await queryClient.cancelQueries({ queryKey: ['properties'] });
      const previousProperties = queryClient.getQueryData<PropertyLink[]>(['properties']);

      queryClient.setQueryData<PropertyLink[]>(['properties'], (old) =>
        (old || []).map((property) =>
          property.id === id ? { ...property, financialData } : property
        )
      );

      return { previousProperties };
    },
    onError: (err, variables, context) => {
      if (context?.previousProperties) {
        queryClient.setQueryData(['properties'], context.previousProperties);
      }
      console.error('Failed to update financial data:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  return {
    // Query state
    properties: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,

    // Mutations
    addProperty: addMutation.mutate,
    addPropertyAsync: addMutation.mutateAsync,
    isAddingProperty: addMutation.isPending,

    updateProperty: updateMutation.mutate,
    updatePropertyAsync: updateMutation.mutateAsync,
    isUpdatingProperty: updateMutation.isPending,

    deleteProperty: deleteMutation.mutate,
    deletePropertyAsync: deleteMutation.mutateAsync,
    isDeletingProperty: deleteMutation.isPending,

    updateFinancialData: updateFinancialMutation.mutate,
    updateFinancialDataAsync: updateFinancialMutation.mutateAsync,
    isUpdatingFinancialData: updateFinancialMutation.isPending,
  };
}

/**
 * Hook to get a single property by ID
 */
export function useProperty(id: string | undefined) {
  const { properties, isLoading } = useProperties();

  const property = properties.find((p) => p.id === id);

  return {
    property,
    isLoading,
  };
}
