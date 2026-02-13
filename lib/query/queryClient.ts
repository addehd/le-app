import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/react-query-persist-client';
import { clientStorage } from './storage';

/**
 * React Query client with offline persistence
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - data kept in cache
      staleTime: 1000 * 60 * 5, // 5 minutes - data considered fresh
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: true, // Refetch when reconnecting to internet
    },
    mutations: {
      retry: 0, // Don't retry failed mutations
    },
  },
});

/**
 * Persister that syncs React Query cache to localStorage/AsyncStorage
 */
export const persister = createSyncStoragePersister({
  storage: clientStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
});
