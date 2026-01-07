import { create } from 'zustand';
import { supabase } from '../api/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  friends: string[];
}

interface AuthState {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
}

// Simple localStorage helpers - check both window AND localStorage (React Native has window but no localStorage)
const saveToLocalStorage = (key: string, data: any) => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(data));
  }
};

const getFromLocalStorage = (key: string) => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  return null;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  session: null,
  isLoading: true,
  error: null,

  initialize: () => {
    // Load cached profile from localStorage
    const cachedProfile = getFromLocalStorage('user-profile');
    if (cachedProfile) {
      set({ userProfile: cachedProfile });
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ 
        session, 
        user: session?.user ?? null,
        isLoading: false 
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({ 
          session, 
          user: session?.user ?? null,
          isLoading: false 
        });
        
        if (!session?.user) {
          set({ userProfile: null });
          saveToLocalStorage('user-profile', null);
        }
      }
    );

    return () => subscription?.unsubscribe?.();
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ userProfile: null });
      saveToLocalStorage('user-profile', null);
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates: Partial<UserProfile>) => {
    const { userProfile } = get();
    if (!userProfile) return;

    const updatedProfile = { ...userProfile, ...updates };
    set({ userProfile: updatedProfile });
    saveToLocalStorage('user-profile', updatedProfile);
  },

  addFriend: async (friendId: string) => {
    const { userProfile } = get();
    if (!userProfile) return;

    const updatedFriends = [...userProfile.friends, friendId];
    await get().updateProfile({ friends: updatedFriends });
  },

  removeFriend: async (friendId: string) => {
    const { userProfile } = get();
    if (!userProfile) return;

    const updatedFriends = userProfile.friends.filter(id => id !== friendId);
    await get().updateProfile({ friends: updatedFriends });
  },
}));