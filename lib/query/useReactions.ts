import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchReactions, addReaction, removeReaction } from '../api/reactions';
import { PropertyReaction } from '../types/property';

/**
 * React Query hook for property reactions
 * Handles fetching, adding, and removing reactions with optimistic updates
 */
export function useReactions(propertyId: string) {
  const queryClient = useQueryClient();

  // Fetch reactions for a property
  const query = useQuery({
    queryKey: ['reactions', propertyId],
    queryFn: () => fetchReactions(propertyId),
    enabled: !!propertyId,
  });

  // Add reaction mutation with optimistic updates
  const addMutation = useMutation({
    mutationFn: ({ emoji, userId }: { emoji: string; userId: string }) =>
      addReaction(propertyId, emoji, userId),
    onMutate: async ({ emoji, userId }) => {
      await queryClient.cancelQueries({ queryKey: ['reactions', propertyId] });
      const previousReactions = queryClient.getQueryData<PropertyReaction[]>(['reactions', propertyId]);

      // Check if user already reacted with this emoji (for toggle behavior)
      const existingReaction = previousReactions?.find(
        (r) => r.userId === userId && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove the reaction (toggle off)
        queryClient.setQueryData<PropertyReaction[]>(
          ['reactions', propertyId],
          (old) => (old || []).filter((r) => r.id !== existingReaction.id)
        );
        // Actually remove it from the server
        removeReaction(existingReaction.id);
        return { previousReactions, wasToggleOff: true };
      }

      // Add optimistic reaction
      const optimisticReaction: PropertyReaction = {
        id: `temp-${Date.now()}`,
        propertyId,
        userId,
        emoji,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<PropertyReaction[]>(['reactions', propertyId], (old) => 
        [...(old || []), optimisticReaction]
      );

      return { previousReactions, wasToggleOff: false };
    },
    onError: (err, variables, context) => {
      if (context?.previousReactions && !context?.wasToggleOff) {
        queryClient.setQueryData(['reactions', propertyId], context.previousReactions);
      }
      console.error('Failed to add reaction:', err);
    },
    onSuccess: (data, variables, context) => {
      if (!context?.wasToggleOff) {
        queryClient.invalidateQueries({ queryKey: ['reactions', propertyId] });
      }
    },
  });

  // Remove reaction mutation with optimistic updates
  const removeMutation = useMutation({
    mutationFn: removeReaction,
    onMutate: async (reactionId: string) => {
      await queryClient.cancelQueries({ queryKey: ['reactions', propertyId] });
      const previousReactions = queryClient.getQueryData<PropertyReaction[]>(['reactions', propertyId]);

      queryClient.setQueryData<PropertyReaction[]>(['reactions', propertyId], (old) =>
        (old || []).filter((r) => r.id !== reactionId)
      );

      return { previousReactions };
    },
    onError: (err, reactionId, context) => {
      if (context?.previousReactions) {
        queryClient.setQueryData(['reactions', propertyId], context.previousReactions);
      }
      console.error('Failed to remove reaction:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reactions', propertyId] });
    },
  });

  return {
    reactions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,

    addReaction: addMutation.mutate,
    removeReaction: removeMutation.mutate,
    isAddingReaction: addMutation.isPending,
    isRemovingReaction: removeMutation.isPending,
  };
}
