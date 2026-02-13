import { supabase } from './supabaseClient';
import { PropertyComment } from '../types/property';

/**
 * Comments API - All server operations for property comments
 */

/**
 * Fetch comments for a specific property
 */
export async function fetchComments(propertyId: string): Promise<PropertyComment[]> {
  const { data, error } = await supabase
    .from('property_comments')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch comments:', error);
    throw error;
  }

  // Convert to camelCase
  return (data || []).map(item => ({
    id: item.id,
    propertyId: item.property_id,
    parentId: item.parent_id,
    userId: item.user_id,
    userName: item.user_name,
    content: item.content,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

/**
 * Add a comment to a property
 */
export async function addComment(
  propertyId: string,
  content: string,
  userId: string,
  userName: string,
  parentId?: string
): Promise<PropertyComment> {
  const { data, error } = await supabase
    .from('property_comments')
    .insert({
      property_id: propertyId,
      parent_id: parentId || null,
      user_id: userId,
      user_name: userName,
      content: content,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to add comment:', error);
    throw error;
  }

  return {
    id: data.id,
    propertyId: data.property_id,
    parentId: data.parent_id,
    userId: data.user_id,
    userName: data.user_name,
    content: data.content,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update a comment
 */
export async function updateComment(
  commentId: string,
  content: string
): Promise<PropertyComment> {
  const { data, error } = await supabase
    .from('property_comments')
    .update({ content })
    .eq('id', commentId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update comment:', error);
    throw error;
  }

  return {
    id: data.id,
    propertyId: data.property_id,
    parentId: data.parent_id,
    userId: data.user_id,
    userName: data.user_name,
    content: data.content,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('property_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Failed to delete comment:', error);
    throw error;
  }
}
