import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchComparisonSessions,
  fetchComparisonSession,
  saveComparisonSession,
  deleteComparisonSession,
} from '../api/comparisonSessions';
import { useProperties } from './useProperties';
import { PropertyLink } from '../store/propertyLinkStore';
import { ComparisonMetrics, ProsCons, PropertyComparison } from '../types/property';

/**
 * React Query hook for property comparison
 * Uses local state for UI state (selected IDs) and React Query for server state (saved sessions)
 */
export function useComparison() {
  const queryClient = useQueryClient();
  const { properties } = useProperties();
  
  // Local UI state - selected property IDs
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load saved sessions from React Query
  const savedSessionsQuery = useQuery({
    queryKey: ['comparison-sessions'],
    queryFn: fetchComparisonSessions,
  });

  // Calculate comparison data based on selected properties
  const comparisonData = useMemo<PropertyComparison[]>(() => {
    const selectedProperties = properties.filter((p) => selectedPropertyIds.includes(p.id));
    
    return selectedProperties.map((property) => ({
      property,
      metrics: calculateMetrics(property, selectedProperties),
      prosCons: generateProsCons(property, selectedProperties),
    }));
  }, [selectedPropertyIds, properties]);

  // Actions for managing selected properties
  const addPropertyToComparison = (propertyId: string) => {
    if (selectedPropertyIds.length >= 4) {
      setError('Maximum 4 properties can be compared');
      return;
    }

    if (!selectedPropertyIds.includes(propertyId)) {
      setSelectedPropertyIds([...selectedPropertyIds, propertyId]);
      setError(null);
    }
  };

  const removePropertyFromComparison = (propertyId: string) => {
    setSelectedPropertyIds(selectedPropertyIds.filter((id) => id !== propertyId));
    setError(null);
  };

  const clearComparison = () => {
    setSelectedPropertyIds([]);
    setError(null);
  };

  const setSelectedProperties = (propertyIds: string[]) => {
    if (propertyIds.length > 4) {
      setError('Maximum 4 properties can be compared');
      return;
    }
    setSelectedPropertyIds(propertyIds);
    setError(null);
  };

  // Save session mutation
  const saveSessionMutation = useMutation({
    mutationFn: (name?: string) => {
      const userEmail = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
        ? window.localStorage.getItem('user-email') || 'anon'
        : 'anon';

      return saveComparisonSession({
        name,
        propertyIds: selectedPropertyIds,
        sharedBy: userEmail,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison-sessions'] });
    },
  });

  // Load session mutation
  const loadSessionMutation = useMutation({
    mutationFn: fetchComparisonSession,
    onSuccess: (session) => {
      setSelectedPropertyIds(session.propertyIds);
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: deleteComparisonSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparison-sessions'] });
    },
  });

  return {
    // UI state
    selectedPropertyIds,
    comparisonData,
    error,

    // Actions
    addPropertyToComparison,
    removePropertyFromComparison,
    clearComparison,
    setSelectedProperties,

    // Session management
    savedSessions: savedSessionsQuery.data || [],
    saveSession: saveSessionMutation.mutate,
    loadSession: loadSessionMutation.mutate,
    deleteSession: deleteSessionMutation.mutate,
    isSavingSession: saveSessionMutation.isPending,
    isLoadingSession: loadSessionMutation.isPending,
  };
}

/**
 * Calculate metrics for a property compared to others
 */
function calculateMetrics(property: PropertyLink, allProperties: PropertyLink[]): ComparisonMetrics {
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

  // Energy efficiency score
  const energyClassMap: { [key: string]: number } = {
    A: 5, B: 4, C: 3, D: 2, E: 1, F: 0, G: 0,
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
}

/**
 * Generate pros and cons for a property compared to others
 */
function generateProsCons(property: PropertyLink, allProperties: PropertyLink[]): ProsCons {
  const pros: string[] = [];
  const cons: string[] = [];
  const data = property.propertyData;

  if (!data) {
    return { pros, cons };
  }

  const metrics = calculateMetrics(property, allProperties);

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
  if (data.buildYear) {
    const age = new Date().getFullYear() - data.buildYear;
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

  // Location-based
  if (data.city) {
    pros.push(`Located in ${data.city}`);
  }

  return { pros, cons };
}
