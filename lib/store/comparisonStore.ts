import { create } from 'zustand';
import { supabase } from '../api/supabaseClient';
import { PropertyLink } from './propertyLinkStore';
import {
  ComparisonSession,
  PropertyComparison,
  ComparisonMetrics,
  ProsCons,
  UserAnnotations,
} from '../types/property';

interface ComparisonState {
  // Current comparison
  selectedPropertyIds: string[];
  currentSession: ComparisonSession | null;
  comparisonData: PropertyComparison[];

  // Saved sessions
  savedSessions: ComparisonSession[];

  // UI state
  isLoading: boolean;
  error: string | null;

  // Actions
  addPropertyToComparison: (propertyId: string) => void;
  removePropertyFromComparison: (propertyId: string) => void;
  clearComparison: () => void;
  setSelectedProperties: (propertyIds: string[]) => void;

  // Comparison calculations
  generateComparison: (properties: PropertyLink[]) => void;
  calculateMetrics: (property: PropertyLink, allProperties: PropertyLink[]) => ComparisonMetrics;
  generateProsCons: (property: PropertyLink, allProperties: PropertyLink[]) => ProsCons;

  // Session management
  saveSession: (name?: string) => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  updateSessionAnnotations: (annotations: Partial<UserAnnotations>) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  loadSavedSessions: () => Promise<void>;

  // Auto-save
  enableAutoSave: () => void;
  disableAutoSave: () => void;
}

// LocalStorage helpers - check both window AND localStorage (React Native has window but no localStorage)
const STORAGE_KEY = 'comparison-state';
const saveToLocalStorage = (state: Partial<ComparisonState>) => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};

const loadFromLocalStorage = (): Partial<ComparisonState> | null => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  }
  return null;
};

