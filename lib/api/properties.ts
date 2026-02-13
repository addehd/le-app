import { supabase } from './supabaseClient';
import { goApiClient } from './goApiClient';
import { PropertyLink, PropertyLinkData, FinancialData } from '../store/propertyLinkStore';

/**
 * Properties API - All server operations for property management
 */

// ============ PROPERTIES ============

export interface AddPropertyInput {
  url: string;
  sharedBy: string;
  latitude?: number;
  longitude?: number;
}

export interface PropertyResponse {
  id: string;
  url: string;
  title?: string;
  description?: string;
  image?: string;
  images?: string[];
  shared_by: string;
  shared_at: string;
  latitude?: number;
  longitude?: number;
  property_data?: PropertyLinkData;
  financial_data?: FinancialData;
}

/**
 * Fetch all properties from Supabase
 */
export async function fetchProperties(): Promise<PropertyLink[]> {
  const { data, error } = await supabase
    .from('property_links')
    .select('*')
    .order('shared_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch properties:', error);
    throw error;
  }

  // Convert from snake_case (database) to camelCase (app)
  return (data || []).map((item: PropertyResponse) => ({
    id: item.id,
    url: item.url,
    title: item.title,
    description: item.description,
    image: item.image,
    images: item.images,
    sharedBy: item.shared_by,
    sharedAt: item.shared_at,
    latitude: item.latitude,
    longitude: item.longitude,
    propertyData: item.property_data,
    financialData: item.financial_data,
  }));
}

/**
 * Fetch property metadata from external API (OG tags)
 */
export async function fetchPropertyMetadata(url: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
  images?: string[];
  propertyData?: PropertyLinkData;
}> {
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

    // Extract OG metadata (fast, synchronous)
    console.log('📥 Extracting OG metadata for', url);
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
      price: ogResponse.price,
      currency: ogResponse.currency || 'SEK',
      address: ogResponse.address,
      city: ogResponse.city,
      area: ogResponse.area,
      bedrooms: ogResponse.bedrooms,
      enrichmentStatus: 'og_only',
      lastEnriched: new Date().toISOString(),
    };

    // Extract all images
    const images: string[] = [];
    if (ogResponse.image) {
      images.push(ogResponse.image);
    }
    if (ogResponse.og?.image) {
      images.push(...ogResponse.og.image.filter(img => img && !images.includes(img)));
    }

    return {
      title: ogResponse.title || urlObj.hostname.replace('www.', ''),
      description: ogResponse.description || '',
      image: ogResponse.image || '',
      images: images.length > 0 ? images : undefined,
      propertyData: Object.keys(propertyData).length > 0 ? propertyData : undefined
    };
  } catch (error) {
    console.error('Error fetching property metadata:', error);
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
}

/**
 * Add a new property
 */
export async function addProperty(input: AddPropertyInput): Promise<PropertyLink> {
  // Fetch metadata first
  const metadata = await fetchPropertyMetadata(input.url);

  const newProperty: Omit<PropertyLink, 'id'> & { id?: string } = {
    id: Date.now().toString(),
    url: input.url,
    title: metadata.title,
    description: metadata.description,
    image: metadata.image,
    images: metadata.images,
    sharedBy: input.sharedBy,
    sharedAt: new Date().toISOString(),
    latitude: input.latitude,
    longitude: input.longitude,
    propertyData: metadata.propertyData,
  };

  // Save to Supabase
  const { data, error } = await supabase
    .from('property_links')
    .insert({
      id: newProperty.id,
      url: newProperty.url,
      title: newProperty.title,
      description: newProperty.description,
      image: newProperty.image,
      images: newProperty.images,
      shared_by: newProperty.sharedBy,
      shared_at: newProperty.sharedAt,
      latitude: newProperty.latitude,
      longitude: newProperty.longitude,
      property_data: newProperty.propertyData,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to add property:', error);
    throw error;
  }

  // Return camelCase version
  return {
    id: data.id,
    url: data.url,
    title: data.title,
    description: data.description,
    image: data.image,
    images: data.images,
    sharedBy: data.shared_by,
    sharedAt: data.shared_at,
    latitude: data.latitude,
    longitude: data.longitude,
    propertyData: data.property_data,
    financialData: data.financial_data,
  };
}

/**
 * Update a property
 */
export async function updateProperty(
  id: string,
  updates: Partial<PropertyLink>
): Promise<PropertyLink> {
  const { data, error } = await supabase
    .from('property_links')
    .update({
      title: updates.title,
      description: updates.description,
      image: updates.image,
      images: updates.images,
      latitude: updates.latitude,
      longitude: updates.longitude,
      property_data: updates.propertyData,
      financial_data: updates.financialData,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Failed to update property:', error);
    throw error;
  }

  return {
    id: data.id,
    url: data.url,
    title: data.title,
    description: data.description,
    image: data.image,
    images: data.images,
    sharedBy: data.shared_by,
    sharedAt: data.shared_at,
    latitude: data.latitude,
    longitude: data.longitude,
    propertyData: data.property_data,
    financialData: data.financial_data,
  };
}

/**
 * Delete a property
 */
export async function deleteProperty(id: string): Promise<void> {
  const { error } = await supabase
    .from('property_links')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Failed to delete property:', error);
    throw error;
  }
}

/**
 * Update financial data for a property
 */
export async function updateFinancialData(
  id: string,
  financialData: FinancialData
): Promise<void> {
  const { error } = await supabase
    .from('property_links')
    .update({ financial_data: financialData })
    .eq('id', id);

  if (error) {
    console.error('Failed to update financial data:', error);
    throw error;
  }
}
