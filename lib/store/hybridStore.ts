import { create } from 'zustand';
import { supabase } from '../api/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  friends: string[];
}

interface SharedLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  image?: string;
  sharedBy: string;
  sharedAt: string;
}

interface AppState {
  // Auth
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  
  // Links
  sharedLinks: SharedLink[];
  isLinkLoading: boolean;
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
  
  // Profile methods  
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addFriend: (friendEmail: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  
  // Link methods
  addLink: (url: string) => Promise<void>;
  removeLink: (linkId: string) => Promise<void>;
  loadLinks: () => Promise<void>;
}

// localStorage helpers for caching - check both window AND localStorage (React Native has window but no localStorage)
const cache = {
  saveProfile: (profile: UserProfile) => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem('cached-profile', JSON.stringify(profile));
    }
  },
  
  getProfile: (): UserProfile | null => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      const cached = window.localStorage.getItem('cached-profile');
      return cached ? JSON.parse(cached) : null;
    }
    return null;
  },
  
  saveLinks: (links: SharedLink[]) => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem('cached-links', JSON.stringify(links));
    }
  },
  
  getLinks: (): SharedLink[] => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      const cached = window.localStorage.getItem('cached-links');
      return cached ? JSON.parse(cached) : [];
    }
    return [];
  },
  
  clear: () => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.removeItem('cached-profile');
      window.localStorage.removeItem('cached-links');
    }
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  userProfile: cache.getProfile(),
  session: null,
  isLoading: true,
  error: null,
  sharedLinks: cache.getLinks(),
  isLinkLoading: false,

  initialize: () => {
    // Get initial session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ 
        session, 
        user: session?.user ?? null,
        isLoading: false 
      });
      
      if (session?.user) {
        get().loadUserProfile(session.user.id);
        get().loadLinks();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({ 
          session, 
          user: session?.user ?? null,
          isLoading: false 
        });
        
        if (session?.user) {
          get().loadUserProfile(session.user.id);
          get().loadLinks();
        } else {
          set({ userProfile: null, sharedLinks: [] });
          cache.clear();
        }
      }
    );

    return () => subscription?.unsubscribe?.();
  },

  loadUserProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        set({ userProfile: data });
        cache.saveProfile(data); // Cache locally
      } else {
        // Create new profile if it doesn't exist
        const { user } = get();
        if (user) {
          const newProfile: UserProfile = {
            id: user.id,
            email: user.email!,
            friends: []
          };
          await get().updateProfile(newProfile);
        }
      }
    } catch (error: any) {
      console.error('Error loading user profile:', error.message);
    }
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
      
      set({ userProfile: null, sharedLinks: [] });
      cache.clear();
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

    try {
      // Save to database
      const { error } = await supabase
        .from('profiles')
        .upsert(updatedProfile);

      if (error) throw error;

      // Update local state and cache
      set({ userProfile: updatedProfile });
      cache.saveProfile(updatedProfile);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  addFriend: async (friendEmail: string) => {
    try {
      // Find friend in database
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', friendEmail.trim().toLowerCase())
        .single();

      if (error || !data) {
        throw new Error('User not found');
      }

      const { userProfile } = get();
      if (!userProfile) return;

      if (data.id === userProfile.id) {
        throw new Error('You cannot add yourself as a friend');
      }

      if (userProfile.friends.includes(data.id)) {
        throw new Error('User is already your friend');
      }

      const updatedFriends = [...userProfile.friends, data.id];
      await get().updateProfile({ friends: updatedFriends });
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  removeFriend: async (friendId: string) => {
    const { userProfile } = get();
    if (!userProfile) return;

    const updatedFriends = userProfile.friends.filter(id => id !== friendId);
    await get().updateProfile({ friends: updatedFriends });
  },

  loadLinks: async () => {
    set({ isLinkLoading: true });
    
    try {
      const { data, error } = await supabase
        .from('shared_links')
        .select('*')
        .order('shared_at', { ascending: false });

      if (error) throw error;

      const links = data || [];
      set({ sharedLinks: links });
      cache.saveLinks(links); // Cache locally
    } catch (error: any) {
      console.error('Error loading links:', error.message);
    } finally {
      set({ isLinkLoading: false });
    }
  },

  addLink: async (url: string) => {
    const { user } = get();
    if (!user) return;

    set({ isLinkLoading: true });

    try {
      // Simple OG data extraction
      const getOGData = (url: string) => {
        if (url.includes('youtube.com')) return { title: 'YouTube Video', description: 'Video content' };
        if (url.includes('github.com')) return { title: 'GitHub Repository', description: 'Code repository' };
        try {
          const urlObj = new URL(url);
          return { title: urlObj.hostname, description: `Content from ${urlObj.hostname}` };
        } catch {
          return { title: 'Shared Link', description: 'User shared link' };
        }
      };

      const ogData = getOGData(url);
      
      const newLink = {
        url,
        title: ogData.title,
        description: ogData.description,
        shared_by: user.email!,
        shared_at: new Date().toISOString(),
      };

      // Save to database
      const { data, error } = await supabase
        .from('shared_links')
        .insert([newLink])
        .select()
        .single();

      if (error) throw error;

      // Update local state and cache
      const updatedLinks = [data, ...get().sharedLinks];
      set({ sharedLinks: updatedLinks });
      cache.saveLinks(updatedLinks);
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLinkLoading: false });
    }
  },

  removeLink: async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('shared_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      const updatedLinks = get().sharedLinks.filter(link => link.id !== linkId);
      set({ sharedLinks: updatedLinks });
      cache.saveLinks(updatedLinks);
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));