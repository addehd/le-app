import { create } from 'zustand';
import { supabase } from '../../lib/api/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PropertyData {
  address: {
    street: string;
    area: string;
    city: string;
  };
  property_type: string;
  rooms: {
    total: number;
    bedrooms: number;
  };
  area: {
    living_space: number;
    unit: string;
  };
  status: string;
  floor: {
    current: number;
    total: number;
  };
  built_year: number;
  energy_class: string;
  monthly_fee: {
    amount: number;
    currency: string;
  };
  highlights: string[];
}

export interface Place {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  created_at?: string;
  propertyData?: PropertyData;
  url?: string;
}

interface MapState {
  places: Place[];
  isLoading: boolean;
  error: string | null;
  fetchPlaces: () => Promise<void>;
  refreshPlaces: () => Promise<void>;
  addProperty: (property: Place) => Promise<void>;
  loadLocalProperties: () => Promise<void>;
}

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return url && url !== 'YOUR_SUPABASE_URL' && !url.includes('YOUR_');
};

const STORAGE_KEY = '@map_properties';

export const useMapStore = create<MapState>((set, get) => ({
  places: [],
  isLoading: false,
  error: null,

  loadLocalProperties: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const localProperties = JSON.parse(stored);
        set({ places: localProperties });
        console.log('📍 Loaded properties from local storage:', localProperties.length);
      }
    } catch (error) {
      console.error('Error loading local properties:', error);
    }
  },

  addProperty: async (property: Place) => {
    const currentPlaces = get().places;
    const newPlaces = [...currentPlaces, property];
    set({ places: newPlaces });
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPlaces));
      console.log('✅ Property saved to local storage');
    } catch (error) {
      console.error('Error saving property to local storage:', error);
    }
  },

  fetchPlaces: async () => {
    set({ isLoading: true, error: null });

    // First load local properties
    await get().loadLocalProperties();

    if (!isSupabaseConfigured()) {
      set({
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('hem')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      console.log('📍 Fetched places from Supabase:', data?.length || 0);
      
      // Validate and filter Supabase data to ensure it has required fields
      const validSupabasePlaces = (data || []).filter((place: any) => {
        const isValid = place.latitude != null && 
                       place.longitude != null && 
                       typeof place.latitude === 'number' && 
                       typeof place.longitude === 'number';
        if (!isValid) {
          console.warn('⚠️ Skipping invalid place from Supabase:', place);
        }
        return isValid;
      });
      
      // Merge Supabase data with local properties, avoiding duplicates
      const localPlaces = get().places;
      const localIds = new Set(localPlaces.map(p => p.id));
      const uniqueSupabasePlaces = validSupabasePlaces.filter((p: any) => !localIds.has(p.id));
      const mergedPlaces = [...localPlaces, ...uniqueSupabasePlaces];
      set({ places: mergedPlaces, isLoading: false });
    } catch (error) {
      console.error('Error fetching places from Supabase:', error);
      set({
        isLoading: false,
        error: 'Failed to load places from Supabase',
      });
    }
  },

  refreshPlaces: async () => {
    // Force refresh from database or mock data
    set({ places: [], error: null });
    await get().fetchPlaces();
  },
}));
