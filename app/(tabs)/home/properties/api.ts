/**
 * Properties Feature API
 * 
 * This file contains all API calls specific to the properties feature.
 * Following feature-based architecture, each feature owns its network logic.
 * 
 * Environment: EXPO_PUBLIC_CRAWLER_API_URL
 * Endpoint: /crawler-og - Fetches OG metadata from property listing URLs
 */

const CRAWLER_BASE_URL = process.env.EXPO_PUBLIC_CRAWLER_API_URL || '';

/**
 * Open Graph data returned from the crawler API
 */
export interface OGData {
  title?: string;
  description?: string;
  image?: string;
  // Extended property data if API returns it
  price?: number;
  currency?: string;
  address?: string;
  city?: string;
  area?: number;
  areaUnit?: string;
  bedrooms?: number;
  bathrooms?: number;
}

/**
 * Fetch OG metadata for a property listing URL
 * 
 * @param url - The property listing URL (e.g., from Hemnet, Booli)
 * @returns OG metadata including title, description, image, and property details
 * 
 * @example
 * const data = await fetchOGData('https://www.hemnet.se/bostad/...');
 * console.log(data.title); // "3 rum, 75 m² - Södermalm"
 */
export async function fetchOGData(url: string): Promise<OGData> {
  if (!CRAWLER_BASE_URL) {
    console.warn('EXPO_PUBLIC_CRAWLER_API_URL not configured, using fallback');
    return extractFallbackData(url);
  }

  try {
    const response = await fetch(
      `${CRAWLER_BASE_URL}/crawler-og?url=${encodeURIComponent(url)}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      title: data.title,
      description: data.description,
      image: data.image,
      price: data.price,
      currency: data.currency,
      address: data.address,
      city: data.city,
      area: data.area,
      areaUnit: data.areaUnit,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
    };
  } catch (error) {
    console.error('Failed to fetch OG data:', error);
    return extractFallbackData(url);
  }
}

function extractFallbackData(url: string): OGData {
  try {
    const urlObj = new URL(url);
    return {
      title: urlObj.hostname.replace('www.', ''),
      description: `Property from ${urlObj.hostname.replace('www.', '')}`,
    };
  } catch {
    return {
      title: 'Property Link',
      description: '',
    };
  }
}
