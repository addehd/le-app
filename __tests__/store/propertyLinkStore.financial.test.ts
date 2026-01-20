import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePropertyLinkStore } from '@/lib/store/propertyLinkStore';
import type { FinancialData } from '@/lib/store/propertyLinkStore';

// Mock Supabase client
vi.mock('@/lib/api/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
      update: vi.fn(() => ({ error: null, eq: vi.fn(() => ({ error: null })) })),
      eq: vi.fn(() => ({ error: null })),
    })),
  },
}));

// Mock Go API client
vi.mock('@/lib/api/goApiClient', () => ({
  goApiClient: {
    isConfigured: vi.fn(() => false),
    extractOGMetadata: vi.fn(),
  },
  PROPERTY_KEYWORDS: [],
}));

describe('propertyLinkStore - financial data', () => {
  beforeEach(() => {
    // Reset store between tests
    const store = usePropertyLinkStore.getState();
    store.propertyLinks = [];
  });

  it('should calculate and save financial data', async () => {
    const store = usePropertyLinkStore.getState();

    // Add a test property first
    const property = await store.savePropertyLink({
      url: 'https://example.com/property',
      title: 'Test Property',
      sharedBy: 'test@example.com'
    });

    // Calculate and save financials
    const financialData = await store.calculateAndSaveFinancials(property.id, {
      mortgage: {
        principal: 500000,
        annualInterestRate: 0.06,
        loanTermYears: 30
      }
    });

    expect(financialData.mortgage).toBeDefined();
    expect(financialData.results?.monthlyPayment).toBeCloseTo(2997.75, 2);
    expect(financialData.results?.calculatedAt).toBeDefined();

    // Verify it's in store
    const results = store.getFinancialResults(property.id);
    expect(results?.monthlyPayment).toBeCloseTo(2997.75, 2);
  });

  it('should update financial data', async () => {
    const store = usePropertyLinkStore.getState();

    const property = await store.savePropertyLink({
      url: 'https://example.com/property2',
      title: 'Test Property 2',
      sharedBy: 'test@example.com'
    });

    const customFinancialData: FinancialData = {
      mortgage: {
        principal: 300000,
        annualInterestRate: 0.05,
        loanTermYears: 15
      },
      results: {
        monthlyPayment: 2372.38,
        calculatedAt: new Date().toISOString()
      }
    };

    await store.updateFinancialData(property.id, customFinancialData);

    const results = store.getFinancialResults(property.id);
    expect(results?.monthlyPayment).toBe(2372.38);
  });

  it('should calculate total cost when all inputs provided', async () => {
    const store = usePropertyLinkStore.getState();

    const property = await store.savePropertyLink({
      url: 'https://example.com/property3',
      title: 'Test Property 3',
      sharedBy: 'test@example.com'
    });

    const financialData = await store.calculateAndSaveFinancials(property.id, {
      mortgage: {
        principal: 400000,
        annualInterestRate: 0.065,
        loanTermYears: 30
      },
      totalCost: {
        purchasePrice: 500000,
        mortgageParams: {
          principal: 400000,
          annualInterestRate: 0.065,
          loanTermYears: 30
        },
        propertyTaxAnnual: 6000,
        insuranceAnnual: 1200,
        hoaMonthly: 200,
        pmiMonthly: 150,
        maintenanceRate: 0.01
      }
    });

    expect(financialData.totalCost).toBeDefined();
    expect(financialData.results?.totalMonthly).toBeDefined();
    expect(financialData.results?.totalMonthly).toBeGreaterThan(0);
  });

  it('should calculate DTI ratios when affordability inputs provided', async () => {
    const store = usePropertyLinkStore.getState();

    const property = await store.savePropertyLink({
      url: 'https://example.com/property4',
      title: 'Test Property 4',
      sharedBy: 'test@example.com'
    });

    const financialData = await store.calculateAndSaveFinancials(property.id, {
      mortgage: {
        principal: 300000,
        annualInterestRate: 0.05,
        loanTermYears: 30
      },
      affordability: {
        grossMonthlyIncome: 8000,
        monthlyOtherDebts: 500
      }
    });

    expect(financialData.affordability).toBeDefined();
    expect(financialData.results?.frontEndDTI).toBeDefined();
    expect(financialData.results?.backEndDTI).toBeDefined();
    expect(financialData.results?.canAfford).toBeDefined();
  });

  it('should return null for financial results if property not found', () => {
    const store = usePropertyLinkStore.getState();
    const results = store.getFinancialResults('non-existent-id');
    expect(results).toBeNull();
  });

  it('should return null for financial results if no financial data saved', async () => {
    const store = usePropertyLinkStore.getState();

    const property = await store.savePropertyLink({
      url: 'https://example.com/property5',
      title: 'Test Property 5',
      sharedBy: 'test@example.com'
    });

    const results = store.getFinancialResults(property.id);
    expect(results).toBeNull();
  });
});
