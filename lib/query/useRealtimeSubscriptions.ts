import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabaseClient';
import { PropertyLink } from '../store/propertyLinkStore';
import { PropertyReaction } from '../types/property';
import { PropertyComment } from '../types/property';

/**
 * Hook to subscribe to Supabase Realtime updates for properties
 * Optimistically updates React Query cache on INSERT/UPDATE/DELETE events
 */
export function usePropertyRealtimeSubscription() {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔔 Subscribing to property realtime updates...');

    const channel = supabase
      .channel('property_enrichment')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'property_links',
        },
        (payload) => {
          console.log('📨 Received property update:', payload);

          // Optimistically update the property in the cache
          queryClient.setQueryData<PropertyLink[]>(['properties'], (old) => {
            if (!old) return old;

            return old.map((property) => {
              if (property.id === payload.new.id) {
                // Convert snake_case to camelCase
                return {
                  ...property,
                  title: payload.new.title || property.title,
                  description: payload.new.description || property.description,
                  image: payload.new.image || property.image,
                  images: payload.new.images || property.images,
                  latitude: payload.new.latitude ?? property.latitude,
                  longitude: payload.new.longitude ?? property.longitude,
                  propertyData: payload.new.property_data
                    ? { ...property.propertyData, ...payload.new.property_data }
                    : property.propertyData,
                  financialData: payload.new.financial_data || property.financialData,
                };
              }
              return property;
            });
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'property_links',
        },
        (payload) => {
          console.log('📨 Received property insert:', payload);

          // Add new property to cache
          queryClient.setQueryData<PropertyLink[]>(['properties'], (old) => {
            const newProperty: PropertyLink = {
              id: payload.new.id,
              url: payload.new.url,
              title: payload.new.title,
              description: payload.new.description,
              image: payload.new.image,
              images: payload.new.images,
              sharedBy: payload.new.shared_by,
              sharedAt: payload.new.shared_at,
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
              propertyData: payload.new.property_data,
              financialData: payload.new.financial_data,
            };

            // Don't add if it already exists
            if (old?.some((p) => p.id === newProperty.id)) {
              return old;
            }

            return [newProperty, ...(old || [])];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'property_links',
        },
        (payload) => {
          console.log('📨 Received property delete:', payload);

          // Remove property from cache
          queryClient.setQueryData<PropertyLink[]>(['properties'], (old) => {
            if (!old) return old;
            return old.filter((property) => property.id !== payload.old.id);
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Property realtime subscription status:', status);
      });

    return () => {
      console.log('🔕 Unsubscribing from property realtime updates');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

/**
 * Hook to subscribe to Supabase Realtime updates for reactions on a specific property
 */
export function useReactionsRealtimeSubscription(propertyId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!propertyId) return;

    console.log('🔔 Subscribing to reactions for property:', propertyId);

    const channel = supabase
      .channel(`reactions:${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'property_reactions',
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          console.log('📨 Reaction update:', payload);

          if (payload.eventType === 'INSERT') {
            const newReaction: PropertyReaction = {
              id: payload.new.id,
              propertyId: payload.new.property_id,
              userId: payload.new.user_id,
              emoji: payload.new.emoji,
              createdAt: payload.new.created_at,
            };

            queryClient.setQueryData<PropertyReaction[]>(['reactions', propertyId], (old) => {
              // Don't add if it already exists
              if (old?.some((r) => r.id === newReaction.id)) {
                return old;
              }
              return [...(old || []), newReaction];
            });
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData<PropertyReaction[]>(['reactions', propertyId], (old) => {
              if (!old) return old;
              return old.filter((r) => r.id !== payload.old.id);
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from reactions for property:', propertyId);
      supabase.removeChannel(channel);
    };
  }, [propertyId, queryClient]);
}

/**
 * Hook to subscribe to Supabase Realtime updates for comments on a specific property
 */
export function useCommentsRealtimeSubscription(propertyId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!propertyId) return;

    console.log('🔔 Subscribing to comments for property:', propertyId);

    const channel = supabase
      .channel(`comments:${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'property_comments',
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          console.log('📨 Comment update:', payload);

          if (payload.eventType === 'INSERT') {
            const newComment: PropertyComment = {
              id: payload.new.id,
              propertyId: payload.new.property_id,
              parentId: payload.new.parent_id,
              userId: payload.new.user_id,
              userName: payload.new.user_name,
              content: payload.new.content,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
            };

            queryClient.setQueryData<PropertyComment[]>(['comments', propertyId], (old) => {
              // Don't add if it already exists
              if (old?.some((c) => c.id === newComment.id)) {
                return old;
              }
              return [...(old || []), newComment];
            });
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData<PropertyComment[]>(['comments', propertyId], (old) => {
              if (!old) return old;
              return old.map((c) =>
                c.id === payload.new.id
                  ? {
                      ...c,
                      content: payload.new.content,
                      updatedAt: payload.new.updated_at,
                    }
                  : c
              );
            });
          } else if (payload.eventType === 'DELETE') {
            queryClient.setQueryData<PropertyComment[]>(['comments', propertyId], (old) => {
              if (!old) return old;
              return old.filter((c) => c.id !== payload.old.id);
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from comments for property:', propertyId);
      supabase.removeChannel(channel);
    };
  }, [propertyId, queryClient]);
}
