import { describe, test, expect } from 'vitest';
import {
  calculateMortgagePayment,
  calculateTotalCost,
  calculateDTI,
  type MortgageParams,
  type TotalCostParams,
  type DTIParams,
} from '@/lib/financial/calculations';

describe('Financial Calculations', () => {
  describe('calculateMortgagePayment', () => {
    test('calculates monthly payment for $500k loan at 6% for 30 years', () => {
      const params: MortgageParams = {
        principal: 500000,
        annualInterestRate: 0.06,
        loanTermYears: 30,
      };

      const result = calculateMortgagePayment(params);

      expect(result.monthlyPayment).toBeCloseTo(2997.75, 2);
      expect(result.totalPayments).toBeCloseTo(1079190, 0);
      expect(result.totalInterest).toBeCloseTo(579190, 0);
    });

    test('calculates monthly payment for $300k loan at 5% for 15 years', () => {
      const params: MortgageParams = {
        principal: 300000,
        annualInterestRate: 0.05,
        loanTermYears: 15,
      };

      const result = calculateMortgagePayment(params);

      expect(result.monthlyPayment).toBeCloseTo(2372.74, 2);
      expect(result.totalPayments).toBeCloseTo(427093.20, 2);
      expect(result.totalInterest).toBeCloseTo(127093.20, 2);
    });

    test('calculates monthly payment for $200k loan at 7% for 30 years', () => {
      const params: MortgageParams = {
        principal: 200000,
        annualInterestRate: 0.07,
        loanTermYears: 30,
      };

      const result = calculateMortgagePayment(params);

      expect(result.monthlyPayment).toBeCloseTo(1330.60, 2);
    });

    test('handles 0% interest rate (edge case)', () => {
      const params: MortgageParams = {
        principal: 100000,
        annualInterestRate: 0,
        loanTermYears: 30,
      };

      const result = calculateMortgagePayment(params);

      // 100000 / 360 months = 277.78
      expect(result.monthlyPayment).toBeCloseTo(277.78, 2);
      expect(result.totalPayments).toBeCloseTo(100000, 0);
      expect(result.totalInterest).toBe(0);
    });

    test('handles zero principal', () => {
      const params: MortgageParams = {
        principal: 0,
        annualInterestRate: 0.05,
        loanTermYears: 30,
      };

      const result = calculateMortgagePayment(params);

      expect(result.monthlyPayment).toBe(0);
      expect(result.totalPayments).toBe(0);
      expect(result.totalInterest).toBe(0);
    });

    test('throws error for negative principal', () => {
      const params: MortgageParams = {
        principal: -100000,
        annualInterestRate: 0.05,
        loanTermYears: 30,
      };

      expect(() => calculateMortgagePayment(params)).toThrow('Principal must be non-negative');
    });

    test('throws error for negative interest rate', () => {
      const params: MortgageParams = {
        principal: 100000,
        annualInterestRate: -0.05,
        loanTermYears: 30,
      };

      expect(() => calculateMortgagePayment(params)).toThrow('Interest rate must be non-negative');
    });

    test('throws error for zero or negative loan term', () => {
      const params: MortgageParams = {
        principal: 100000,
        annualInterestRate: 0.05,
        loanTermYears: 0,
      };

      expect(() => calculateMortgagePayment(params)).toThrow('Loan term must be positive');
    });
  });

  describe('calculateTotalCost', () => {
    test('calculates total monthly cost with all components', () => {
      const params: TotalCostParams = {
        purchasePrice: 500000,
        mortgageParams: {
          principal: 400000, // 20% down
          annualInterestRate: 0.06,
          loanTermYears: 30,
        },
        propertyTaxAnnual: 5500,
        insuranceAnnual: 1500,
        hoaMonthly: 200,
        pmiMonthly: 0, // no PMI with 20% down
        maintenanceRate: 0.01, // 1%
      };

      const result = calculateTotalCost(params);

      // Mortgage: ~$2398.20
      expect(result.monthlyMortgage).toBeCloseTo(2398.20, 2);
      // Property tax: 5500/12 = ~458.33
      expect(result.monthlyPropertyTax).toBeCloseTo(458.33, 2);
      // Insurance: 1500/12 = 125
      expect(result.monthlyInsurance).toBeCloseTo(125, 2);
      // HOA: 200
      expect(result.monthlyHOA).toBe(200);
      // PMI: 0
      expect(result.monthlyPMI).toBe(0);
      // Maintenance: (500000 * 0.01) / 12 = ~416.67
      expect(result.monthlyMaintenance).toBeCloseTo(416.67, 2);
      // Total: sum of all above
      expect(result.totalMonthly).toBeCloseTo(3598.53, 2);
      expect(result.totalAnnual).toBeCloseTo(43182.36, 2);
    });

    test('uses default 1% maintenance rate when not provided', () => {
      const params: TotalCostParams = {
        purchasePrice: 500000,
        mortgageParams: {
          principal: 400000,
          annualInterestRate: 0.06,
          loanTermYears: 30,
        },
      };

      const result = calculateTotalCost(params);

      // Default maintenance: (500000 * 0.01) / 12 = ~416.67
      expect(result.monthlyMaintenance).toBeCloseTo(416.67, 2);
    });

    test('handles custom maintenance rate (2%)', () => {
      const params: TotalCostParams = {
        purchasePrice: 500000,
        mortgageParams: {
          principal: 400000,
          annualInterestRate: 0.06,
          loanTermYears: 30,
        },
        maintenanceRate: 0.02, // 2%
      };

      const result = calculateTotalCost(params);

      // 2% maintenance: (500000 * 0.02) / 12 = ~833.33
      expect(result.monthlyMaintenance).toBeCloseTo(833.33, 2);
    });

    test('handles optional costs set to zero', () => {
      const params: TotalCostParams = {
        purchasePrice: 500000,
        mortgageParams: {
          principal: 400000,
          annualInterestRate: 0.06,
          loanTermYears: 30,
        },
        propertyTaxAnnual: 0,
        insuranceAnnual: 0,
        hoaMonthly: 0,
        pmiMonthly: 0,
      };

      const result = calculateTotalCost(params);

      expect(result.monthlyPropertyTax).toBe(0);
      expect(result.monthlyInsurance).toBe(0);
      expect(result.monthlyHOA).toBe(0);
      expect(result.monthlyPMI).toBe(0);
      // Should still have mortgage + maintenance
      expect(result.totalMonthly).toBeGreaterThan(0);
    });
  });

  describe('calculateDTI', () => {
    test('calculates DTI ratios for $5k income, $1.4k housing, $500 other debt', () => {
      const params: DTIParams = {
        grossMonthlyIncome: 5000,
        monthlyHousingCost: 1400,
        monthlyOtherDebts: 500,
      };

      const result = calculateDTI(params);

      // Front-end: (1400 / 5000) * 100 = 28%
      expect(result.frontEndDTI).toBeCloseTo(28, 1);
      // Back-end: ((1400 + 500) / 5000) * 100 = 38%
      expect(result.backEndDTI).toBeCloseTo(38, 1);
      // Can afford conventional: 38% <= 50%
      expect(result.canAffordConventional).toBe(true);
      // Can afford FHA: 28% <= 31% (no) OR 38% <= 43% (yes)
      expect(result.canAffordFHA).toBe(false); // front-end is 28% but back-end is 38%
      // Can afford ideal: 38% <= 36% (no)
      expect(result.canAffordIdeal).toBe(false);
    });

    test('calculates DTI ratios for $6k income, $2k housing, $200 other debt', () => {
      const params: DTIParams = {
        grossMonthlyIncome: 6000,
        monthlyHousingCost: 2000,
        monthlyOtherDebts: 200,
      };

      const result = calculateDTI(params);

      // Front-end: (2000 / 6000) * 100 = 33.33%
      expect(result.frontEndDTI).toBeCloseTo(33.3, 1);
      // Back-end: ((2000 + 200) / 6000) * 100 = 36.67%
      expect(result.backEndDTI).toBeCloseTo(36.7, 1);
      expect(result.canAffordConventional).toBe(true);
      expect(result.canAffordFHA).toBe(false); // front-end 33.3% > 31%
      expect(result.canAffordIdeal).toBe(false); // back-end 36.7% > 36%
    });

    test('calculates DTI ratios for $8k income, $2k housing, no other debt', () => {
      const params: DTIParams = {
        grossMonthlyIncome: 8000,
        monthlyHousingCost: 2000,
        monthlyOtherDebts: 0,
      };

      const result = calculateDTI(params);

      // Front-end: (2000 / 8000) * 100 = 25%
      expect(result.frontEndDTI).toBeCloseTo(25, 1);
      // Back-end: ((2000 + 0) / 8000) * 100 = 25%
      expect(result.backEndDTI).toBeCloseTo(25, 1);
      expect(result.canAffordConventional).toBe(true);
      expect(result.canAffordFHA).toBe(true); // 25% <= 31% AND 25% <= 43%
      expect(result.canAffordIdeal).toBe(true); // 25% <= 36%
    });

    test('flags high DTI warning thresholds', () => {
      const params: DTIParams = {
        grossMonthlyIncome: 4000,
        monthlyHousingCost: 1800,
        monthlyOtherDebts: 1000,
      };

      const result = calculateDTI(params);

      // Front-end: (1800 / 4000) * 100 = 45%
      expect(result.frontEndDTI).toBeCloseTo(45, 1);
      // Back-end: ((1800 + 1000) / 4000) * 100 = 70%
      expect(result.backEndDTI).toBeCloseTo(70, 1);
      expect(result.canAffordConventional).toBe(false); // 70% > 50%
      expect(result.canAffordFHA).toBe(false);
      expect(result.canAffordIdeal).toBe(false);
    });

    test('throws error for zero income', () => {
      const params: DTIParams = {
        grossMonthlyIncome: 0,
        monthlyHousingCost: 1000,
        monthlyOtherDebts: 500,
      };

      expect(() => calculateDTI(params)).toThrow('Gross monthly income must be positive');
    });

    test('throws error for negative income', () => {
      const params: DTIParams = {
        grossMonthlyIncome: -5000,
        monthlyHousingCost: 1000,
        monthlyOtherDebts: 500,
      };

      expect(() => calculateDTI(params)).toThrow('Gross monthly income must be positive');
    });
  });
});
