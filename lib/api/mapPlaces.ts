import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

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

const STORAGE_KEY = '@map_properties';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return url && url !== 'YOUR_SUPABASE_URL' && !url.includes('YOUR_');
};

// Storage helpers that work on both web and native
const getStoredPlaces = async (): Promise<Place[]> => {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } else {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    }
  } catch (error) {
    console.error('Error loading local properties:', error);
    return [];
  }
};

const saveStoredPlaces = async (places: Place[]): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
    } else {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(places));
    }
  } catch (error) {
    console.error('Error saving local properties:', error);
  }
};

/**
 * Fetch places from both local storage and Supabase
 */
export async function fetchPlaces(): Promise<Place[]> {
  // First load local properties
  const localPlaces = await getStoredPlaces();
  console.log('📍 Loaded properties from local storage:', localPlaces.length);

  if (!isSupabaseConfigured()) {
    console.log('⚠️ Supabase not configured, using local storage only');
    return localPlaces;
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
    const localIds = new Set(localPlaces.map(p => p.id));
    const uniqueSupabasePlaces = validSupabasePlaces.filter((p: any) => !localIds.has(p.id));
    const mergedPlaces = [...localPlaces, ...uniqueSupabasePlaces];
    
    return mergedPlaces;
  } catch (error) {
    console.error('Error fetching places from Supabase:', error);
    // Return local places if Supabase fails
    return localPlaces;
  }
}

/**
 * Add a new property to local storage and optionally to Supabase
 */
export async function addPlace(place: Place): Promise<Place> {
  // Get current stored places
  const currentPlaces = await getStoredPlaces();
  const newPlaces = [...currentPlaces, place];
  
  // Save to local storage
  await saveStoredPlaces(newPlaces);
  console.log('✅ Property saved to local storage');

  // Optionally sync to Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('hem')
        .insert([place]);

      if (error) {
        console.error('Failed to sync to Supabase:', error);
        // Don't throw - local save succeeded
      } else {
        console.log('✅ Property synced to Supabase');
      }
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      // Don't throw - local save succeeded
    }
  }

  return place;
}
