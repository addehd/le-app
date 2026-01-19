import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import { supabase } from '../../api/supabaseClient';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      userProfile: null,
      session: null,
      isLoading: false,
      error: null
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('signIn', () => {
    test('updates user and session state on successful sign in', async () => {
      // Mock successful auth response
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated' as const
      };
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer' as const,
        expires_in: 3600,
        user: mockUser
      };

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      });

      const store = useAuthStore.getState();
      await store.signIn('test@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    test('sets error on failed sign in', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { name: 'AuthError', message: 'Invalid login credentials', status: 400 }
      });

      const store = useAuthStore.getState();
      await store.signIn('test@example.com', 'wrong-password');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.error).toBe('Invalid login credentials');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('signOut', () => {
    test('clears user state on sign out', async () => {
      // Setup: set signed in state
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated' as const
      };

      useAuthStore.setState({
        user: mockUser,
        userProfile: {
          id: 'user-123',
          email: 'test@example.com',
          friends: []
        }
      });

      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      const store = useAuthStore.getState();
      await store.signOut();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.userProfile).toBeNull();
      expect(state.error).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    test('sets error state on failed sign out', async () => {
      useAuthStore.setState({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          role: 'authenticated' as const
        },
      });

      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: { name: 'AuthError', message: 'Network error', status: 500 }
      });

      const store = useAuthStore.getState();
      await store.signOut();

      const state = useAuthStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('signUp', () => {
    test('creates new user account', async () => {
      const mockUser = {
        id: 'new-user-123',
        email: 'new@example.com',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated' as const
      };

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      const store = useAuthStore.getState();
      await store.signUp('new@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123'
      });
    });

    test('handles duplicate email error', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: { name: 'AuthError', message: 'User already registered', status: 422 }
      });

      const store = useAuthStore.getState();
      await store.signUp('existing@example.com', 'password123');

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.error).toBe('User already registered');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('initialize', () => {
    test('loads session from Supabase on init', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        role: 'authenticated' as const
      };
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer' as const,
        expires_in: 3600,
        user: mockUser
      };

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const store = useAuthStore.getState();
      store.initialize();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 50));

      const state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    test('handles no session gracefully', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null
      });

      const store = useAuthStore.getState();
      store.initialize();

      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 50));

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateProfile', () => {
    test('updates user profile and saves to localStorage', async () => {
      // Setup: set initial profile
      useAuthStore.setState({
        userProfile: {
          id: 'user-123',
          email: 'test@example.com',
          full_name: 'Test User',
          friends: []
        }
      });

      const store = useAuthStore.getState();
      await store.updateProfile({ full_name: 'Updated Name' });

      const state = useAuthStore.getState();
      expect(state.userProfile?.full_name).toBe('Updated Name');
      expect(state.userProfile?.email).toBe('test@example.com');
      expect(state.userProfile?.id).toBe('user-123');
    });

    test('does nothing if no profile exists', async () => {
      useAuthStore.setState({
        userProfile: null
      });

      const store = useAuthStore.getState();
      await store.updateProfile({ full_name: 'New Name' });

      const state = useAuthStore.getState();
      expect(state.userProfile).toBeNull();
    });
  });

  describe('addFriend', () => {
    test('adds friend to profile', async () => {
      // Setup: set initial profile
      useAuthStore.setState({
        userProfile: {
          id: 'user-123',
          email: 'test@example.com',
          friends: []
        }
      });

      const store = useAuthStore.getState();
      await store.addFriend('friend-456');

      const state = useAuthStore.getState();
      expect(state.userProfile?.friends).toContain('friend-456');
      expect(state.userProfile?.friends).toHaveLength(1);
    });

    test('does nothing if no profile exists', async () => {
      useAuthStore.setState({
        userProfile: null
      });

      const store = useAuthStore.getState();
      await store.addFriend('friend-456');

      const state = useAuthStore.getState();
      expect(state.userProfile).toBeNull();
    });
  });

  describe('removeFriend', () => {
    test('removes friend from profile', async () => {
      // Setup: set initial profile with friends
      useAuthStore.setState({
        userProfile: {
          id: 'user-123',
          email: 'test@example.com',
          friends: ['friend-456', 'friend-789']
        }
      });

      const store = useAuthStore.getState();
      await store.removeFriend('friend-456');

      const state = useAuthStore.getState();
      expect(state.userProfile?.friends).not.toContain('friend-456');
      expect(state.userProfile?.friends).toContain('friend-789');
      expect(state.userProfile?.friends).toHaveLength(1);
    });

    test('does nothing if no profile exists', async () => {
      useAuthStore.setState({
        userProfile: null
      });

      const store = useAuthStore.getState();
      await store.removeFriend('friend-456');

      const state = useAuthStore.getState();
      expect(state.userProfile).toBeNull();
    });
  });
});
