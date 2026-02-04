import { create } from 'zustand';
import { supabase } from '../api/supabaseClient';
import { goApiClient, PROPERTY_KEYWORDS } from '../api/goApiClient';
import {
  calculateMortgagePayment,
  calculateTotalCost,
  calculateAffordability,
  type SwedishMortgageParams,
  type SwedishTotalCostParams,
  type SwedishAffordabilityParams
} from '../financial/calculations';
import { PropertyReaction, PropertyComment } from '../types/property';

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

interface PropertyLinkState {
  propertyLinks: PropertyLink[];
  isLoading: boolean;
  error: string | null;
  reactions: Record<string, PropertyReaction[]>;
  comments: Record<string, PropertyComment[]>;
  addPropertyLink: (url: string, sharedBy: string, latitude?: number, longitude?: number) => Promise<PropertyLink>;
  savePropertyLink: (link: Omit<PropertyLink, 'id' | 'sharedAt'> & { id?: string; sharedAt?: string }) => Promise<PropertyLink>;
  removePropertyLink: (linkId: string) => Promise<void>;
  fetchPropertyData: (url: string) => Promise<{ title?: string; description?: string; image?: string; images?: string[]; propertyData?: PropertyLinkData }>;
  loadFromDatabase: () => Promise<void>;
  subscribeToEnrichmentUpdates: () => () => void;
  updatePropertyFromRealtime: (updatedProperty: any) => void;
  updateFinancialData: (
    linkId: string,
    financialData: FinancialData
  ) => Promise<void>;
  calculateAndSaveFinancials: (
    linkId: string,
    inputs: {
      mortgage?: SwedishMortgageParams;
      totalCost?: SwedishTotalCostParams;
      affordability?: SwedishAffordabilityParams;
    }
  ) => Promise<FinancialData>;
  getFinancialResults: (linkId: string) => FinancialData['results'] | null;
  
  // Reactions methods
  addReaction: (propertyId: string, emoji: string, userId: string) => Promise<void>;
  removeReaction: (reactionId: string, propertyId: string) => Promise<void>;
  loadReactions: (propertyId: string) => Promise<void>;
  subscribeToReactions: (propertyId: string) => () => void;
  
  // Comments methods
  addComment: (propertyId: string, content: string, userId: string, userName: string, parentId?: string) => Promise<void>;
  updateComment: (commentId: string, content: string, propertyId: string) => Promise<void>;
  deleteComment: (commentId: string, propertyId: string) => Promise<void>;
  loadComments: (propertyId: string) => Promise<void>;
  subscribeToComments: (propertyId: string) => () => void;
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
  reactions: {},
  comments: {},

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
    // Optimistic update - Update UI immediately (localStorage)
    const updatedLinks = get().propertyLinks.filter((link) => link.id !== linkId);
    set({ propertyLinks: updatedLinks });
    savePropertyLinks(updatedLinks);

