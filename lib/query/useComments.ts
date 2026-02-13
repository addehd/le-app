import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchComments, addComment, updateComment, deleteComment } from '../api/comments';
import { PropertyComment } from '../types/property';

/**
 * React Query hook for property comments
 * Handles fetching, adding, updating, and deleting comments with optimistic updates
 */
export function useComments(propertyId: string) {
  const queryClient = useQueryClient();

  // Fetch comments for a property
  const query = useQuery({
    queryKey: ['comments', propertyId],
    queryFn: () => fetchComments(propertyId),
    enabled: !!propertyId,
  });

  // Add comment mutation with optimistic updates
  const addMutation = useMutation({
    mutationFn: ({
      content,
      userId,
      userName,
      parentId,
    }: {
      content: string;
      userId: string;
      userName: string;
      parentId?: string;
    }) => addComment(propertyId, content, userId, userName, parentId),
    onMutate: async ({ content, userId, userName, parentId }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', propertyId] });
      const previousComments = queryClient.getQueryData<PropertyComment[]>(['comments', propertyId]);

      // Add optimistic comment
      const optimisticComment: PropertyComment = {
        id: `temp-${Date.now()}`,
        propertyId,
        parentId,
        userId,
        userName,
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<PropertyComment[]>(['comments', propertyId], (old) => 
        [...(old || []), optimisticComment]
      );

      return { previousComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', propertyId], context.previousComments);
      }
      console.error('Failed to add comment:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', propertyId] });
    },
  });

  // Update comment mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      updateComment(commentId, content),
    onMutate: async ({ commentId, content }) => {
      await queryClient.cancelQueries({ queryKey: ['comments', propertyId] });
      const previousComments = queryClient.getQueryData<PropertyComment[]>(['comments', propertyId]);

      queryClient.setQueryData<PropertyComment[]>(['comments', propertyId], (old) =>
        (old || []).map((comment) =>
          comment.id === commentId
            ? { ...comment, content, updatedAt: new Date().toISOString() }
            : comment
        )
      );

      return { previousComments };
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', propertyId], context.previousComments);
      }
      console.error('Failed to update comment:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', propertyId] });
    },
  });

  // Delete comment mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: deleteComment,
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: ['comments', propertyId] });
      const previousComments = queryClient.getQueryData<PropertyComment[]>(['comments', propertyId]);

      queryClient.setQueryData<PropertyComment[]>(['comments', propertyId], (old) =>
        (old || []).filter((comment) => comment.id !== commentId)
      );

      return { previousComments };
    },
    onError: (err, commentId, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', propertyId], context.previousComments);
      }
      console.error('Failed to delete comment:', err);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', propertyId] });
    },
  });

  return {
    comments: query.data || [],
    isLoading: query.isLoading,
    error: query.error,

    addComment: addMutation.mutate,
    updateComment: updateMutation.mutate,
    deleteComment: deleteMutation.mutate,

    isAddingComment: addMutation.isPending,
    isUpdatingComment: updateMutation.isPending,
    isDeletingComment: deleteMutation.isPending,
  };
}
