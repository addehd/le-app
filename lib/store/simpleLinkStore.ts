import { create } from 'zustand';

export interface SharedLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
  image?: string;
  sharedBy: string;
  sharedAt: string;
  latitude?: number;
  longitude?: number;
}

interface LinkState {
  sharedLinks: SharedLink[];
  isLoading: boolean;
  error: string | null;
  addLink: (url: string, sharedBy: string, latitude?: number, longitude?: number) => Promise<SharedLink>;
  removeLink: (linkId: string) => void;
  fetchOGData: (url: string) => Promise<{ title?: string; description?: string; image?: string }>;
}

// Simple localStorage helpers - check both window AND localStorage (React Native has window but no localStorage)
const saveLinks = (links: SharedLink[]) => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    window.localStorage.setItem('shared-links', JSON.stringify(links));
  }
};

const loadLinks = (): SharedLink[] => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    const item = window.localStorage.getItem('shared-links');
    return item ? JSON.parse(item) : [];
  }
  return [];
};

export const useLinkStore = create<LinkState>((set, get) => ({
  sharedLinks: loadLinks(),
  isLoading: false,
  error: null,

  fetchOGData: async (url: string) => {
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
        // Use AllOrigins CORS proxy
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
        // Return fallback data based on domain
        return {
          title: urlObj.hostname.replace('www.', ''),
          description: `Content from ${urlObj.hostname.replace('www.', '')}`,
          image: ''
        };
      }

      // Parse HTML to extract OG tags
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Helper to get meta tag content
      const getMetaContent = (property: string, name?: string): string => {
        // Try property attribute first (for og: tags)
        let element = doc.querySelector(`meta[property="${property}"]`);
        if (element) {
          return element.getAttribute('content') || '';
        }

        // Try name attribute (for other meta tags)
        if (name) {
          element = doc.querySelector(`meta[name="${name}"]`);
          if (element) {
            return element.getAttribute('content') || '';
          }
        }

        return '';
      };

      // Extract OG metadata
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

      console.log('Fetched OG data for', url, { title, description, image });

      return {
        title: title.trim(),
        description: description.trim(),
        image: image.trim()
      };
    } catch (error) {
      console.error('Error fetching OG data:', error);
      // Return URL as fallback
      try {
        const urlObj = new URL(url);
        return {
          title: urlObj.hostname.replace('www.', ''),
          description: '',
          image: ''
        };
      } catch {
        return {
          title: 'Shared Link',
          description: '',
          image: ''
        };
      }
    }
  },

  addLink: async (url: string, sharedBy: string, latitude?: number, longitude?: number) => {
    set({ isLoading: true, error: null });

    try {
      const ogData = await get().fetchOGData(url);
      
      const newLink: SharedLink = {
        id: Date.now().toString(),
        url,
        title: ogData.title,
        description: ogData.description,
        image: ogData.image,
        sharedBy,
        sharedAt: new Date().toISOString(),
        latitude,
        longitude,
      };

      const updatedLinks = [newLink, ...get().sharedLinks];
      set({
        sharedLinks: updatedLinks,
        isLoading: false,
      });

      saveLinks(updatedLinks);
      return newLink;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  removeLink: (linkId: string) => {
    const updatedLinks = get().sharedLinks.filter((link) => link.id !== linkId);
    set({ sharedLinks: updatedLinks });
    saveLinks(updatedLinks);
  },
}));