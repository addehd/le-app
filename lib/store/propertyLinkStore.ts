/**
 * @deprecated This store has been migrated to React Query hooks.
 * 
 * Migration guide:
 * - For properties: Use `useProperties()` from '../query/useProperties'
 * - For reactions: Use `useReactions(propertyId)` from '../query/useReactions'
 * - For comments: Use `useComments(propertyId)` from '../query/useComments'
 * - For realtime: Use `useRealtimeSubscriptions()` from '../query/useRealtimeSubscriptions'
 * 
 * Example migration:
 * 
 * Before:
 * ```ts
 * const { propertyLinks, addPropertyLink, reactions, comments } = usePropertyLinkStore();
 * ```
 * 
 * After:
 * ```ts
 * const { properties, addProperty } = useProperties();
 * const { reactions, addReaction } = useReactions(propertyId);
 * const { comments, addComment } = useComments(propertyId);
 * ```
 */

import type { PropertyReaction, PropertyComment } from '../types/property';

// ============ TYPE EXPORTS (still valid) ============

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

export interface FinancialData {
  // Swedish mortgage inputs
  mortgage?: {
    purchasePrice: number;
    downPaymentPercent: number;   // Must be >= 15% (85% LTV cap)
    annualInterestRate: number;
    loanTermYears: number;
    propertyType: 'villa' | 'brf';
  };

  // Swedish total cost inputs
  totalCost?: {
    purchasePrice: number;
    downPaymentPercent: number;
    annualInterestRate: number;
    loanTermYears: number;
    propertyType: 'villa' | 'brf';
    propertyTaxAnnual?: number;
    insuranceAnnual?: number;
    brfMonthly?: number;          // BRF-avgift (replaces hoaMonthly)
    maintenanceRate?: number;     // Default 0.01 for villa, 0 for brf
  };

  // Swedish affordability inputs (kalkylränta)
  affordability?: {
    grossMonthlyIncome: number;
    monthlyHousingCost: number;
    monthlyOtherDebts: number;
    stressTestRate: number;       // Kalkylränta (typically 5-7%)
    totalDebt?: number;            // For amorteringskrav 3rd rule
    grossAnnualIncome?: number;    // For amorteringskrav 3rd rule
  };

  // Calculated results (cached)
  results?: {
    monthlyPayment?: number;
    monthlyInterest?: number;
    monthlyAmortization?: number;
    amortizationPercent?: number;
    totalMonthly?: number;
    housingCostRatio?: number;     // Housing cost / income (%)
    totalDebtRatio?: number;       // Total debt / income (%)
    canAffordConservative?: boolean; // ≤ 50% threshold
    canAffordStandard?: boolean;   // ≤ 60% threshold
    ltv?: number;                  // Loan-to-value ratio
    calculatedAt: string;          // ISO timestamp
  };
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
  financialData?: FinancialData;
}

// ============ DEPRECATED HOOK (for backward compatibility) ============

/**
 * @deprecated Use React Query hooks instead:
 * - useProperties() for property CRUD
 * - useReactions(propertyId) for reactions
 * - useComments(propertyId) for comments
 */
export const usePropertyLinkStore = () => {
  throw new Error(
    'usePropertyLinkStore is deprecated. Please use React Query hooks:\n' +
    '- useProperties() from "../query/useProperties"\n' +
    '- useReactions(propertyId) from "../query/useReactions"\n' +
    '- useComments(propertyId) from "../query/useComments"'
  );
};
