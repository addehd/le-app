/**
 * @deprecated This store has been migrated to React Query hook.
 * 
 * Migration guide:
 * Use `useComparison()` from '../query/useComparison' instead
 * 
 * Before:
 * ```ts
 * const { selectedPropertyIds, selectProperty, generateComparison } = useComparisonStore();
 * ```
 * 
 * After:
 * ```ts
 * const { selectedIds, selectProperty, comparisonData, generateComparison } = useComparison();
 * ```
 */

import { PropertyLink } from './propertyLinkStore';
import { PropertyComparison } from '../types/property';

// Re-export the React Query hook
export { useComparison as useComparisonStore } from '../query/useComparison';
