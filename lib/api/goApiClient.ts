/**
 * Go API Client for property data extraction
 * 
 * Provides type-safe methods to interact with Go Lambda functions:
 * - /go/crawler-og: Extract OG metadata (fast, synchronous)
 * - /go/auto-crawl: LLM-powered data extraction (async with caching)
 */

// ============================================================================
// Types matching Go API responses
// ============================================================================

export interface OGMetadataResponse {
  // Core fields
  title: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
  favicon?: string;

  // Real estate fields (from OG tags)
  address?: string;
  city?: string;
  price?: number;
  currency?: string;
  area?: number;
  bedrooms?: number;

  // OG data (all extracted meta tags)
  og?: Record<string, string[]>;

  // Error field
  error?: string;
}

export interface AutoCrawlRequest {
  url: string;
  keywords: string[];
  cachedSelectors?: Record<string, string>;
  async?: boolean; // Internal flag, don't set manually
}

export interface AutoCrawlResponse {
  url: string;
  extractedData: Record<string, string>;
  cachedSelectors: Record<string, string>;
  method: 'cached' | 'db' | 'llm' | 'processing';
  status?: 'processing' | 'completed' | 'failed';
  error?: string;
}

// ============================================================================
// Property Keywords for LLM Extraction
// ============================================================================

export const PROPERTY_KEYWORDS = [
  // Core info
  'title',
  'description',
  'price',
  'currency',
  
  // Address
  'address',
  'street',
  'city',
  'postalCode',
  'country',
  
  // Location
  'latitude',
  'longitude',
  
  // Property details
  'bedrooms',
  'bathrooms',
  'area',
  'rooms',
  'floor',
  'buildYear',
  'propertyType',
  
  // Financial
  'monthlyFee',
  'operatingCost',
  
  // Features
  'elevator',
  'balcony',
  'parking',
  'features',
  
  // Metadata
  'publishedDate',
  'source',
] as const;

// ============================================================================
// API Client Configuration
// ============================================================================

interface GoApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

class GoApiClient {
  private baseUrl: string;
  private timeout: number;
  private retries: number;

  constructor(config?: Partial<GoApiClientConfig>) {
    this.baseUrl = config?.baseUrl || process.env.EXPO_PUBLIC_CRAWLER_API_URL || '';
    this.timeout = config?.timeout || 30000; // 30s default
    this.retries = config?.retries || 2;

    if (!this.baseUrl) {
      console.warn('⚠️ EXPO_PUBLIC_CRAWLER_API_URL not configured. Go API client will not work.');
    }
  }

  /**
   * Extract OG metadata from a URL
   * Fast, synchronous extraction of Open Graph tags
   * Returns immediately with basic property data
   */
  async extractOGMetadata(url: string): Promise<OGMetadataResponse> {
    return this.fetchWithRetry<OGMetadataResponse>(
      '/go/crawler-og',
      {
        method: 'POST',
        body: JSON.stringify({ url }),
      }
    );
  }

  /**
   * Enrich property data using LLM
   * Checks cache first, then uses Gemini 2.5 Flash if needed
   * May return 'processing' status if extraction is async
   */
  async enrichPropertyData(
    url: string,
    keywords: string[] = [...PROPERTY_KEYWORDS]
  ): Promise<AutoCrawlResponse> {
    return this.fetchWithRetry<AutoCrawlResponse>(
      '/go/auto-crawl',
      {
        method: 'POST',
        body: JSON.stringify({ url, keywords }),
      }
    );
  }

  /**
   * Fetch with retry logic and timeout handling
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    attempt = 1
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    if (!this.baseUrl) {
      throw new Error('Go API URL not configured. Set EXPO_PUBLIC_CRAWLER_API_URL in .env');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data as T;

    } catch (error) {
      // Retry on network errors or timeouts
      if (attempt < this.retries && this.isRetryableError(error)) {
        console.log(`🔄 Retrying ${endpoint} (attempt ${attempt + 1}/${this.retries})...`);
        await this.delay(attempt * 1000); // Exponential backoff
        return this.fetchWithRetry<T>(endpoint, options, attempt + 1);
      }

      // Rethrow with context
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Go API request failed (${endpoint}): ${errorMessage}`);
    }
  }

  /**
   * Check if error is retryable (network/timeout errors)
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      return (
        error.name === 'AbortError' ||
        error.message.includes('fetch failed') ||
        error.message.includes('network') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('timeout')
      );
    }
    return false;
  }

  /**
   * Simple delay helper for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if Go API is configured and reachable
   */
  isConfigured(): boolean {
    return !!this.baseUrl;
  }

  /**
   * Get current API base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// ============================================================================
// Export singleton instance
// ============================================================================

export const goApiClient = new GoApiClient();

// Export class for testing/custom instances
export { GoApiClient };
