import { PropertyLinkData, PropertyLink } from '../store/propertyLinkStore';

// Extended property data with comparison-specific fields
export interface ExtendedPropertyData extends PropertyLinkData {
  // Existing fields from PropertyLinkData:
  // price, currency, bedrooms, bathrooms, area, areaUnit, propertyType,
  // address, city, energyClass, builtYear, floor, monthlyFee

  // New fields for comparison feature:
  floorPlans?: FloorPlan[];
  sunOrientation?: SunOrientation;
  shortDescription?: string;
  imageGallery?: PropertyImage[];
  pricePerSqm?: number; // Calculated field
  lastUpdated?: string;
}

export interface FloorPlan {
  id: string;
  url: string;
  title?: string;
  type?: 'floor_plan' | 'layout' | '3d_view';
  floor?: string; // e.g., "1st Floor", "Ground Floor"
}

export interface SunOrientation {
  direction: 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest';
  balconyDirection?: string[];
  windowDirections?: string[];
  sunHours?: number; // Estimated daily sun exposure
}

export interface PropertyImage {
  id: string;
  url: string;
  title?: string;
  isPrimary?: boolean;
  order?: number;
}

// Comparison-specific types
export interface ComparisonSession {
  id: string;
  name?: string;
  propertyIds: string[]; // Array of property link IDs
  createdAt: string;
  updatedAt: string;
  userAnnotations?: UserAnnotations;
  sharedBy: string;
}

export interface UserAnnotations {
  selectedImages?: { [propertyId: string]: string }; // propertyId -> imageId
  notes?: { [propertyId: string]: string };
  favorites?: string[]; // propertyIds marked as favorites
}

export interface PropertyComparison {
  property: PropertyLink;
  metrics: ComparisonMetrics;
  prosCons: ProsCons;
}

export interface ComparisonMetrics {
  pricePerSqm: number | null;
  priceRank: number; // 1 = cheapest, 2 = second cheapest, etc.
  areaRank: number;
  bedroomRank: number;
  pricePerSqmRank: number;
  energyEfficiencyScore?: number; // Calculated from energyClass
}

export interface ProsCons {
  pros: string[];
  cons: string[];
}

// Reactions and Comments types
export interface PropertyReaction {
  id: string;
  propertyId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface PropertyComment {
  id: string;
  propertyId: string;
  parentId?: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  replies?: PropertyComment[];
}
