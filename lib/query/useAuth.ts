import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../api/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

/**
 * React Query hook for authentication
 * Manages auth state and listens to Supabase auth changes
 */
export function useAuth() {
  const queryClient = useQueryClient();

  // Fetch current session
  const sessionQuery = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    staleTime: Infinity, // Session doesn't go stale, we rely on auth state change listener
  });

  // Fetch current user (derived from session)
  const userQuery = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
    enabled: !!sessionQuery.data, // Only fetch if we have a session
    staleTime: Infinity,
  });

  // Listen to auth state changes
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('🔐 Auth state changed:', _event);
        
        // Update session in cache
        queryClient.setQueryData(['session'], session);
        
        // Update user in cache
        queryClient.setQueryData(['user'], session?.user ?? null);
        
        // Clear all queries on sign out
        if (!session) {
          queryClient.clear();
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [queryClient]);

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['session'], data.session);
      queryClient.setQueryData(['user'], data.user);
    },
  });

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.session) {
        queryClient.setQueryData(['session'], data.session);
        queryClient.setQueryData(['user'], data.user);
      }
    },
  });

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(['session'], null);
      queryClient.setQueryData(['user'], null);
      // Clear all cached data on sign out
      queryClient.clear();
    },
  });

  return {
    // Auth state
    session: sessionQuery.data ?? null,
    user: userQuery.data ?? null,
    isLoading: sessionQuery.isLoading,
    error: sessionQuery.error || userQuery.error,

    // Auth actions
    signIn: signInMutation.mutate,
    signInAsync: signInMutation.mutateAsync,
    isSigningIn: signInMutation.isPending,
    signInError: signInMutation.error,

    signUp: signUpMutation.mutate,
    signUpAsync: signUpMutation.mutateAsync,
    isSigningUp: signUpMutation.isPending,
    signUpError: signUpMutation.error,

    signOut: signOutMutation.mutate,
    signOutAsync: signOutMutation.mutateAsync,
    isSigningOut: signOutMutation.isPending,
    signOutError: signOutMutation.error,
  };
}
