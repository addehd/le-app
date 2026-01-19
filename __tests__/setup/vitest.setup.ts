import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mocks/supabase';
import { vi } from 'vitest';

// Set environment variables for Supabase before any imports
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock the Supabase client
vi.mock('../../lib/api/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } }
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(function(this: any) { return this; }),
      subscribe: vi.fn(() => 'ok'),
    })),
    removeChannel: vi.fn(),
  },
}));

// Create a global set for store reset functions
const globalStoreResetFns = new Set<() => void>();

// Mock Zustand with the custom implementation
vi.mock('zustand', async () => {
  const actualZustand = await vi.importActual<typeof import('zustand')>('zustand');

  return {
    ...actualZustand,
    create: (<T extends unknown>(stateCreator: any) => {
      const store = actualZustand.create(stateCreator);
      const initialState = store.getState();
      globalStoreResetFns.add(() => {
        store.setState(initialState, true);
      });
      return store;
    }) as typeof actualZustand.create,
  };
});

// Mock AsyncStorage for React Native
vi.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock localStorage for web
const localStorageMock = {
  getItem: vi.fn(() => null), // Return null by default (no stored data)
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Ensure window.localStorage is also defined
if (typeof global.window !== 'undefined') {
  (global.window as any).localStorage = localStorageMock;
}

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterAll(() => server.close());

afterEach(() => {
  // Reset MSW handlers
  server.resetHandlers();

  // Cleanup React Testing Library
  cleanup();

  // Reset all Zustand stores to initial state
  globalStoreResetFns.forEach((resetFn) => {
    resetFn();
  });

  // Clear localStorage mocks
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
});
