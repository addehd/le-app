/**
 * PropertyEnrichmentBadge - Visual indicator for property data enrichment status
 * 
 * Shows the current state of LLM data enrichment:
 * - og_only: Basic OG metadata extracted (initial state)
 * - llm_processing: AI is analyzing the property
 * - llm_complete: Full enrichment completed
 * - llm_failed: Enrichment failed, using basic data
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import type { EnrichmentStatus } from '../lib/store/propertyLinkStore';

interface PropertyEnrichmentBadgeProps {
  status?: EnrichmentStatus;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export function PropertyEnrichmentBadge({ 
  status, 
  size = 'medium', 
  showLabel = true 
}: PropertyEnrichmentBadgeProps) {
  // Don't render anything if no status
  if (!status) return null;

  const config = getStatusConfig(status);
  const sizeStyle = getSizeStyle(size);

  return (
    <View style={[styles.container, config.containerStyle, sizeStyle.container]}>
      {config.icon === 'spinner' ? (
        <ActivityIndicator 
          size={size === 'small' ? 'small' : 'small'} 
          color={config.color} 
        />
      ) : (
        <View style={[styles.dot, { backgroundColor: config.color }, sizeStyle.dot]} />
      )}
      {showLabel && (
        <Text style={[styles.label, { color: config.color }, sizeStyle.label]}>
          {config.label}
        </Text>
      )}
    </View>
  );
}

// Status configuration mapping
function getStatusConfig(status: EnrichmentStatus) {
  switch (status) {
    case 'og_only':
      return {
        label: 'Basic Data',
        color: '#94A3B8', // slate-400
        icon: 'dot' as const,
        containerStyle: styles.ogOnly,
      };
    case 'llm_processing':
      return {
        label: 'Analyzing...',
        color: '#3B82F6', // blue-500
        icon: 'spinner' as const,
        containerStyle: styles.processing,
      };
    case 'llm_complete':
      return {
        label: 'Enriched',
        color: '#10B981', // green-500
        icon: 'dot' as const,
        containerStyle: styles.complete,
      };
    case 'llm_failed':
      return {
        label: 'Limited Data',
        color: '#EF4444', // red-500
        icon: 'dot' as const,
        containerStyle: styles.failed,
      };
  }
}

// Size variants
function getSizeStyle(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return {
        container: { paddingHorizontal: 6, paddingVertical: 2 },
        dot: { width: 6, height: 6 },
        label: { fontSize: 10 },
      };
    case 'medium':
      return {
        container: { paddingHorizontal: 8, paddingVertical: 4 },
        dot: { width: 8, height: 8 },
        label: { fontSize: 12 },
      };
    case 'large':
      return {
        container: { paddingHorizontal: 10, paddingVertical: 6 },
        dot: { width: 10, height: 10 },
        label: { fontSize: 14 },
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: 999,
  },
  label: {
    fontWeight: '600',
  },
  // Status-specific styles
  ogOnly: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)', // slate
  },
  processing: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // blue
  },
  complete: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // green
  },
  failed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // red
  },
});

/**
 * Hook to format enrichment status for display
 * Use in property cards/lists to show enrichment progress
 */
export function useEnrichmentStatus(status?: EnrichmentStatus) {
  if (!status) return null;

  const config = getStatusConfig(status);
  
  return {
    status,
    label: config.label,
    color: config.color,
    isProcessing: status === 'llm_processing',
    isComplete: status === 'llm_complete',
    isFailed: status === 'llm_failed',
    isBasic: status === 'og_only',
  };
}

/**
 * Simple text-only status indicator
 * For use in compact UI where badge might be too large
 */
export function PropertyEnrichmentText({ status }: { status?: EnrichmentStatus }) {
  const enrichment = useEnrichmentStatus(status);
  
  if (!enrichment) return null;

  return (
    <Text style={{ color: enrichment.color, fontSize: 12, fontWeight: '500' }}>
      {enrichment.isProcessing ? '⚡ ' : enrichment.isComplete ? '✓ ' : ''}
      {enrichment.label}
    </Text>
  );
}