export const useComparisonStore = create<ComparisonState>((set, get) => {
  const savedState = loadFromLocalStorage();
  let autoSaveInterval: NodeJS.Timeout | null = null;

  return {
    // Initialize from localStorage
    selectedPropertyIds: savedState?.selectedPropertyIds || [],
    currentSession: savedState?.currentSession || null,
    comparisonData: [],
    savedSessions: [],
    isLoading: false,
    error: null,

    addPropertyToComparison: (propertyId: string) => {
      const { selectedPropertyIds } = get();

      // Limit to 4 properties
      if (selectedPropertyIds.length >= 4) {
        set({ error: 'Maximum 4 properties can be compared' });
        return;
      }

      if (!selectedPropertyIds.includes(propertyId)) {
        const updated = [...selectedPropertyIds, propertyId];
        set({ selectedPropertyIds: updated, error: null });
        saveToLocalStorage({ selectedPropertyIds: updated });
      }
    },

    removePropertyFromComparison: (propertyId: string) => {
      const { selectedPropertyIds } = get();
      const updated = selectedPropertyIds.filter((id) => id !== propertyId);
      set({ selectedPropertyIds: updated });
      saveToLocalStorage({ selectedPropertyIds: updated });
    },

    clearComparison: () => {
      set({
        selectedPropertyIds: [],
        currentSession: null,
        comparisonData: [],
      });
      saveToLocalStorage({ selectedPropertyIds: [], currentSession: null });
    },

    setSelectedProperties: (propertyIds: string[]) => {
      if (propertyIds.length > 4) {
        set({ error: 'Maximum 4 properties can be compared' });
        return;
      }
      set({ selectedPropertyIds: propertyIds, error: null });
      saveToLocalStorage({ selectedPropertyIds: propertyIds });
    },

    generateComparison: (properties: PropertyLink[]) => {
      const comparisonData = properties.map((property) => ({
        property,
        metrics: get().calculateMetrics(property, properties),
        prosCons: get().generateProsCons(property, properties),
      }));

      set({ comparisonData });
    },

    calculateMetrics: (property: PropertyLink, allProperties: PropertyLink[]) => {
      const pricePerSqm =
        property.propertyData?.price && property.propertyData?.area
          ? property.propertyData.price / property.propertyData.area
          : null;

      // Calculate ranks
      const propertiesWithPrice = allProperties.filter((p) => p.propertyData?.price);
      const sortedByPrice = [...propertiesWithPrice].sort(
        (a, b) => (a.propertyData?.price || 0) - (b.propertyData?.price || 0)
      );
      const priceRank = sortedByPrice.findIndex((p) => p.id === property.id) + 1;

      const propertiesWithArea = allProperties.filter((p) => p.propertyData?.area);
      const sortedByArea = [...propertiesWithArea].sort(
        (a, b) => (b.propertyData?.area || 0) - (a.propertyData?.area || 0)
      );
      const areaRank = sortedByArea.findIndex((p) => p.id === property.id) + 1;

      const propertiesWithBedrooms = allProperties.filter((p) => p.propertyData?.bedrooms);
      const sortedByBedrooms = [...propertiesWithBedrooms].sort(
        (a, b) => (b.propertyData?.bedrooms || 0) - (a.propertyData?.bedrooms || 0)
      );
      const bedroomRank = sortedByBedrooms.findIndex((p) => p.id === property.id) + 1;

      const propertiesWithPricePerSqm = allProperties.filter((p) => {
        const price = p.propertyData?.price;
        const area = p.propertyData?.area;
        return price && area;
      });
      const sortedByPricePerSqm = [...propertiesWithPricePerSqm].sort((a, b) => {
        const aPricePerSqm = (a.propertyData?.price || 0) / (a.propertyData?.area || 1);
        const bPricePerSqm = (b.propertyData?.price || 0) / (b.propertyData?.area || 1);
        return aPricePerSqm - bPricePerSqm;
      });
      const pricePerSqmRank = sortedByPricePerSqm.findIndex((p) => p.id === property.id) + 1;

      // Energy efficiency score (A=5, B=4, C=3, D=2, E=1, F=0, G=0)
      const energyClassMap: { [key: string]: number } = {
        A: 5,
        B: 4,
        C: 3,
        D: 2,
        E: 1,
        F: 0,
        G: 0,
      };
      const energyEfficiencyScore = property.propertyData?.energyClass
        ? energyClassMap[property.propertyData.energyClass.toUpperCase()] || 0
        : undefined;

      return {
        pricePerSqm,
        priceRank,
        areaRank,
        bedroomRank,
        pricePerSqmRank,
        energyEfficiencyScore,
      };
    },

    generateProsCons: (property: PropertyLink, allProperties: PropertyLink[]): ProsCons => {
      const pros: string[] = [];
      const cons: string[] = [];
      const data = property.propertyData;

      if (!data) {
        return { pros, cons };
      }

      const metrics = get().calculateMetrics(property, allProperties);

      // Price analysis
      if (metrics.priceRank === 1) {
        pros.push('Lowest price among compared properties');
      } else if (metrics.priceRank === allProperties.length) {
        cons.push('Highest price among compared properties');
      }

      // Price per sqm analysis
      if (metrics.pricePerSqm && metrics.pricePerSqmRank === 1) {
        pros.push('Best value per square meter');
      } else if (metrics.pricePerSqm && metrics.pricePerSqmRank === allProperties.length) {
        cons.push('Highest price per square meter');
      }

      // Area analysis
      if (metrics.areaRank === 1) {
        pros.push('Largest living space');
      } else if (metrics.areaRank === allProperties.length) {
        cons.push('Smallest living space');
      }

      // Bedroom analysis
      if (metrics.bedroomRank === 1) {
        pros.push('Most bedrooms');
      }

      // Energy efficiency
      if (metrics.energyEfficiencyScore !== undefined) {
        if (metrics.energyEfficiencyScore >= 4) {
          pros.push(`Excellent energy rating (${data.energyClass})`);
        } else if (metrics.energyEfficiencyScore <= 1) {
          cons.push(`Poor energy rating (${data.energyClass})`);
        }
      }

      // Age of building
      if (data.builtYear) {
        const age = new Date().getFullYear() - data.builtYear;
        if (age < 5) {
          pros.push('Newly built property');
        } else if (age > 50) {
          cons.push('Older building (may need renovation)');
        }
      }

      // Monthly fee
      if (data.monthlyFee) {
        const avgMonthlyFee =
          allProperties
            .map((p) => p.propertyData?.monthlyFee || 0)
            .filter((fee) => fee > 0)
            .reduce((sum, fee) => sum + fee, 0) / allProperties.length;

        if (data.monthlyFee < avgMonthlyFee * 0.8) {
          pros.push('Below average monthly fee');
        } else if (data.monthlyFee > avgMonthlyFee * 1.2) {
          cons.push('Above average monthly fee');
        }
      }

      // Location-based (if city data available)
      if (data.city) {
        pros.push(`Located in ${data.city}`);
      }

      return { pros, cons };
    },

    saveSession: async (name?: string) => {
      const { selectedPropertyIds, currentSession } = get();
      const user =
        typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' ? window.localStorage.getItem('user-email') || 'anon' : 'anon';

      const sessionData: ComparisonSession = {
        id: currentSession?.id || Date.now().toString(),
        name: name || currentSession?.name,
        propertyIds: selectedPropertyIds,
        sharedBy: user,
        userAnnotations: currentSession?.userAnnotations || {},
        createdAt: currentSession?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Always save to localStorage first (works offline)
      set({ currentSession: sessionData });
      saveToLocalStorage({ currentSession: sessionData });

      try {
        // Try to save to Supabase (may fail if table doesn't exist)
        const { error } = await supabase.from('comparison_sessions').upsert({
          id: sessionData.id,
          name: sessionData.name,
          property_ids: sessionData.propertyIds,
          shared_by: sessionData.sharedBy,
          user_annotations: sessionData.userAnnotations,
          created_at: sessionData.createdAt,
          updated_at: sessionData.updatedAt,
        });

        if (error) {
          // Log but don't throw - localStorage fallback is working
          console.warn('Supabase save failed (table may not exist):', error.message || error);
        }
      } catch (error: any) {
        // Silently fail - localStorage is the primary storage
        console.warn('Supabase save failed:', error?.message || 'Unknown error');
      }
    },

    loadSession: async (sessionId: string) => {
      try {
        const { data, error } = await supabase
          .from('comparison_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error) throw error;

        const session: ComparisonSession = {
          id: data.id,
          name: data.name,
          propertyIds: data.property_ids,
          sharedBy: data.shared_by,
          userAnnotations: data.user_annotations,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        set({
          currentSession: session,
          selectedPropertyIds: session.propertyIds,
        });
        saveToLocalStorage({
          currentSession: session,
          selectedPropertyIds: session.propertyIds,
        });
      } catch (error: any) {
        console.error('Failed to load comparison session:', error);
        set({ error: error.message });
      }
    },

    updateSessionAnnotations: (annotations: Partial<UserAnnotations>) => {
      const { currentSession } = get();
      if (!currentSession) return;

      const updatedSession = {
        ...currentSession,
        userAnnotations: {
          ...currentSession.userAnnotations,
          ...annotations,
        },
        updatedAt: new Date().toISOString(),
      };

      set({ currentSession: updatedSession });
      saveToLocalStorage({ currentSession: updatedSession });

      // Save to database (async, non-blocking)
      get().saveSession();
    },

    deleteSession: async (sessionId: string) => {
      try {
        await supabase.from('comparison_sessions').delete().eq('id', sessionId);

        const { savedSessions } = get();
        set({
          savedSessions: savedSessions.filter((s) => s.id !== sessionId),
        });
      } catch (error: any) {
        console.error('Failed to delete session:', error);
        set({ error: error.message });
      }
    },

    loadSavedSessions: async () => {
      try {
        const { data, error } = await supabase
          .from('comparison_sessions')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const sessions: ComparisonSession[] = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          propertyIds: item.property_ids,
          sharedBy: item.shared_by,
          userAnnotations: item.user_annotations,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        set({ savedSessions: sessions });
      } catch (error: any) {
        console.error('Failed to load saved sessions:', error);
      }
    },

    enableAutoSave: () => {
      // Auto-save every 30 seconds
      autoSaveInterval = setInterval(() => {
        const { selectedPropertyIds } = get();
        if (selectedPropertyIds.length > 0) {
          get().saveSession();
        }
      }, 30000);
    },

    disableAutoSave: () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
      }
    },
  };
});
