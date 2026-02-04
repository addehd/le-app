import { View, Text, Pressable, TextInput, Platform } from 'react-native';
import { useState } from 'react';
import { PropertyComment } from '../../lib/types/property';
import { MessageCircle, Edit2, Trash2, Check, X } from 'lucide-react-native';

interface CommentItemProps {
  comment: PropertyComment;
  userId: string;
  onReply: (parentId: string) => void;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  replies?: PropertyComment[];
  depth?: number;
}

export function CommentItem({
  comment,
  userId,
  onReply,
  onEdit,
  onDelete,
  replies = [],
  depth = 0,
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLoading, setIsLoading] = useState(false);

  const isOwnComment = comment.userId === userId;
  const maxDepth = 3; // Limit nesting to 3 levels
  const canReply = depth < maxDepth;

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || isLoading) return;
    
    setIsLoading(true);
    try {
      await onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (isLoading) return;
    
    // Simple confirmation for web
    if (Platform.OS === 'web') {
      if (!window.confirm('Are you sure you want to delete this comment?')) {
        return;
      }
    }
    
    setIsLoading(true);
    try {
      await onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setIsLoading(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <View 
      className="mb-3"
      style={{ marginLeft: depth > 0 ? 16 : 0 }}
    >
      <View className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
        {/* Header */}
        <View className="flex-row items-center mb-2">
          {/* Avatar */}
          <View className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 items-center justify-center mr-2">
            <Text className="text-white text-xs font-semibold">
              {getInitials(comment.userName)}
            </Text>
          </View>
          
          {/* User info */}
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900 dark:text-white">
              {comment.userName}
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {formatRelativeTime(comment.createdAt)}
              {comment.updatedAt !== comment.createdAt && ' (edited)'}
            </Text>
          </View>

          {/* Action buttons */}
          {isOwnComment && !isEditing && (
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setIsEditing(true)}
                disabled={isLoading}
                className={Platform.OS === 'web' ? 'hover:opacity-70' : ''}
              >
                <Edit2 size={16} color="#6b7280" />
              </Pressable>
              <Pressable
                onPress={handleDelete}
                disabled={isLoading}
                className={Platform.OS === 'web' ? 'hover:opacity-70' : ''}
              >
                <Trash2 size={16} color="#ef4444" />
              </Pressable>
            </View>
          )}

          {/* Edit actions */}
          {isEditing && (
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleSaveEdit}
                disabled={isLoading}
                className={Platform.OS === 'web' ? 'hover:opacity-70' : ''}
              >
                <Check size={18} color="#10b981" />
              </Pressable>
              <Pressable
                onPress={handleCancelEdit}
                disabled={isLoading}
                className={Platform.OS === 'web' ? 'hover:opacity-70' : ''}
              >
                <X size={18} color="#6b7280" />
              </Pressable>
            </View>
          )}
        </View>

        {/* Content */}
        {isEditing ? (
          <TextInput
            value={editContent}
            onChangeText={setEditContent}
            multiline
            className="bg-white dark:bg-gray-600 rounded p-2 text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-500"
            style={{ minHeight: 60 }}
            editable={!isLoading}
          />
        ) : (
          <Text className="text-sm text-gray-700 dark:text-gray-200 mb-2">
            {comment.content}
          </Text>
        )}

        {/* Reply button */}
        {!isEditing && canReply && (
          <Pressable
            onPress={() => onReply(comment.id)}
            disabled={isLoading}
            className={`flex-row items-center mt-1 ${Platform.OS === 'web' ? 'hover:opacity-70' : ''}`}
          >
            <MessageCircle size={14} color="#6b7280" />
            <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              Reply
            </Text>
          </Pressable>
        )}
      </View>

      {/* Nested replies */}
      {replies.length > 0 && (
        <View className="mt-2">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              userId={userId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              replies={replies.filter(r => r.parentId === reply.id)}
              depth={depth + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}
