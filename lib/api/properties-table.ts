import { supabase } from './supabaseClient';

/**
 * Properties Table API
 * Fetches data from the 'properties' table (separate from 'property_links')
 */

export interface Property {
  id: number;
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  address?: string;
  municipality?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  pricePerSqm?: number;
  propertyType?: string;
  tenureType?: string;
  rooms?: number;
  areaSqm?: number;
  floor?: number;
  totalFloors?: number;
  hasElevator?: boolean;
  hasBalcony?: boolean;
  yearBuilt?: number;
  energyClass?: string;
  associationName?: string;
  monthlyFee?: number;
  visits?: number;
  agentName?: string;
  listingDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Fetch all properties from the properties table with valid coordinates
 */
export async function fetchPropertiesFromTable(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch properties from table:', error);
    throw error;
  }

  // Convert from snake_case (database) to camelCase (app)
  return (data || []).map((item) => ({
    id: item.id,
    url: item.url,
    title: item.title,
    description: item.description,
    imageUrl: item.image_url,
    siteName: item.site_name,
    address: item.address,
    municipality: item.municipality,
    latitude: item.latitude ? parseFloat(item.latitude) : undefined,
    longitude: item.longitude ? parseFloat(item.longitude) : undefined,
    price: item.price,
    pricePerSqm: item.price_per_sqm,
    propertyType: item.property_type,
    tenureType: item.tenure_type,
    rooms: item.rooms,
    areaSqm: item.area_sqm,
    floor: item.floor,
    totalFloors: item.total_floors,
    hasElevator: item.has_elevator,
    hasBalcony: item.has_balcony,
    yearBuilt: item.year_built,
    energyClass: item.energy_class,
    associationName: item.association_name,
    monthlyFee: item.monthly_fee,
    visits: item.visits,
    agentName: item.agent_name,
    listingDate: item.listing_date,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  }));
}
