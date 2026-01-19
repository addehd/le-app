import { create } from 'zustand';
import { supabase } from '../api/supabaseClient';
import { goApiClient, PROPERTY_KEYWORDS } from '../api/goApiClient';

export type EnrichmentStatus = 'og_only' | 'llm_processing' | 'llm_complete' | 'llm_failed';

export interface PropertyLinkData {
  // Core Info (Stage 1: OG metadata)
  price?: number;
  currency?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  
  // Property Details (Stage 2: LLM enrichment)
  bedrooms?: number;
  bathrooms?: number;
  area?: number;          // sqm
  areaUnit?: string;
  rooms?: number;         // total rooms
  floor?: string | number;
  buildYear?: number;
  propertyType?: string;  // apartment, house, villa, etc.
  
  // Financial (LLM)
  monthlyFee?: number;    // avgift
  operatingCost?: number; // driftskostnad
  
  // Features (LLM)
  elevator?: string | boolean;
  balcony?: string | boolean;
  parking?: string | boolean;
  features?: string[];    // array of feature strings
  
  // Legacy field
  energyClass?: string;
  
  // Metadata
  source?: string;        // hemnet, blocket, etc.
  publishedDate?: string;
  
  // Enrichment tracking
  enrichmentStatus?: EnrichmentStatus;
  lastEnriched?: string;  // ISO timestamp
}

export interface PropertyLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  image?: string;         // Primary image (for backward compatibility)
  images?: string[];      // All images from property listing
  sharedBy: string;
  sharedAt: string;
  latitude?: number;
  longitude?: number;
  propertyData?: PropertyLinkData;
}

interface PropertyLinkState {
  propertyLinks: PropertyLink[];
  isLoading: boolean;
  error: string | null;
  addPropertyLink: (url: string, sharedBy: string, latitude?: number, longitude?: number) => Promise<PropertyLink>;
  savePropertyLink: (link: Omit<PropertyLink, 'id' | 'sharedAt'> & { id?: string; sharedAt?: string }) => Promise<PropertyLink>;
  removePropertyLink: (linkId: string) => Promise<void>;
  fetchPropertyData: (url: string) => Promise<{ title?: string; description?: string; image?: string; images?: string[]; propertyData?: PropertyLinkData }>;
  loadFromDatabase: () => Promise<void>;
  subscribeToEnrichmentUpdates: () => () => void;
  updatePropertyFromRealtime: (updatedProperty: any) => void;
}

// Simple localStorage helpers - check both window AND localStorage exist (React Native has window but no localStorage)
const savePropertyLinks = (links: PropertyLink[]) => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    window.localStorage.setItem('property-links', JSON.stringify(links));
  }
};

const loadPropertyLinks = (): PropertyLink[] => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    const item = window.localStorage.getItem('property-links');
    return item ? JSON.parse(item) : [];
  }
  return [];
};

