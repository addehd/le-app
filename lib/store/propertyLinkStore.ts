import { create } from 'zustand';
import { supabase } from '../api/supabaseClient';

export interface PropertyLinkData {
  price?: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  areaUnit?: string;
  propertyType?: string;
  address?: string;
  city?: string;
  energyClass?: string;
  builtYear?: number;
  floor?: string;
  monthlyFee?: number;
}

export interface PropertyLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  image?: string;
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
  fetchPropertyData: (url: string) => Promise<{ title?: string; description?: string; image?: string; propertyData?: PropertyLinkData }>;
  loadFromDatabase: () => Promise<void>;
}

// Simple localStorage helpers
const savePropertyLinks = (links: PropertyLink[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('property-links', JSON.stringify(links));
  }
};

const loadPropertyLinks = (): PropertyLink[] => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem('property-links');
    return item ? JSON.parse(item) : [];
  }
  return [];
};

export const usePropertyLinkStore = create<PropertyLinkState>((set, get) => ({
  propertyLinks: loadPropertyLinks(),
  isLoading: false,
  error: null,

  fetchPropertyData: async (url: string) => {
    try {
      // Validate URL
      let urlObj: URL;
      try {
        urlObj = new URL(url);
      } catch {
        throw new Error('Invalid URL format');
      }

      let html: string;

      // Try to fetch the URL using CORS proxy
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl, {
          headers: {
            'Accept': 'text/html,application/xhtml+xml',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        html = await response.text();
      } catch (error) {
        console.error('Failed to fetch URL:', error);
        return {
          title: urlObj.hostname.replace('www.', ''),
          description: `Property from ${urlObj.hostname.replace('www.', '')}`,
          image: ''
        };
      }

      // Parse HTML to extract OG tags and property data
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Helper to get meta tag content
      const getMetaContent = (property: string, name?: string): string => {
        let element = doc.querySelector(`meta[property="${property}"]`);
        if (element) {
          return element.getAttribute('content') || '';
        }

        if (name) {
          element = doc.querySelector(`meta[name="${name}"]`);
          if (element) {
            return element.getAttribute('content') || '';
          }
        }

        return '';
      };

      // Extract basic OG metadata
      const title = getMetaContent('og:title') ||
                    getMetaContent('', 'twitter:title') ||
                    doc.querySelector('title')?.textContent?.trim() ||
                    urlObj.hostname.replace('www.', '');

      const description = getMetaContent('og:description') ||
                         getMetaContent('', 'twitter:description') ||
                         getMetaContent('', 'description') ||
                         '';

      const image = getMetaContent('og:image') ||
                   getMetaContent('', 'twitter:image') ||
                   '';

      // Extract property-specific data from structured data (schema.org)
      const propertyData: PropertyLinkData = {};

      // Look for JSON-LD structured data
      const scriptTags = doc.querySelectorAll('script[type="application/ld+json"]');
      for (let i = 0; i < scriptTags.length; i++) {
        try {
          const jsonData = JSON.parse(scriptTags[i].textContent || '');

          // Check if it's a property listing
          if (jsonData['@type'] === 'RealEstateListing' || jsonData['@type'] === 'Apartment' || jsonData['@type'] === 'House') {
            // Extract price
            if (jsonData.offers?.price) {
              propertyData.price = parseFloat(jsonData.offers.price);
              propertyData.currency = jsonData.offers.priceCurrency || 'SEK';
            }

            // Extract bedrooms/bathrooms
            if (jsonData.numberOfRooms) {
              propertyData.bedrooms = parseInt(jsonData.numberOfRooms);
            }
            if (jsonData.numberOfBedrooms) {
              propertyData.bedrooms = parseInt(jsonData.numberOfBedrooms);
            }
            if (jsonData.numberOfBathroomsTotal) {
              propertyData.bathrooms = parseInt(jsonData.numberOfBathroomsTotal);
            }

            // Extract area
            if (jsonData.floorSize?.value) {
              propertyData.area = parseFloat(jsonData.floorSize.value);
              propertyData.areaUnit = jsonData.floorSize.unitText || 'm²';
            }

            // Extract address
            if (jsonData.address) {
              if (typeof jsonData.address === 'string') {
                propertyData.address = jsonData.address;
              } else {
                propertyData.address = jsonData.address.streetAddress;
                propertyData.city = jsonData.address.addressLocality;
              }
            }
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }

      // Also try to extract from common meta tags used by property sites
      const priceFromMeta = getMetaContent('property:price:amount') || getMetaContent('product:price:amount');
      if (priceFromMeta && !propertyData.price) {
        propertyData.price = parseFloat(priceFromMeta);
      }

      const currencyFromMeta = getMetaContent('property:price:currency') || getMetaContent('product:price:currency');
      if (currencyFromMeta && !propertyData.currency) {
        propertyData.currency = currencyFromMeta;
      }

      console.log('Fetched property data for', url, { title, description, image, propertyData });

      return {
        title: title.trim(),
        description: description.trim(),
        image: image.trim(),
        propertyData: Object.keys(propertyData).length > 0 ? propertyData : undefined
      };
    } catch (error) {
      console.error('Error fetching property data:', error);
      try {
        const urlObj = new URL(url);
        return {
          title: urlObj.hostname.replace('www.', ''),
          description: '',
          image: ''
        };
      } catch {
        return {
          title: 'Property Link',
          description: '',
          image: ''
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
}));
