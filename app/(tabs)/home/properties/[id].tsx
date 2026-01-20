import { View, Text, ScrollView, Pressable, Image, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePropertyLinkStore } from '../../../../lib/store/propertyLinkStore';
import { FinancialCalculatorForm } from '../../../../components/financial/FinancialCalculatorForm';
import { FinancialResults } from '../../../../components/financial/FinancialResults';

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { propertyLinks, getFinancialResults } = usePropertyLinkStore();

  // Find the property
  const property = propertyLinks.find(p => p.id === id);

  // Get financial results
  const financialResults = property?.financialData?.results || null;

  if (!property) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Property Not Found
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            The property you're looking for doesn't exist or has been removed.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return null;
    return `${price.toLocaleString('sv-SE')} ${currency || 'kr'}`;
  };

  if (Platform.OS === 'web') {
    return (
      <div className="h-screen bg-gray-100 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Back to Properties
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {property.title || 'Property Details'}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Property Info Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            {/* Property Image */}
            {property.image && (
              <div className="w-full h-64 bg-gray-200">
                <img
                  src={property.image}
                  alt={property.title || 'Property'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6">
              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {property.title || 'Property'}
              </h2>

              {/* Description */}
              {property.description && (
                <p className="text-gray-600 mb-4">
                  {property.description}
                </p>
              )}

              {/* Property Data */}
              {property.propertyData && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {property.propertyData.price && (
                    <div>
                      <Text className="text-sm text-gray-500">Price</Text>
                      <Text className="text-lg font-semibold text-gray-900">
                        {formatPrice(property.propertyData.price, property.propertyData.currency)}
                      </Text>
                    </div>
                  )}

                  {property.propertyData.address && (
                    <div>
                      <Text className="text-sm text-gray-500">Address</Text>
                      <Text className="text-base text-gray-900">
                        {property.propertyData.address}
                        {property.propertyData.city && `, ${property.propertyData.city}`}
                      </Text>
                    </div>
                  )}

                  {property.propertyData.area && (
                    <div>
                      <Text className="text-sm text-gray-500">Area</Text>
                      <Text className="text-base text-gray-900">
                        {property.propertyData.area} {property.propertyData.areaUnit || 'm²'}
                      </Text>
                    </div>
                  )}

                  {property.propertyData.bedrooms && (
                    <div>
                      <Text className="text-sm text-gray-500">Bedrooms</Text>
                      <Text className="text-base text-gray-900">
                        {property.propertyData.bedrooms}
                      </Text>
                    </div>
                  )}
                </div>
              )}

              {/* View Listing Button */}
              <button
                onClick={() => Linking.openURL(property.url)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                View Original Listing
              </button>
            </div>
          </div>

          {/* Financial Calculator Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Financial Calculator
            </h2>

            <FinancialCalculatorForm
              propertyId={id}
              initialData={property.financialData}
              onCalculate={(results) => {
                console.log('Calculation complete:', results);
              }}
            />
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Calculation Results
            </h2>

            <FinancialResults
              results={financialResults}
              mortgage={property.financialData?.mortgage}
              totalCost={property.financialData?.totalCost}
              affordability={property.financialData?.affordability}
            />
          </div>
        </div>
      </div>
    );
  }

  // Native version
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-6 py-4">
          <Pressable onPress={() => router.back()} className="mb-2">
            <Text className="text-gray-600">← Back to Properties</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">
            {property.title || 'Property Details'}
          </Text>
        </View>

        {/* Content */}
        <View className="px-6 py-4">
          {/* Property Info Card */}
          <View className="bg-white rounded-xl shadow-md overflow-hidden mb-4">
            {/* Property Image */}
            {property.image && (
              <View className="w-full h-48 bg-gray-200">
                <Image
                  source={{ uri: property.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
            )}

            <View className="p-4">
              {/* Title */}
              <Text className="text-xl font-bold text-gray-900 mb-2">
                {property.title || 'Property'}
              </Text>

              {/* Description */}
              {property.description && (
                <Text className="text-gray-600 mb-4">
                  {property.description}
                </Text>
              )}

              {/* Property Data */}
              {property.propertyData && (
                <View className="space-y-3 mb-4">
                  {property.propertyData.price && (
                    <View>
                      <Text className="text-sm text-gray-500">Price</Text>
                      <Text className="text-lg font-semibold text-gray-900">
                        {formatPrice(property.propertyData.price, property.propertyData.currency)}
                      </Text>
                    </View>
                  )}

                  {property.propertyData.address && (
                    <View>
                      <Text className="text-sm text-gray-500">Address</Text>
                      <Text className="text-base text-gray-900">
                        {property.propertyData.address}
                        {property.propertyData.city && `, ${property.propertyData.city}`}
                      </Text>
                    </View>
                  )}

                  {property.propertyData.area && (
                    <View>
                      <Text className="text-sm text-gray-500">Area</Text>
                      <Text className="text-base text-gray-900">
                        {property.propertyData.area} {property.propertyData.areaUnit || 'm²'}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* View Listing Button */}
              <Pressable
                onPress={() => Linking.openURL(property.url)}
                className="bg-blue-600 px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold text-center">
                  View Original Listing
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Financial Calculator Section */}
          <View className="bg-white rounded-xl shadow-md p-4 mb-4">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Financial Calculator
            </Text>

            <FinancialCalculatorForm
              propertyId={id}
              initialData={property.financialData}
              onCalculate={(results) => {
                console.log('Calculation complete:', results);
              }}
            />
          </View>

          {/* Results Section */}
          <View className="bg-white rounded-xl shadow-md p-4 mb-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Calculation Results
            </Text>

            <FinancialResults
              results={financialResults}
              mortgage={property.financialData?.mortgage}
              totalCost={property.financialData?.totalCost}
              affordability={property.financialData?.affordability}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
