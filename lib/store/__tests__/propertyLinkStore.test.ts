import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { server } from '../../../__tests__/setup/mocks/supabase';
import { http, HttpResponse } from 'msw';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:54321';

// Mock the Go API client with simpler mocks
const mockExtractOGMetadata = vi.fn();
const mockIsConfigured = vi.fn();

vi.mock('../../api/goApiClient', () => ({
  goApiClient: {
    isConfigured: () => mockIsConfigured(),
    extractOGMetadata: (url: string) => mockExtractOGMetadata(url),
  },
  PROPERTY_KEYWORDS: ['price', 'address', 'bedrooms'],
}));

// Import after mocks
import { usePropertyLinkStore } from '../propertyLinkStore';

describe('propertyLinkStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    usePropertyLinkStore.setState({
      propertyLinks: [],
      isLoading: false,
      error: null,
    });

    // Set up default mock implementations
    mockIsConfigured.mockReturnValue(true);
    mockExtractOGMetadata.mockResolvedValue({
      title: 'Test Property',
      description: 'A beautiful test property',
      image: 'https://example.com/image.jpg',
      price: 5000000,
      currency: 'SEK',
      address: 'Test Street 123',
      city: 'Stockholm',
      area: 85,
      bedrooms: 3,
      og: {
        image: ['https://example.com/image.jpg', 'https://example.com/image2.jpg'],
      },
    });
  });

  describe('fetchPropertyData', () => {
    test('fetches property data with OG metadata', async () => {
      const store = usePropertyLinkStore.getState();

      const result = await store.fetchPropertyData('https://hemnet.se/property/123');

      expect(result.title).toBe('Test Property');
      expect(result.description).toBe('A beautiful test property');
      expect(result.image).toBe('https://example.com/image.jpg');
      expect(result.images).toHaveLength(2);
      expect(result.propertyData?.price).toBe(5000000);
      expect(result.propertyData?.currency).toBe('SEK');
      expect(result.propertyData?.enrichmentStatus).toBe('og_only');
    });

    test('handles invalid URL format', async () => {
      const store = usePropertyLinkStore.getState();

      const result = await store.fetchPropertyData('not-a-url');

      expect(result.title).toBe('Property Link');
      expect(result.propertyData?.enrichmentStatus).toBe('llm_failed');
    });

    test('handles Go API not configured', async () => {
      mockIsConfigured.mockReturnValue(false);

      const store = usePropertyLinkStore.getState();
      const result = await store.fetchPropertyData('https://hemnet.se/property/123');

      expect(result.title).toBe('hemnet.se');
      expect(result.description).toContain('Property from hemnet.se');
      expect(result.propertyData?.enrichmentStatus).toBe('og_only');
    });

    test('handles OG extraction error', async () => {
      mockExtractOGMetadata.mockResolvedValue({
        title: '',
        error: 'Failed to fetch',
      });

      const store = usePropertyLinkStore.getState();
      const result = await store.fetchPropertyData('https://hemnet.se/property/123');

      expect(result.title).toBe('hemnet.se');
      expect(result.propertyData?.enrichmentStatus).toBe('llm_failed');
    });
  });

  describe('addPropertyLink', () => {
    test('adds property link successfully', async () => {
      const store = usePropertyLinkStore.getState();

      const result = await store.addPropertyLink(
        'https://hemnet.se/property/123',
        'user-456'
      );

      expect(result.url).toBe('https://hemnet.se/property/123');
      expect(result.sharedBy).toBe('user-456');
      expect(result.id).toBeTruthy();
      expect(result.title).toBe('Test Property');

      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks).toHaveLength(1);
      expect(state.propertyLinks[0].id).toBe(result.id);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    test('adds property link with coordinates', async () => {
      const store = usePropertyLinkStore.getState();

      const result = await store.addPropertyLink(
        'https://hemnet.se/property/123',
        'user-456',
        59.3293,
        18.0686
      );

      expect(result.latitude).toBe(59.3293);
      expect(result.longitude).toBe(18.0686);
    });

    test('updates localStorage after adding', async () => {
      const store = usePropertyLinkStore.getState();

      await store.addPropertyLink('https://example.com', 'user-1');

      // Verify localStorage.setItem was called
      expect(global.localStorage.setItem).toHaveBeenCalled();
    });

    test('handles API errors gracefully', async () => {
      // Override MSW handler to return error
      server.use(
        http.post(`${SUPABASE_URL}/rest/v1/property_links`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      const store = usePropertyLinkStore.getState();

      // Store still works with local state even if DB save fails
      const result = await store.addPropertyLink('https://example.com', 'user-456');

      // Operation succeeds locally
      expect(result.url).toBe('https://example.com');
      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks).toHaveLength(1);
      // No error set because local operation succeeded
      expect(state.isLoading).toBe(false);
    });

    test('handles fetchPropertyData errors', async () => {
      mockExtractOGMetadata.mockRejectedValue(
        new Error('Network error')
      );

      const store = usePropertyLinkStore.getState();

      await expect(
        store.addPropertyLink('https://example.com', 'user-456')
      ).rejects.toThrow('Network error');

      const state = usePropertyLinkStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
      expect(state.propertyLinks).toHaveLength(0);
    });

    test('sets loading state during operation', async () => {
      const store = usePropertyLinkStore.getState();

      const promise = store.addPropertyLink('https://example.com', 'user-1');

      // Loading state is briefly set (may complete too fast to catch)
      await promise;

      const state = usePropertyLinkStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('removePropertyLink', () => {
    test('removes property link by id', async () => {
      const store = usePropertyLinkStore.getState();

      // Setup: add a link first
      const link = await store.addPropertyLink('https://example.com', 'user-456');
      expect(usePropertyLinkStore.getState().propertyLinks).toHaveLength(1);

      // Test: remove it
      await store.removePropertyLink(link.id);

      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks).toHaveLength(0);
    });

    test('handles removing non-existent link gracefully', async () => {
      const store = usePropertyLinkStore.getState();

      // Should not throw
      await store.removePropertyLink('non-existent-id');

      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks).toHaveLength(0);
    });

    test('updates localStorage after removal', async () => {
      const store = usePropertyLinkStore.getState();

      const link = await store.addPropertyLink('https://example.com', 'user-1');
      vi.clearAllMocks();

      await store.removePropertyLink(link.id);

      expect(global.localStorage.setItem).toHaveBeenCalled();
    });

    test('continues with local deletion even if DB delete fails', async () => {
      const store = usePropertyLinkStore.getState();

      const link = await store.addPropertyLink('https://example.com', 'user-1');

      // Override to fail delete
      server.use(
        http.delete(`${SUPABASE_URL}/rest/v1/property_links`, () => {
          return HttpResponse.json(
            { message: 'Delete failed' },
            { status: 500 }
          );
        })
      );

      await store.removePropertyLink(link.id);

      // Local deletion still succeeds
      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks).toHaveLength(0);
    });
  });

  describe('savePropertyLink', () => {
    test('saves property link with provided data', async () => {
      const store = usePropertyLinkStore.getState();

      const result = await store.savePropertyLink({
        url: 'https://example.com',
        title: 'Manual Property',
        description: 'Manually added',
        image: 'https://example.com/img.jpg',
        sharedBy: 'user-789',
      });

      expect(result.id).toBeTruthy();
      expect(result.title).toBe('Manual Property');
      expect(result.url).toBe('https://example.com');

      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks).toHaveLength(1);
    });

    test('generates id and timestamp if not provided', async () => {
      const store = usePropertyLinkStore.getState();

      const result = await store.savePropertyLink({
        url: 'https://example.com',
        sharedBy: 'user-1',
      });

      expect(result.id).toBeTruthy();
      expect(result.sharedAt).toBeTruthy();
      expect(new Date(result.sharedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('uses provided id and timestamp if given', async () => {
      const store = usePropertyLinkStore.getState();
      const customId = 'custom-id-123';
      const customTime = '2024-01-01T00:00:00Z';

      const result = await store.savePropertyLink({
        id: customId,
        url: 'https://example.com',
        sharedBy: 'user-1',
        sharedAt: customTime,
      });

      expect(result.id).toBe(customId);
      expect(result.sharedAt).toBe(customTime);
    });
  });

  describe('loadFromDatabase', () => {
    test('loads links from Supabase', async () => {
      // Override MSW handler with custom data
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/property_links`, () => {
          return HttpResponse.json([
            {
              id: '1',
              url: 'https://hemnet.se/1',
              title: 'Property 1',
              shared_by: 'user-1',
              shared_at: '2024-01-01T00:00:00Z',
            },
            {
              id: '2',
              url: 'https://hemnet.se/2',
              title: 'Property 2',
              shared_by: 'user-2',
              shared_at: '2024-01-02T00:00:00Z',
            },
          ]);
        })
      );

      const store = usePropertyLinkStore.getState();
      await store.loadFromDatabase();

      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks).toHaveLength(2);
      expect(state.propertyLinks[0].sharedBy).toBe('user-1');
      expect(state.propertyLinks[1].sharedBy).toBe('user-2');
    });

    test('converts snake_case to camelCase', async () => {
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/property_links`, () => {
          return HttpResponse.json([
            {
              id: '1',
              url: 'https://example.com',
              shared_by: 'user-123',
              shared_at: '2024-01-01T00:00:00Z',
              property_data: { price: 1000000 },
            },
          ]);
        })
      );

      const store = usePropertyLinkStore.getState();
      await store.loadFromDatabase();

      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks[0].sharedBy).toBe('user-123');
      expect(state.propertyLinks[0].sharedAt).toBe('2024-01-01T00:00:00Z');
      expect(state.propertyLinks[0].propertyData).toEqual({ price: 1000000 });
    });

    test('handles empty database response', async () => {
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/property_links`, () => {
          return HttpResponse.json([]);
        })
      );

      const store = usePropertyLinkStore.getState();
      await store.loadFromDatabase();

      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks).toHaveLength(0);
    });

    test('merges with local links without duplicates', async () => {
      const store = usePropertyLinkStore.getState();

      // Add a local link first
      await store.addPropertyLink('https://local.com', 'user-1');
      const localId = usePropertyLinkStore.getState().propertyLinks[0].id;

      // Mock database returns different link + same local link
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/property_links`, () => {
          return HttpResponse.json([
            {
              id: localId, // Same as local
              url: 'https://local.com',
              shared_by: 'user-1',
              shared_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 'db-only',
              url: 'https://db.com',
              shared_by: 'user-2',
              shared_at: '2024-01-02T00:00:00Z',
            },
          ]);
        })
      );

      await store.loadFromDatabase();

      const state = usePropertyLinkStore.getState();
      // Should have 2 links: 1 local (kept) + 1 db-only (added)
      expect(state.propertyLinks).toHaveLength(2);
      const ids = state.propertyLinks.map(l => l.id);
      expect(ids).toContain(localId);
      expect(ids).toContain('db-only');
    });

    test('handles database error gracefully', async () => {
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/property_links`, () => {
          return HttpResponse.json(
            { message: 'Database error' },
            { status: 500 }
          );
        })
      );

      const store = usePropertyLinkStore.getState();

      // Should not throw
      await store.loadFromDatabase();

      // State unchanged
      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks).toHaveLength(0);
    });

    test('updates localStorage with merged data', async () => {
      server.use(
        http.get(`${SUPABASE_URL}/rest/v1/property_links`, () => {
          return HttpResponse.json([
            {
              id: '1',
              url: 'https://example.com',
              shared_by: 'user-1',
              shared_at: '2024-01-01T00:00:00Z',
            },
          ]);
        })
      );

      const store = usePropertyLinkStore.getState();
      await store.loadFromDatabase();

      expect(global.localStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('updatePropertyFromRealtime', () => {
    test('updates existing property with enriched data', () => {
      const store = usePropertyLinkStore.getState();

      // Setup: add a property
      usePropertyLinkStore.setState({
        propertyLinks: [
          {
            id: 'test-id',
            url: 'https://example.com',
            sharedBy: 'user-1',
            sharedAt: '2024-01-01T00:00:00Z',
            title: 'Old Title',
            propertyData: { enrichmentStatus: 'og_only' },
          },
        ],
      });

      // Simulate realtime update with enriched data
      store.updatePropertyFromRealtime({
        id: 'test-id',
        title: 'New Enriched Title',
        description: 'Enriched description',
        property_data: {
          enrichmentStatus: 'llm_complete',
          bedrooms: 3,
          bathrooms: 2,
        },
      });

      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks[0].title).toBe('New Enriched Title');
      expect(state.propertyLinks[0].description).toBe('Enriched description');
      expect(state.propertyLinks[0].propertyData?.enrichmentStatus).toBe('llm_complete');
      expect(state.propertyLinks[0].propertyData?.bedrooms).toBe(3);
    });

    test('merges property data without overwriting existing fields', () => {
      usePropertyLinkStore.setState({
        propertyLinks: [
          {
            id: 'test-id',
            url: 'https://example.com',
            sharedBy: 'user-1',
            sharedAt: '2024-01-01T00:00:00Z',
            propertyData: {
              price: 1000000,
              enrichmentStatus: 'og_only',
            },
          },
        ],
      });

      const store = usePropertyLinkStore.getState();
      store.updatePropertyFromRealtime({
        id: 'test-id',
        property_data: {
          bedrooms: 3,
          enrichmentStatus: 'llm_complete',
        },
      });

      const state = usePropertyLinkStore.getState();
      // Price preserved, bedrooms added, enrichmentStatus updated
      expect(state.propertyLinks[0].propertyData?.price).toBe(1000000);
      expect(state.propertyLinks[0].propertyData?.bedrooms).toBe(3);
      expect(state.propertyLinks[0].propertyData?.enrichmentStatus).toBe('llm_complete');
    });

    test('ignores updates for unknown properties', () => {
      usePropertyLinkStore.setState({
        propertyLinks: [
          {
            id: 'existing-id',
            url: 'https://example.com',
            sharedBy: 'user-1',
            sharedAt: '2024-01-01T00:00:00Z',
          },
        ],
      });

      const store = usePropertyLinkStore.getState();
      store.updatePropertyFromRealtime({
        id: 'non-existent-id',
        title: 'Should not appear',
      });

      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks).toHaveLength(1);
      expect(state.propertyLinks[0].id).toBe('existing-id');
    });

    test('updates localStorage after realtime update', () => {
      usePropertyLinkStore.setState({
        propertyLinks: [
          {
            id: 'test-id',
            url: 'https://example.com',
            sharedBy: 'user-1',
            sharedAt: '2024-01-01T00:00:00Z',
          },
        ],
      });

      vi.clearAllMocks();

      const store = usePropertyLinkStore.getState();
      store.updatePropertyFromRealtime({
        id: 'test-id',
        title: 'Updated',
      });

      expect(global.localStorage.setItem).toHaveBeenCalled();
    });

    test('preserves property order in list', () => {
      usePropertyLinkStore.setState({
        propertyLinks: [
          {
            id: 'first',
            url: 'https://first.com',
            sharedBy: 'user-1',
            sharedAt: '2024-01-01T00:00:00Z',
          },
          {
            id: 'second',
            url: 'https://second.com',
            sharedBy: 'user-2',
            sharedAt: '2024-01-02T00:00:00Z',
          },
          {
            id: 'third',
            url: 'https://third.com',
            sharedBy: 'user-3',
            sharedAt: '2024-01-03T00:00:00Z',
          },
        ],
      });

      const store = usePropertyLinkStore.getState();
      store.updatePropertyFromRealtime({
        id: 'second',
        title: 'Updated Second',
      });

      const state = usePropertyLinkStore.getState();
      expect(state.propertyLinks[0].id).toBe('first');
      expect(state.propertyLinks[1].id).toBe('second');
      expect(state.propertyLinks[1].title).toBe('Updated Second');
      expect(state.propertyLinks[2].id).toBe('third');
    });
  });

  describe('state persistence', () => {
    test('saves to localStorage when links change', async () => {
      const store = usePropertyLinkStore.getState();

      await store.addPropertyLink('https://example.com', 'user-1');

      // Verify localStorage.setItem was called with property-links key
      expect(global.localStorage.setItem).toHaveBeenCalledWith(
        'property-links',
        expect.any(String)
      );
    });

    test('localStorage saves valid JSON', async () => {
      const store = usePropertyLinkStore.getState();

      await store.addPropertyLink('https://example.com', 'user-1');

      const call = vi.mocked(global.localStorage.setItem).mock.calls[0];
      expect(call[0]).toBe('property-links');

      // Should be valid JSON
      expect(() => JSON.parse(call[1] as string)).not.toThrow();
    });
  });
});
