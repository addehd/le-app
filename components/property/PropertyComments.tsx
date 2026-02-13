import { View, Text, TextInput, Pressable, Platform, ScrollView } from 'react-native';
import { useState, useRef } from 'react';
import { useComments } from '../../lib/query/useComments';
import { useCommentsRealtimeSubscription } from '../../lib/query/useRealtimeSubscriptions';
import { useAuth } from '../../lib/query/useAuth';
import { PropertyComment } from '../../lib/types/property';
import { CommentItem } from './CommentItem';
import { Send } from 'lucide-react-native';

interface PropertyCommentsProps {
  propertyId: string;
}

export function PropertyComments({ propertyId }: PropertyCommentsProps) {
  const { 
    comments: propertyComments, 
    addComment, 
    updateComment, 
    deleteComment,
    isAddingComment,
  } = useComments(propertyId);
  const { user } = useAuth();
  
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Subscribe to realtime updates
  useCommentsRealtimeSubscription(propertyId);

  // Get user ID and name
  const getUserInfo = () => {
    if (user?.email) {
      const name = user.email.split('@')[0];
      return { id: user.email, name };
    }
    
    // Get or create anonymous ID
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      let anonId = window.localStorage.getItem('anon-user-id');
      if (!anonId) {
        anonId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        window.localStorage.setItem('anon-user-id', anonId);
      }
      return { id: anonId, name: 'Anonymous User' };
    }
    return { id: `anon-${Date.now()}`, name: 'Anonymous User' };
  };

  // Build threaded comment structure
  const buildCommentTree = (comments: PropertyComment[]): PropertyComment[] => {
    const topLevel = comments.filter(c => !c.parentId);
    const withReplies = topLevel.map(comment => ({
      ...comment,
      replies: comments.filter(c => c.parentId === comment.id),
    }));
    return withReplies;
  };

  const commentTree = buildCommentTree(propertyComments);

  // Find the comment being replied to
  const replyToComment = replyToId
    ? propertyComments.find(c => c.id === replyToId)
    : null;

  const handleSubmitComment = () => {
    if (!newComment.trim() || isAddingComment) return;
    
    try {
      const userInfo = getUserInfo();
      await addComment(propertyId, newComment.trim(), userInfo.id, userInfo.name, replyToId || undefined);
      setNewComment('');
      setReplyToId(null);
      
      // Scroll to bottom after adding comment
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReply = (parentId: string) => {
    setReplyToId(parentId);
  };

  const handleCancelReply = () => {
    setReplyToId(null);
  };

  const handleEdit = (commentId: string, content: string) => {
    updateComment({ commentId, content });
  };

  const handleDelete = (commentId: string) => {
    deleteComment(commentId);
  };

  const userInfo = getUserInfo();

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <Text className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        Comments ({propertyComments.length})
      </Text>

      {/* Comments list */}
      <ScrollView
        ref={scrollViewRef}
        className="mb-4"
        style={{ maxHeight: 500 }}
        showsVerticalScrollIndicator={true}
      >
        {commentTree.length === 0 ? (
          <View className="py-8">
            <Text className="text-gray-400 dark:text-gray-500 text-center text-sm">
              No comments yet. Be the first to comment!
            </Text>
          </View>
        ) : (
          commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              userId={userInfo.id}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              replies={comment.replies || []}
              depth={0}
            />
          ))
        )}
      </ScrollView>

      {/* Reply indicator */}
      {replyToComment && (
        <View className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 mb-2 flex-row items-center justify-between">
          <Text className="text-xs text-blue-600 dark:text-blue-400">
            Replying to {replyToComment.userName}
          </Text>
          <Pressable onPress={handleCancelReply}>
            <Text className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              Cancel
            </Text>
          </Pressable>
        </View>
      )}

      {/* New comment input */}
      <View className="flex-row gap-2">
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder={replyToId ? "Write a reply..." : "Add a comment..."}
          placeholderTextColor="#9ca3af"
          multiline
          className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600"
          style={{ minHeight: 60, maxHeight: 120 }}
          editable={!isLoading}
        />
        <Pressable
          onPress={handleSubmitComment}
          disabled={!newComment.trim() || isLoading}
          className={`
            w-12 h-12 rounded-lg items-center justify-center
            ${newComment.trim() && !isLoading
              ? 'bg-blue-500 dark:bg-blue-600'
              : 'bg-gray-300 dark:bg-gray-600'
            }
            ${Platform.OS === 'web' ? 'hover:opacity-80' : ''}
          `}
          style={({ pressed }) => ({
            opacity: pressed || isLoading ? 0.7 : 1,
          })}
        >
          <Send 
            size={20} 
            color={newComment.trim() && !isLoading ? '#ffffff' : '#9ca3af'} 
          />
        </Pressable>
      </View>
    </View>
  );
}
