import { View, Text, Pressable, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { usePropertyLinkStore } from '../../lib/store/propertyLinkStore';
import { useAuthStore } from '../../lib/store/authStore';

interface PropertyReactionsProps {
  propertyId: string;
}

const AVAILABLE_EMOJIS = ['❤️', '👍', '⭐', '🔥', '😍'];

export function PropertyReactions({ propertyId }: PropertyReactionsProps) {
  const { reactions, addReaction, loadReactions, subscribeToReactions } = usePropertyLinkStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const propertyReactions = reactions[propertyId] || [];

  // Get user ID (authenticated or anonymous)
  const getUserId = () => {
    if (user?.email) return user.email;
    
    // Get or create anonymous ID
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      let anonId = window.localStorage.getItem('anon-user-id');
      if (!anonId) {
        anonId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        window.localStorage.setItem('anon-user-id', anonId);
      }
      return anonId;
    }
    return `anon-${Date.now()}`;
  };

  // Count reactions by emoji
  const reactionCounts = AVAILABLE_EMOJIS.reduce((acc, emoji) => {
    acc[emoji] = propertyReactions.filter(r => r.emoji === emoji).length;
    return acc;
  }, {} as Record<string, number>);

  // Check if current user has reacted with each emoji
  const userId = getUserId();
  const userReactions = AVAILABLE_EMOJIS.reduce((acc, emoji) => {
    acc[emoji] = propertyReactions.some(r => r.userId === userId && r.emoji === emoji);
    return acc;
  }, {} as Record<string, boolean>);

  // Load reactions on mount
  useEffect(() => {
    loadReactions(propertyId);
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToReactions(propertyId);
    return unsubscribe;
  }, [propertyId]);

  const handleReaction = async (emoji: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    console.log('🎯 Adding reaction:', { propertyId, emoji, userId });
    
    try {
      await addReaction(propertyId, emoji, userId);
      console.log('✅ Reaction added successfully');
    } catch (error: any) {
      console.error('❌ Error adding reaction:', error);
      const errorMessage = error?.message || 'Failed to add reaction. Please try again.';
      setError(errorMessage);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <Text className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        Reactions
      </Text>
      
      {error && (
        <View className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <Text className="text-sm text-red-600 dark:text-red-400">
            {error}
          </Text>
        </View>
      )}
      
      <View className="flex-row flex-wrap gap-2">
        {AVAILABLE_EMOJIS.map((emoji) => {
          const count = reactionCounts[emoji];
          const hasReacted = userReactions[emoji];
          
          return (
            <Pressable
              key={emoji}
              onPress={() => handleReaction(emoji)}
              disabled={isLoading}
              className={`
                flex-row items-center px-3 py-2 rounded-full border
                ${hasReacted 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-400' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                }
                ${Platform.OS === 'web' ? 'hover:opacity-80' : ''}
              `}
              style={({ pressed }) => ({
                opacity: pressed || isLoading ? 0.7 : 1,
              })}
            >
              <Text className="text-xl mr-1">{emoji}</Text>
              {count > 0 && (
                <Text 
                  className={`
                    text-sm font-semibold
                    ${hasReacted 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-600 dark:text-gray-400'
                    }
                  `}
                >
                  {count}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
