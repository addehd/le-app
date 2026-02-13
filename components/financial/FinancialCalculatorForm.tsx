import { View, Text, TextInput, Pressable, ScrollView, Platform } from 'react-native';
import { useState } from 'react';
import { DollarSign, Home, Calculator, ChevronDown, ChevronUp } from 'lucide-react-native';
import { type FinancialData } from '../../lib/store/propertyLinkStore';
import { useProperties } from '../../lib/query/useProperties';
import { calculateMortgagePayment, calculateTotalCost, calculateAffordability } from '../../lib/financial/calculations';
import type { MortgageParams, TotalCostParams, DTIParams } from '../../lib/financial/calculations';

interface FinancialCalculatorFormProps {
  propertyId: string;
  initialData?: FinancialData;
  onCalculate?: (results: FinancialData['results']) => void;
}

export function FinancialCalculatorForm({
  propertyId,
  initialData,
  onCalculate
}: FinancialCalculatorFormProps) {
  const { updateFinancialData } = useProperties();

  // Loading state
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Section visibility
  const [showAdditionalCosts, setShowAdditionalCosts] = useState(false);
  const [showAffordability, setShowAffordability] = useState(false);

  // Mortgage inputs
  const [purchasePrice, setPurchasePrice] = useState(
    initialData?.mortgage?.principal?.toString() || ''
  );
  const [downPayment, setDownPayment] = useState(
    initialData?.mortgage?.downPayment?.toString() || ''
  );
  const [interestRate, setInterestRate] = useState(
    initialData?.mortgage?.annualInterestRate?.toString() || ''
  );
  const [loanTerm, setLoanTerm] = useState<number>(
    initialData?.mortgage?.loanTermYears || 30
  );

  // Additional costs inputs
  const [propertyTax, setPropertyTax] = useState(
    initialData?.totalCost?.propertyTaxAnnual?.toString() || ''
  );
  const [insurance, setInsurance] = useState(
    initialData?.totalCost?.insuranceAnnual?.toString() || ''
  );
  const [hoaMonthly, setHoaMonthly] = useState(
    initialData?.totalCost?.hoaMonthly?.toString() || ''
  );
  const [pmiMonthly, setPmiMonthly] = useState(
    initialData?.totalCost?.pmiMonthly?.toString() || ''
  );
  const [maintenanceRate, setMaintenanceRate] = useState(
    initialData?.totalCost?.maintenanceRate?.toString() || '1'
  );

  // Affordability inputs
  const [grossIncome, setGrossIncome] = useState(
    initialData?.affordability?.grossMonthlyIncome?.toString() || ''
  );
  const [otherDebts, setOtherDebts] = useState(
    initialData?.affordability?.monthlyOtherDebts?.toString() || ''
  );

  // Calculate down payment percentage
  const downPaymentPercent = purchasePrice && downPayment
    ? ((parseFloat(downPayment) / parseFloat(purchasePrice)) * 100).toFixed(1)
    : '0';

  // Check if PMI should be hidden (down payment >= 20%)
  const hidePMI = parseFloat(downPaymentPercent) >= 20;

  const handleCalculate = async () => {
    setIsCalculating(true);
    setError(null);

    try {
      // Validate required fields
      if (!purchasePrice || !downPayment || !interestRate) {
        throw new Error('Please fill in all mortgage fields');
      }

      const principal = parseFloat(purchasePrice) - parseFloat(downPayment);

      // Build inputs object
      const inputs: {
        mortgage?: MortgageParams;
        totalCost?: TotalCostParams;
        affordability?: DTIParams;
      } = {};

      // Mortgage params (required)
      inputs.mortgage = {
        principal,
        annualInterestRate: parseFloat(interestRate),
        loanTermYears: loanTerm,
        downPayment: parseFloat(downPayment),
      };

      // Total cost params (optional)
      if (showAdditionalCosts) {
        const monthlyPayment = 0; // Will be calculated
        inputs.totalCost = {
          monthlyMortgagePayment: monthlyPayment,
          propertyTaxAnnual: propertyTax ? parseFloat(propertyTax) : undefined,
          insuranceAnnual: insurance ? parseFloat(insurance) : undefined,
          hoaMonthly: hoaMonthly ? parseFloat(hoaMonthly) : undefined,
          pmiMonthly: (pmiMonthly && !hidePMI) ? parseFloat(pmiMonthly) : undefined,
          maintenanceRate: maintenanceRate ? parseFloat(maintenanceRate) / 100 : 0.01,
          homeValue: parseFloat(purchasePrice),
        };
      }

      // Affordability params (optional)
      if (showAffordability && grossIncome) {
        const monthlyPayment = 0; // Will be calculated
        inputs.affordability = {
          monthlyMortgagePayment: monthlyPayment,
          grossMonthlyIncome: parseFloat(grossIncome),
          monthlyOtherDebts: otherDebts ? parseFloat(otherDebts) : 0,
        };
      }

      // Calculate results
      let results: any = {};

      if (inputs.mortgage) {
        const mortgageResult = calculateMortgagePayment(inputs.mortgage);
        results.monthlyPayment = mortgageResult.monthlyPayment;
        results.totalInterest = mortgageResult.totalInterest;
        results.totalPaid = mortgageResult.totalPaid;
      }

      if (inputs.totalCost) {
        const totalCostResult = calculateTotalCost(inputs.totalCost);
        results.totalMonthly = totalCostResult.totalMonthly;
      }

      if (inputs.affordability) {
        const affordabilityResult = calculateAffordability(inputs.affordability);
        results.dtiRatio = affordabilityResult.dtiRatio;
        results.canAfford = affordabilityResult.canAfford;
      }

      // Build FinancialData object
      const financialData: FinancialData = {
        mortgage: inputs.mortgage,
        totalCost: inputs.totalCost,
        affordability: inputs.affordability,
        results: {
          ...results,
          calculatedAt: new Date().toISOString()
        }
      };

      // Save to database
      updateFinancialData({ id: propertyId, financialData });

      // Call callback if provided
      if (onCalculate && financialData.results) {
        onCalculate(financialData.results);
      }

    } catch (err: any) {
      setError(err.message || 'Calculation failed');
      console.error('Calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <ScrollView className="flex-1">
      {/* Mortgage Section */}
      <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center mb-4">
          <Home size={20} color="#3b82f6" className="mr-2" />
          <Text className="text-lg font-bold text-gray-900 dark:text-white">
            Mortgage Details
          </Text>
        </View>

        {/* Purchase Price */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Purchase Price
          </Text>
          <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
            <Text className="text-gray-500 dark:text-gray-400 mr-2">$</Text>
            <TextInput
              className="flex-1 text-gray-900 dark:text-white"
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              keyboardType="numeric"
              placeholder="500000"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Down Payment */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Down Payment
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400">
              {downPaymentPercent}%
            </Text>
          </View>
          <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
            <Text className="text-gray-500 dark:text-gray-400 mr-2">$</Text>
            <TextInput
              className="flex-1 text-gray-900 dark:text-white"
              value={downPayment}
              onChangeText={setDownPayment}
              keyboardType="numeric"
              placeholder="100000"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Interest Rate */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Interest Rate (Annual)
          </Text>
          <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
            <TextInput
              className="flex-1 text-gray-900 dark:text-white"
              value={interestRate}
              onChangeText={setInterestRate}
              keyboardType="decimal-pad"
              placeholder="6.0"
              placeholderTextColor="#9ca3af"
            />
            <Text className="text-gray-500 dark:text-gray-400 ml-2">%</Text>
          </View>
        </View>

        {/* Loan Term */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Loan Term
          </Text>
          <View className="flex-row gap-2">
            {[15, 20, 30].map((term) => (
              <Pressable
                key={term}
                onPress={() => setLoanTerm(term)}
                className={`flex-1 py-2 px-4 rounded-lg border-2 ${
                  loanTerm === term
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                }`}
              >
                <Text
                  className={`text-center font-medium ${
                    loanTerm === term
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {term} years
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Additional Costs Section (Collapsible) */}
      <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
        <Pressable
          onPress={() => setShowAdditionalCosts(!showAdditionalCosts)}
          className="flex-row items-center justify-between mb-2"
        >
          <View className="flex-row items-center">
            <DollarSign size={20} color="#3b82f6" className="mr-2" />
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              Additional Costs
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              (Optional)
            </Text>
          </View>
          {showAdditionalCosts ? (
            <ChevronUp size={20} color="#6b7280" />
          ) : (
            <ChevronDown size={20} color="#6b7280" />
          )}
        </Pressable>

        {showAdditionalCosts && (
          <View className="mt-4">
            {/* Property Tax */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Property Tax (Annual)
              </Text>
              <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                <Text className="text-gray-500 dark:text-gray-400 mr-2">$</Text>
                <TextInput
                  className="flex-1 text-gray-900 dark:text-white"
                  value={propertyTax}
                  onChangeText={setPropertyTax}
                  keyboardType="numeric"
                  placeholder="5500"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Insurance */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Insurance (Annual)
              </Text>
              <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                <Text className="text-gray-500 dark:text-gray-400 mr-2">$</Text>
                <TextInput
                  className="flex-1 text-gray-900 dark:text-white"
                  value={insurance}
                  onChangeText={setInsurance}
                  keyboardType="numeric"
                  placeholder="1500"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* HOA Monthly */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                HOA (Monthly)
              </Text>
              <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                <Text className="text-gray-500 dark:text-gray-400 mr-2">$</Text>
                <TextInput
                  className="flex-1 text-gray-900 dark:text-white"
                  value={hoaMonthly}
                  onChangeText={setHoaMonthly}
                  keyboardType="numeric"
                  placeholder="200"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* PMI (hidden if down payment >= 20%) */}
            {!hidePMI && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  PMI (Monthly)
                </Text>
                <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                  <Text className="text-gray-500 dark:text-gray-400 mr-2">$</Text>
                  <TextInput
                    className="flex-1 text-gray-900 dark:text-white"
                    value={pmiMonthly}
                    onChangeText={setPmiMonthly}
                    keyboardType="numeric"
                    placeholder="150"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>
            )}

            {/* Maintenance Rate */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maintenance Rate (% of home value)
              </Text>
              <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                <TextInput
                  className="flex-1 text-gray-900 dark:text-white"
                  value={maintenanceRate}
                  onChangeText={setMaintenanceRate}
                  keyboardType="decimal-pad"
                  placeholder="1.0"
                  placeholderTextColor="#9ca3af"
                />
                <Text className="text-gray-500 dark:text-gray-400 ml-2">%</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Affordability Section (Collapsible) */}
      <View className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
        <Pressable
          onPress={() => setShowAffordability(!showAffordability)}
          className="flex-row items-center justify-between mb-2"
        >
          <View className="flex-row items-center">
            <Calculator size={20} color="#3b82f6" className="mr-2" />
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              Affordability Check
            </Text>
            <Text className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              (Optional)
            </Text>
          </View>
          {showAffordability ? (
            <ChevronUp size={20} color="#6b7280" />
          ) : (
            <ChevronDown size={20} color="#6b7280" />
          )}
        </Pressable>

        {showAffordability && (
          <View className="mt-4">
            {/* Gross Monthly Income */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gross Monthly Income
              </Text>
              <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                <Text className="text-gray-500 dark:text-gray-400 mr-2">$</Text>
                <TextInput
                  className="flex-1 text-gray-900 dark:text-white"
                  value={grossIncome}
                  onChangeText={setGrossIncome}
                  keyboardType="numeric"
                  placeholder="8000"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>

            {/* Monthly Other Debts */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Other Debts
              </Text>
              <View className="flex-row items-center border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                <Text className="text-gray-500 dark:text-gray-400 mr-2">$</Text>
                <TextInput
                  className="flex-1 text-gray-900 dark:text-white"
                  value={otherDebts}
                  onChangeText={setOtherDebts}
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <Text className="text-red-700 dark:text-red-400">{error}</Text>
        </View>
      )}

      {/* Calculate Button */}
      <Pressable
        onPress={handleCalculate}
        disabled={isCalculating}
        className={`py-4 px-6 rounded-lg mb-6 ${
          isCalculating
            ? 'bg-gray-400 dark:bg-gray-600'
            : 'bg-blue-500 dark:bg-blue-600'
        }`}
      >
        <Text className="text-white text-center font-bold text-lg">
          {isCalculating ? 'Calculating...' : 'Calculate'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
