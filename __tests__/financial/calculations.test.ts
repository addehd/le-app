import { describe, test, expect } from 'vitest';
import {
  calculateAmorteringskrav,
  calculateMortgagePayment,
  calculateTotalCost,
  calculateAffordability,
  formatCurrencySEK,
  formatNumberSE,
  type SwedishMortgageParams,
  type SwedishTotalCostParams,
  type SwedishAffordabilityParams,
} from '@/lib/financial/calculations';

describe('Swedish Financial Calculations', () => {
  describe('calculateAmorteringskrav', () => {
    test('requires 2% yearly for LTV > 70%', () => {
      const result = calculateAmorteringskrav({
        principal: 2550000,  // 3M SEK price, 15% down = 85% LTV
        purchasePrice: 3000000
      });

      expect(result.yearlyAmortizationPercent).toBe(2);
      expect(result.monthlyAmortization).toBeCloseTo(4250, 0);  // 2% of 2.55M / 12
      expect(result.reason).toContain('85.0%');
      expect(result.reason).toContain('2% yearly');
    });

    test('requires 1% yearly for LTV 50-70%', () => {
      const result = calculateAmorteringskrav({
        principal: 1800000,  // 3M SEK, 40% down = 60% LTV
        purchasePrice: 3000000
      });

      expect(result.yearlyAmortizationPercent).toBe(1);
      expect(result.monthlyAmortization).toBeCloseTo(1500, 0);  // 1% of 1.8M / 12
      expect(result.reason).toContain('60.0%');
    });

    test('no requirement for LTV ≤ 50%', () => {
      const result = calculateAmorteringskrav({
        principal: 1200000,  // 3M SEK, 60% down = 40% LTV
        purchasePrice: 3000000
      });

      expect(result.yearlyAmortizationPercent).toBe(0);
      expect(result.monthlyAmortization).toBe(0);
      expect(result.reason).toContain('no requirement');
    });

    test('requires additional 1% if debt > 4.5x income', () => {
      const result = calculateAmorteringskrav({
        principal: 2250000,  // 75% LTV
        purchasePrice: 3000000,
        grossAnnualIncome: 400000,
        totalDebt: 2000000  // 5x income
      });

      expect(result.yearlyAmortizationPercent).toBe(3);  // 2% (LTV) + 1% (debt)
      expect(result.reason).toContain('5.0x income');
    });

    test('no additional requirement if debt ≤ 4.5x income', () => {
      const result = calculateAmorteringskrav({
        principal: 2250000,  // 75% LTV
        purchasePrice: 3000000,
        grossAnnualIncome: 600000,
        totalDebt: 2000000  // 3.3x income
      });

      expect(result.yearlyAmortizationPercent).toBe(2);  // Only LTV rule applies
    });
  });

  describe('calculateMortgagePayment', () => {
    test('calculates payment for 3M SEK, 20% down, 4% rate, 30 years', () => {
      const params: SwedishMortgageParams = {
        purchasePrice: 3000000,
        downPaymentPercent: 20,
        annualInterestRate: 0.04,
        loanTermYears: 30,
        propertyType: 'villa'
      };

      const result = calculateMortgagePayment(params);

      // Principal: 2.4M SEK (80% LTV)
      // LTV 80% → 2% amortization → 48k SEK/year → 4000 SEK/month
      // Interest: ~11,458 SEK/month
      // Total: ~15,458 SEK/month
      expect(result.ltv).toBeCloseTo(80, 1);
      expect(result.amortizationPercent).toBe(2);
      expect(result.monthlyAmortization).toBeCloseTo(4000, 0);
      expect(result.monthlyInterest).toBeCloseTo(11458, 0);
      expect(result.monthlyPayment).toBeCloseTo(15458, 0);
    });

    test('enforces 85% LTV cap (bolånetak)', () => {
      const params: SwedishMortgageParams = {
        purchasePrice: 3000000,
        downPaymentPercent: 10,  // Only 10% down = 90% LTV
        annualInterestRate: 0.04,
        loanTermYears: 30,
        propertyType: 'villa'
      };

      expect(() => calculateMortgagePayment(params)).toThrow('85% bolånetak');
      expect(() => calculateMortgagePayment(params)).toThrow('LTV 90.0%');
    });

    test('allows exactly 15% down (85% LTV)', () => {
      const params: SwedishMortgageParams = {
        purchasePrice: 3000000,
        downPaymentPercent: 15,  // Exactly 15% down = 85% LTV
        annualInterestRate: 0.04,
        loanTermYears: 30,
        propertyType: 'villa'
      };

      const result = calculateMortgagePayment(params);
      expect(result.ltv).toBeCloseTo(85, 1);
      expect(result.amortizationPercent).toBe(2);
    });

    test('calculates for BRF property type', () => {
      const params: SwedishMortgageParams = {
        purchasePrice: 2000000,
        downPaymentPercent: 25,
        annualInterestRate: 0.045,
        loanTermYears: 25,
        propertyType: 'brf'
      };

      const result = calculateMortgagePayment(params);

      // 75% LTV → 2% amortization
      expect(result.ltv).toBeCloseTo(75, 1);
      expect(result.amortizationPercent).toBe(2);
    });

    test('handles 0% interest rate edge case', () => {
      const params: SwedishMortgageParams = {
        purchasePrice: 1000000,
        downPaymentPercent: 40,  // 60% LTV → 1% amortization
        annualInterestRate: 0,
        loanTermYears: 30,
        propertyType: 'villa'
      };

      const result = calculateMortgagePayment(params);

      expect(result.monthlyInterest).toBe(0);
      expect(result.monthlyAmortization).toBeCloseTo(500, 0);  // 1% of 600k / 12
      expect(result.monthlyPayment).toBeCloseTo(500, 0);
    });
  });

  describe('calculateTotalCost', () => {
    test('calculates total cost for villa', () => {
      const params: SwedishTotalCostParams = {
        purchasePrice: 3000000,
        downPaymentPercent: 20,
        annualInterestRate: 0.04,
        loanTermYears: 30,
        propertyType: 'villa',
        propertyTaxAnnual: 7000,
        insuranceAnnual: 5000,
        brfMonthly: 0,  // No BRF for villa
        maintenanceRate: 0.01  // 1% for villa
      };

      const result = calculateTotalCost(params);

      // Mortgage: ~15,458 SEK/month
      expect(result.monthlyMortgage).toBeCloseTo(15458, 0);
      // Property tax: 7000/12 = ~583
      expect(result.monthlyPropertyTax).toBeCloseTo(583, 0);
      // Insurance: 5000/12 = ~417
      expect(result.monthlyInsurance).toBeCloseTo(417, 0);
      // BRF: 0 for villa
      expect(result.monthlyBRF).toBe(0);
      // Maintenance: (3M * 1%) / 12 = 2500
      expect(result.monthlyMaintenance).toBeCloseTo(2500, 0);
      // Total: 15458 + 583 + 417 + 0 + 2500 = 18958
      expect(result.totalMonthly).toBeCloseTo(18958, 0);
    });

    test('calculates total cost for BRF (no maintenance)', () => {
      const params: SwedishTotalCostParams = {
        purchasePrice: 2000000,
        downPaymentPercent: 25,
        annualInterestRate: 0.045,
        loanTermYears: 25,
        propertyType: 'brf',
        propertyTaxAnnual: 0,  // Often 0 for BRF
        insuranceAnnual: 3000,
        brfMonthly: 3500  // BRF fee
      };

      const result = calculateTotalCost(params);

      // BRF: 3500
      expect(result.monthlyBRF).toBe(3500);
      // Maintenance: 0 for BRF (included in BRF fee)
      expect(result.monthlyMaintenance).toBe(0);
      expect(result.totalMonthly).toBeGreaterThan(0);
    });

    test('uses default 1% maintenance for villa when not specified', () => {
      const params: SwedishTotalCostParams = {
        purchasePrice: 2000000,
        downPaymentPercent: 30,
        annualInterestRate: 0.04,
        loanTermYears: 30,
        propertyType: 'villa'
        // No maintenanceRate specified
      };

      const result = calculateTotalCost(params);

      // Default 1%: (2M * 0.01) / 12 = ~1667
      expect(result.monthlyMaintenance).toBeCloseTo(1667, 0);
    });
  });

  describe('calculateAffordability', () => {
    test('calculates affordability at stress test rate', () => {
      const params: SwedishAffordabilityParams = {
        grossMonthlyIncome: 40000,
        monthlyHousingCost: 20000,
        monthlyOtherDebts: 3000,
        stressTestRate: 6.0
      };

      const result = calculateAffordability(params);

      // Housing ratio: (20000 / 40000) * 100 = 50%
      expect(result.housingCostRatio).toBeCloseTo(50, 1);
      // Total debt ratio: ((20000 + 3000) / 40000) * 100 = 57.5%
      expect(result.totalDebtRatio).toBeCloseTo(57.5, 1);
      expect(result.stressTestRate).toBe(6.0);
      expect(result.canAffordConservative).toBe(false);  // 57.5% > 50%
      expect(result.canAffordStandard).toBe(true);  // 57.5% ≤ 60%
      expect(result.reasoning).toContain('6%');
    });

    test('passes conservative threshold', () => {
      const params: SwedishAffordabilityParams = {
        grossMonthlyIncome: 50000,
        monthlyHousingCost: 20000,
        monthlyOtherDebts: 4000,
        stressTestRate: 5.5
      };

      const result = calculateAffordability(params);

      // Total debt: (24000 / 50000) * 100 = 48%
      expect(result.totalDebtRatio).toBeCloseTo(48, 1);
      expect(result.canAffordConservative).toBe(true);  // 48% ≤ 50%
      expect(result.canAffordStandard).toBe(true);
    });

    test('fails both thresholds', () => {
      const params: SwedishAffordabilityParams = {
        grossMonthlyIncome: 30000,
        monthlyHousingCost: 18000,
        monthlyOtherDebts: 3000,
        stressTestRate: 7.0
      };

      const result = calculateAffordability(params);

      // Total debt: (21000 / 30000) * 100 = 70%
      expect(result.totalDebtRatio).toBeCloseTo(70, 1);
      expect(result.canAffordConservative).toBe(false);  // 70% > 50%
      expect(result.canAffordStandard).toBe(false);  // 70% > 60%
    });

    test('throws error for zero income', () => {
      const params: SwedishAffordabilityParams = {
        grossMonthlyIncome: 0,
        monthlyHousingCost: 15000,
        monthlyOtherDebts: 2000,
        stressTestRate: 6.0
      };

      expect(() => calculateAffordability(params)).toThrow('Gross monthly income must be positive');
    });
  });

  describe('formatCurrencySEK', () => {
    test('formats as Swedish currency with space separator', () => {
      expect(formatCurrencySEK(3000000)).toBe('3\u00A0000\u00A0000\u00A0kr');
      expect(formatCurrencySEK(15431)).toBe('15\u00A0431\u00A0kr');
      expect(formatCurrencySEK(500)).toBe('500\u00A0kr');
    });

    test('handles decimals by rounding to whole numbers', () => {
      expect(formatCurrencySEK(15431.75)).toBe('15\u00A0432\u00A0kr');
      expect(formatCurrencySEK(1234.49)).toBe('1\u00A0234\u00A0kr');
    });
  });

  describe('formatNumberSE', () => {
    test('formats numbers with Swedish locale (space separator)', () => {
      expect(formatNumberSE(3000000)).toBe('3\u00A0000\u00A0000');
      expect(formatNumberSE(15431)).toBe('15\u00A0431');
      expect(formatNumberSE(500)).toBe('500');
    });
  });
});