    // Sync to database (Supabase)
    try {
      const { error } = await supabase
        .from('property_links')
        .delete()
        .eq('id', linkId);

      if (error) {
        console.error('❌ Failed to delete from database:', {
          linkId,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        // Note: Local deletion already succeeded, which is the primary source of truth
        // The property will be gone from the UI but may reappear if RLS policy blocks deletion
      } else {
        console.log('✅ Property deleted from database:', linkId);
      }
    } catch (error) {
      console.error('❌ Exception during database deletion:', error);
      // Don't revert - local deletion is more important per hybrid storage strategy
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

  updateFinancialData: async (linkId, financialData) => {
    const { propertyLinks } = get();
    const link = propertyLinks.find(l => l.id === linkId);
    if (!link) throw new Error('Property link not found');

    // Update in Supabase
    const { error } = await supabase
      .from('property_links')
      .update({ financial_data: financialData })
      .eq('id', linkId);

    if (error) throw error;

    // Update local state
    set({
      propertyLinks: propertyLinks.map(l =>
        l.id === linkId ? { ...l, financialData } : l
      )
    });

    // Persist to localStorage
    savePropertyLinks(get().propertyLinks);
  },

  calculateAndSaveFinancials: async (linkId, inputs) => {
    let results: any = {};

    // Calculate Swedish mortgage if inputs provided
    if (inputs.mortgage) {
      const mortgageResult = calculateMortgagePayment(inputs.mortgage);
      results.monthlyPayment = mortgageResult.monthlyPayment;
      results.monthlyInterest = mortgageResult.monthlyInterest;
      results.monthlyAmortization = mortgageResult.monthlyAmortization;
      results.amortizationPercent = mortgageResult.amortizationPercent;
      results.ltv = mortgageResult.ltv;
    }

    // Calculate Swedish total cost if inputs provided
    if (inputs.totalCost) {
      const totalCostResult = calculateTotalCost(inputs.totalCost);
      results.totalMonthly = totalCostResult.totalMonthly;
      results.monthlyPayment = totalCostResult.monthlyMortgage;
      results.monthlyInterest = totalCostResult.monthlyInterest;
      results.monthlyAmortization = totalCostResult.monthlyAmortization;
    }

    // Calculate Swedish affordability (kalkylränta) if inputs provided
    if (inputs.affordability) {
      const affordabilityResult = calculateAffordability(inputs.affordability);
      results.housingCostRatio = affordabilityResult.housingCostRatio;
      results.totalDebtRatio = affordabilityResult.totalDebtRatio;
      results.canAffordConservative = affordabilityResult.canAffordConservative;
      results.canAffordStandard = affordabilityResult.canAffordStandard;
    }

    // Build FinancialData object
    const financialData: FinancialData = {
      mortgage: inputs.mortgage,
      totalCost: inputs.totalCost,
      affordability: inputs.affordability,
      results: {
        ...results,
        calculatedAt: new Date().toISOString()
      }
    };

    // Save via updateFinancialData
    await get().updateFinancialData(linkId, financialData);

    return financialData;
  },

  getFinancialResults: (linkId) => {
    const { propertyLinks } = get();
    const link = propertyLinks.find(l => l.id === linkId);
    return link?.financialData?.results || null;
  },

  // ============ REACTIONS ============
  
  addReaction: async (propertyId, emoji, userId) => {
    try {
      console.log('🔄 addReaction called:', { propertyId, emoji, userId });
      
      // Check if user already reacted with this emoji
      const existingReactions = get().reactions[propertyId] || [];
      const existing = existingReactions.find(r => r.userId === userId && r.emoji === emoji);
      
      if (existing) {
        // Toggle off - remove reaction
        console.log('🔄 Toggling off existing reaction:', existing.id);
        await get().removeReaction(existing.id, propertyId);
        return;
      }

      console.log('➕ Inserting new reaction to Supabase...');
      
      // Add new reaction
      const { data, error } = await supabase
        .from('property_reactions')
        .insert({
          property_id: propertyId,
          user_id: userId,
          emoji: emoji,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      console.log('✅ Reaction saved to Supabase:', data);

      // Convert to camelCase and add to state
      const newReaction: PropertyReaction = {
        id: data.id,
        propertyId: data.property_id,
        userId: data.user_id,
        emoji: data.emoji,
        createdAt: data.created_at,
      };

      set({
        reactions: {
          ...get().reactions,
          [propertyId]: [...existingReactions, newReaction],
        },
      });
      
      console.log('✅ Reaction added to local state, total reactions:', existingReactions.length + 1);
    } catch (error: any) {
      console.error('❌ Error adding reaction:', {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      });
      throw error;
    }
  },

  removeReaction: async (reactionId, propertyId) => {
    try {
      const { error } = await supabase
        .from('property_reactions')
        .delete()
        .eq('id', reactionId);

      if (error) throw error;

      // Remove from state
      const currentReactions = get().reactions[propertyId] || [];
      set({
        reactions: {
          ...get().reactions,
          [propertyId]: currentReactions.filter(r => r.id !== reactionId),
        },
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  },

  loadReactions: async (propertyId) => {
    try {
      const { data, error } = await supabase
        .from('property_reactions')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Convert to camelCase
      const reactions: PropertyReaction[] = (data || []).map(item => ({
        id: item.id,
        propertyId: item.property_id,
        userId: item.user_id,
        emoji: item.emoji,
        createdAt: item.created_at,
      }));

      set({
        reactions: {
          ...get().reactions,
          [propertyId]: reactions,
        },
      });
    } catch (error) {
      console.error('Error loading reactions:', error);
    }
  },

  subscribeToReactions: (propertyId) => {
    console.log('🔔 Subscribing to reactions for property:', propertyId);
    
    const channel = supabase
      .channel(`reactions:${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'property_reactions',
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          console.log('📨 Reaction update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newReaction: PropertyReaction = {
              id: payload.new.id,
              propertyId: payload.new.property_id,
              userId: payload.new.user_id,
              emoji: payload.new.emoji,
              createdAt: payload.new.created_at,
            };
            
            const current = get().reactions[propertyId] || [];
            set({
              reactions: {
                ...get().reactions,
                [propertyId]: [...current, newReaction],
              },
            });
          } else if (payload.eventType === 'DELETE') {
            const current = get().reactions[propertyId] || [];
            set({
              reactions: {
                ...get().reactions,
                [propertyId]: current.filter(r => r.id !== payload.old.id),
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from reactions for property:', propertyId);
      supabase.removeChannel(channel);
    };
  },

  // ============ COMMENTS ============
  
  addComment: async (propertyId, content, userId, userName, parentId) => {
    try {
      const { data, error } = await supabase
        .from('property_comments')
        .insert({
          property_id: propertyId,
          parent_id: parentId || null,
          user_id: userId,
          user_name: userName,
          content: content,
        })
        .select()
        .single();

      if (error) throw error;

      // Convert to camelCase and add to state
      const newComment: PropertyComment = {
        id: data.id,
        propertyId: data.property_id,
        parentId: data.parent_id,
        userId: data.user_id,
        userName: data.user_name,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      const currentComments = get().comments[propertyId] || [];
      set({
        comments: {
          ...get().comments,
          [propertyId]: [...currentComments, newComment],
        },
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  updateComment: async (commentId, content, propertyId) => {
    try {
      const { data, error } = await supabase
        .from('property_comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;

      // Update in state
      const currentComments = get().comments[propertyId] || [];
      set({
        comments: {
          ...get().comments,
          [propertyId]: currentComments.map(c =>
            c.id === commentId
              ? {
                  ...c,
                  content: data.content,
                  updatedAt: data.updated_at,
                }
              : c
          ),
        },
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  deleteComment: async (commentId, propertyId) => {
    try {
      const { error } = await supabase
        .from('property_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Remove from state (cascade will handle replies)
      const currentComments = get().comments[propertyId] || [];
      set({
        comments: {
          ...get().comments,
          [propertyId]: currentComments.filter(c => c.id !== commentId),
        },
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  loadComments: async (propertyId) => {
    try {
      const { data, error } = await supabase
        .from('property_comments')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Convert to camelCase
      const comments: PropertyComment[] = (data || []).map(item => ({
        id: item.id,
        propertyId: item.property_id,
        parentId: item.parent_id,
        userId: item.user_id,
        userName: item.user_name,
        content: item.content,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      set({
        comments: {
          ...get().comments,
          [propertyId]: comments,
        },
      });
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  },

  subscribeToComments: (propertyId) => {
    console.log('🔔 Subscribing to comments for property:', propertyId);
    
    const channel = supabase
      .channel(`comments:${propertyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'property_comments',
          filter: `property_id=eq.${propertyId}`,
        },
        (payload) => {
          console.log('📨 Comment update:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newComment: PropertyComment = {
              id: payload.new.id,
              propertyId: payload.new.property_id,
              parentId: payload.new.parent_id,
              userId: payload.new.user_id,
              userName: payload.new.user_name,
              content: payload.new.content,
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
            };
            
            const current = get().comments[propertyId] || [];
            set({
              comments: {
                ...get().comments,
                [propertyId]: [...current, newComment],
              },
            });
          } else if (payload.eventType === 'UPDATE') {
            const current = get().comments[propertyId] || [];
            set({
              comments: {
                ...get().comments,
                [propertyId]: current.map(c =>
                  c.id === payload.new.id
                    ? {
                        ...c,
                        content: payload.new.content,
                        updatedAt: payload.new.updated_at,
                      }
                    : c
                ),
              },
            });
          } else if (payload.eventType === 'DELETE') {
            const current = get().comments[propertyId] || [];
            set({
              comments: {
                ...get().comments,
                [propertyId]: current.filter(c => c.id !== payload.old.id),
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔕 Unsubscribing from comments for property:', propertyId);
      supabase.removeChannel(channel);
    };
  },
}));
