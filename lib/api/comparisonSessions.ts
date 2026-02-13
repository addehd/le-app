import { supabase } from './supabaseClient';
import { ComparisonSession } from '../types/property';

/**
 * Comparison Sessions API - All server operations for comparison sessions
 */

/**
 * Fetch all saved comparison sessions
 */
export async function fetchComparisonSessions(): Promise<ComparisonSession[]> {
  const { data, error } = await supabase
    .from('comparison_sessions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch comparison sessions:', error);
    throw error;
  }

  return (data || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    propertyIds: item.property_ids,
    sharedBy: item.shared_by,
    userAnnotations: item.user_annotations,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}

/**
 * Fetch a single comparison session by ID
 */
export async function fetchComparisonSession(sessionId: string): Promise<ComparisonSession> {
  const { data, error } = await supabase
    .from('comparison_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Failed to fetch comparison session:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    propertyIds: data.property_ids,
    sharedBy: data.shared_by,
    userAnnotations: data.user_annotations,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Save or update a comparison session
 */
export async function saveComparisonSession(
  session: Partial<ComparisonSession> & { propertyIds: string[]; sharedBy: string }
): Promise<ComparisonSession> {
  const sessionData = {
    id: session.id || Date.now().toString(),
    name: session.name,
    property_ids: session.propertyIds,
    shared_by: session.sharedBy,
    user_annotations: session.userAnnotations || {},
    created_at: session.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('comparison_sessions')
    .upsert(sessionData)
    .select()
    .single();

  if (error) {
    console.error('Failed to save comparison session:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    propertyIds: data.property_ids,
    sharedBy: data.shared_by,
    userAnnotations: data.user_annotations,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a comparison session
 */
export async function deleteComparisonSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('comparison_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to delete comparison session:', error);
    throw error;
  }
}