export const usePropertyLinkStore = create<PropertyLinkState>((set, get) => ({
  propertyLinks: loadPropertyLinks(),
  isLoading: false,
  error: null,

  /**
   * Two-stage property data extraction:
   * Stage 1: Fast OG metadata extraction (immediate)
   * Stage 2: LLM enrichment (async, triggered automatically)
   */
  fetchPropertyData: async (url: string) => {
    try {
      // Validate URL
      let urlObj: URL;
      try {
        urlObj = new URL(url);
      } catch {
        throw new Error('Invalid URL format');
      }

      // Check if Go API is configured
      if (!goApiClient.isConfigured()) {
        console.warn('⚠️ Go API not configured, using fallback');
        return {
          title: urlObj.hostname.replace('www.', ''),
          description: `Property from ${urlObj.hostname.replace('www.', '')}`,
          image: '',
          propertyData: {
            enrichmentStatus: 'og_only' as const,
          }
        };
      }

      // STAGE 1: Extract OG metadata (fast, synchronous)
      console.log('📥 Stage 1: Extracting OG metadata for', url);
      const ogResponse = await goApiClient.extractOGMetadata(url);

      if (ogResponse.error) {
        console.error('OG extraction error:', ogResponse.error);
        return {
          title: urlObj.hostname.replace('www.', ''),
          description: `Property from ${urlObj.hostname.replace('www.', '')}`,
          image: '',
          propertyData: {
            enrichmentStatus: 'llm_failed' as const,
          }
        };
      }

      // Convert OG response to PropertyLinkData format
      const propertyData: PropertyLinkData = {
        // OG metadata
        price: ogResponse.price,
        currency: ogResponse.currency || 'SEK',
        address: ogResponse.address,
        city: ogResponse.city,
        area: ogResponse.area,
        bedrooms: ogResponse.bedrooms,
        
        // Enrichment tracking
        enrichmentStatus: 'og_only',
        lastEnriched: new Date().toISOString(),
      };

      // Extract all images from OG data
      const images: string[] = [];
      if (ogResponse.image) {
        images.push(ogResponse.image);
      }
      if (ogResponse.og?.image) {
        images.push(...ogResponse.og.image.filter(img => img && !images.includes(img)));
      }

      console.log('✅ Stage 1 complete:', { 
        title: ogResponse.title, 
        hasPrice: !!ogResponse.price,
        imageCount: images.length 
      });

      // STAGE 2: Trigger async LLM enrichment (fire-and-forget)
      // The Go API (/go/crawler-og) already triggers /go/auto-crawl asynchronously
      // The enriched data will be saved to property_links via Realtime updates
      console.log('🚀 Stage 2: LLM enrichment triggered (async)');

      return {
        title: ogResponse.title || urlObj.hostname.replace('www.', ''),
        description: ogResponse.description || '',
        image: ogResponse.image || '',
        images: images.length > 0 ? images : undefined,
        propertyData: Object.keys(propertyData).length > 0 ? propertyData : undefined
      };

    } catch (error) {
      console.error('Error fetching property data:', error);
      try {
        const urlObj = new URL(url);
        return {
          title: urlObj.hostname.replace('www.', ''),
          description: '',
          image: '',
          propertyData: {
            enrichmentStatus: 'llm_failed' as const,
          }
        };
      } catch {
        return {
          title: 'Property Link',
          description: '',
          image: '',
          propertyData: {
            enrichmentStatus: 'llm_failed' as const,
          }
        };
      }
    }
  },

  addPropertyLink: async (url: string, sharedBy: string, latitude?: number, longitude?: number) => {
    set({ isLoading: true, error: null });

    try {
      const propertyInfo = await get().fetchPropertyData(url);

      const newLink: PropertyLink = {
        id: Date.now().toString(),
        url,
        title: propertyInfo.title,
        description: propertyInfo.description,
        image: propertyInfo.image,
        images: propertyInfo.images,
        sharedBy,
        sharedAt: new Date().toISOString(),
        latitude,
        longitude,
        propertyData: propertyInfo.propertyData,
      };

      // 1. Optimistic update - Update UI immediately (localStorage)
      const updatedLinks = [newLink, ...get().propertyLinks];
      set({
        propertyLinks: updatedLinks,
        isLoading: false,
      });
      savePropertyLinks(updatedLinks);

      // 2. Save to database (Supabase) - async, don't block UI
      try {
        const { error: dbError } = await supabase
          .from('property_links')
          .insert({
            id: newLink.id,
            url: newLink.url,
            title: newLink.title,
            description: newLink.description,
            image: newLink.image,
            shared_by: newLink.sharedBy,
            shared_at: newLink.sharedAt,
            latitude: newLink.latitude,
            longitude: newLink.longitude,
            property_data: newLink.propertyData,
          });

        if (dbError) {
          console.error('Failed to save to database:', dbError);
          // Don't revert - keep local copy even if DB save fails
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue - local storage still works
      }

      return newLink;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  savePropertyLink: async (linkData) => {
    const newLink: PropertyLink = {
      id: linkData.id || Date.now().toString(),
      url: linkData.url,
      title: linkData.title,
      description: linkData.description,
      image: linkData.image,
      sharedBy: linkData.sharedBy,
      sharedAt: linkData.sharedAt || new Date().toISOString(),
      latitude: linkData.latitude,
      longitude: linkData.longitude,
      propertyData: linkData.propertyData,
    };

    // 1. Optimistic update - Update UI immediately (localStorage)
    const updatedLinks = [newLink, ...get().propertyLinks];
    set({ propertyLinks: updatedLinks });
    savePropertyLinks(updatedLinks);

    // 2. Save to database (Supabase) - async, don't block UI
    try {
      const { error: dbError } = await supabase
        .from('property_links')
        .insert({
          id: newLink.id,
          url: newLink.url,
          title: newLink.title,
          description: newLink.description,
          image: newLink.image,
          shared_by: newLink.sharedBy,
          shared_at: newLink.sharedAt,
          latitude: newLink.latitude,
          longitude: newLink.longitude,
          property_data: newLink.propertyData,
        });

      if (dbError) {
        console.error('Failed to save to database:', dbError);
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    return newLink;
  },

  removePropertyLink: async (linkId: string) => {
    // Optimistic update
    const updatedLinks = get().propertyLinks.filter((link) => link.id !== linkId);
    set({ propertyLinks: updatedLinks });
    savePropertyLinks(updatedLinks);

    // Sync to database
    try {
      await supabase
        .from('property_links')
        .delete()
        .eq('id', linkId);
    } catch (error) {
      console.error('Failed to delete from database:', error);
      // Don't revert - local deletion is more important
    }
  },

  loadFromDatabase: async () => {
    try {
      const { data, error } = await supabase
        .from('property_links')
        .select('*')
        .order('shared_at', { ascending: false });

      if (error) {
        console.error('Failed to load from database:', error);
        return;
      }

      if (data) {
        // Convert from snake_case (database) to camelCase (app)
        const links: PropertyLink[] = data.map((item: any) => ({
          id: item.id,
          url: item.url,
          title: item.title,
          description: item.description,
          image: item.image,
          sharedBy: item.shared_by,
          sharedAt: item.shared_at,
          latitude: item.latitude,
          longitude: item.longitude,
          propertyData: item.property_data,
        }));

        // Merge with local links (prefer local for conflicts)
        const localLinks = get().propertyLinks;
        const localIds = new Set(localLinks.map(l => l.id));
        const dbOnlyLinks = links.filter(l => !localIds.has(l.id));
        const mergedLinks = [...localLinks, ...dbOnlyLinks];

        set({ propertyLinks: mergedLinks });
        savePropertyLinks(mergedLinks);
      }
    } catch (error) {
      console.error('Error loading from database:', error);
    }
  },

  /**
   * Subscribe to Realtime updates for property enrichment
   * Returns unsubscribe function
   */
  subscribeToEnrichmentUpdates: () => {
    console.log('🔔 Subscribing to property enrichment updates...');
    
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
          get().updatePropertyFromRealtime(payload.new);
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    // Return unsubscribe function
    return () => {
      console.log('🔕 Unsubscribing from property enrichment updates');
      supabase.removeChannel(channel);
    };
  },

  /**
   * Handle incoming Realtime property updates (LLM enrichment)
   */
  updatePropertyFromRealtime: (updatedProperty: any) => {
    const currentLinks = get().propertyLinks;
    
    // Find the property to update
    const index = currentLinks.findIndex(link => link.id === updatedProperty.id);
    
    if (index === -1) {
      console.log('⚠️ Received update for unknown property:', updatedProperty.id);
      return;
    }

    console.log('✨ Updating property with enriched data:', updatedProperty.id);

    // Convert from snake_case (database) to camelCase (app)
    const enrichedLink: PropertyLink = {
      ...currentLinks[index],
      title: updatedProperty.title || currentLinks[index].title,
      description: updatedProperty.description || currentLinks[index].description,
      image: updatedProperty.image || currentLinks[index].image,
      latitude: updatedProperty.latitude ?? currentLinks[index].latitude,
      longitude: updatedProperty.longitude ?? currentLinks[index].longitude,
      propertyData: updatedProperty.property_data 
        ? { ...currentLinks[index].propertyData, ...updatedProperty.property_data }
        : currentLinks[index].propertyData,
    };

    // Update the property in the list
    const updatedLinks = [
      ...currentLinks.slice(0, index),
      enrichedLink,
      ...currentLinks.slice(index + 1),
    ];

    // Update state and localStorage
    set({ propertyLinks: updatedLinks });
    savePropertyLinks(updatedLinks);

    // Log enrichment status
    if (enrichedLink.propertyData?.enrichmentStatus) {
      console.log(`📊 Property enrichment status: ${enrichedLink.propertyData.enrichmentStatus}`);
    }
  },
}));
