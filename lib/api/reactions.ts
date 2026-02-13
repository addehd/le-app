import { supabase } from './supabaseClient';
import { PropertyReaction } from '../types/property';

/**
 * Reactions API - All server operations for property reactions
 */

/**
 * Fetch reactions for a specific property
 */
export async function fetchReactions(propertyId: string): Promise<PropertyReaction[]> {
  const { data, error } = await supabase
    .from('property_reactions')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch reactions:', error);
    throw error;
  }

  // Convert to camelCase
  return (data || []).map(item => ({
    id: item.id,
    propertyId: item.property_id,
    userId: item.user_id,
    emoji: item.emoji,
    createdAt: item.created_at,
  }));
}

/**
 * Add a reaction to a property
 */
export async function addReaction(
  propertyId: string,
  emoji: string,
  userId: string
): Promise<PropertyReaction> {
  const { data, error } = await supabase
    .from('property_reactions')
    .insert({
      property_id: propertyId,
      user_id: userId,
      emoji: emoji,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to add reaction:', error);
    throw error;
  }

  return {
    id: data.id,
    propertyId: data.property_id,
    userId: data.user_id,
    emoji: data.emoji,
    createdAt: data.created_at,
  };
}

/**
 * Remove a reaction
 */
export async function removeReaction(reactionId: string): Promise<void> {
  const { error } = await supabase
    .from('property_reactions')
    .delete()
    .eq('id', reactionId);

  if (error) {
    console.error('Failed to remove reaction:', error);
    throw error;
  }
}
