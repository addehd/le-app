import React, { useState } from 'react';
import { Platform, ScrollView, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProperties } from '../../lib/query/useProperties';
import { useComparison } from '../../lib/query/useComparison';

export default function CompareTab() {
  const { properties } = useProperties();
  const {
    selectedPropertyIds,
    comparisonData,
    addPropertyToComparison,
    removePropertyFromComparison,
  } = useComparison();

  const [showSelector, setShowSelector] = useState(false);

  const handleToggleProperty = (propertyId: string) => {
    if (selectedPropertyIds.includes(propertyId)) {
      removePropertyFromComparison(propertyId);
    } else {
      addPropertyToComparison(propertyId);
    }
  };

  // Get property display data
  const getPropertyDisplay = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    return {
      address: property?.propertyData?.address || property?.title || 'Unknown',
      price: property?.propertyData?.price,
    };
  };

  if (Platform.OS === 'web') {
    return (
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Jämför Bostäder</h1>
                <p className="text-sm text-gray-600 mt-1">Jämför upp till 4 bostäder sida vid sida</p>
              </div>

              <button
                onClick={() => setShowSelector(!showSelector)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {showSelector ? 'Dölj' : 'Välj'} Bostäder ({selectedPropertyIds.length})
              </button>
            </div>
          </div>
        </div>

        {/* Property Selector */}
        {showSelector && (
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Välj bostäder att jämföra</h2>
              {properties.length === 0 ? (
                <p className="text-gray-500">Inga bostäder sparade ännu. Lägg till bostäder i Bostadslistan först.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {properties.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => handleToggleProperty(property.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        selectedPropertyIds.includes(property.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <p className="font-medium text-sm truncate">{property.propertyData?.address || property.title || 'Okänd adress'}</p>
                      <p className="text-xs text-gray-500">{property.propertyData?.price ? `${property.propertyData.price.toLocaleString('sv-SE')} kr` : ''}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comparison View */}
        {comparisonData.length === 0 ? (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🏠</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Inga bostäder valda</h2>
              <p className="text-gray-600 mb-6">
                Välj minst 2 bostäder för att börja jämföra
              </p>
              <button
                onClick={() => setShowSelector(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Välj Bostäder
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex gap-6 overflow-x-auto pb-6">
              {comparisonData.map((comparison) => (
                <div key={comparison.property.id} className="min-w-[300px] bg-white rounded-xl shadow-lg p-6">
                  <h3 className="font-bold text-lg mb-2">{comparison.property.propertyData?.address || comparison.property.title || 'Okänd adress'}</h3>
                  <p className="text-2xl font-bold text-blue-600 mb-4">
                    {comparison.property.propertyData?.price?.toLocaleString('sv-SE')} kr
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Rum</span>
                      <span className="font-medium">{comparison.property.propertyData?.bedrooms || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Storlek</span>
                      <span className="font-medium">{comparison.property.propertyData?.area ? `${comparison.property.propertyData.area} m²` : '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avgift</span>
                      <span className="font-medium">{comparison.property.propertyData?.monthlyFee ? `${comparison.property.propertyData.monthlyFee} kr/mån` : '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Jämför Bostäder</Text>
        <Text className="text-sm text-gray-600 mt-1">Jämför bostäder sida vid sida</Text>
        <Pressable
          onPress={() => setShowSelector(!showSelector)}
          className="mt-3 bg-blue-600 py-2 px-4 rounded-lg self-start"
        >
          <Text className="text-white font-semibold">
            {showSelector ? 'Dölj' : 'Välj'} Bostäder ({selectedPropertyIds.length})
          </Text>
        </Pressable>
      </View>

      {/* Property Selector */}
      {showSelector && (
        <View className="bg-white mx-4 mt-4 p-4 rounded-xl shadow-lg">
          <Text className="text-lg font-semibold mb-3">Välj bostäder</Text>
          {properties.length === 0 ? (
            <Text className="text-gray-500">Inga bostäder sparade ännu.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {properties.map((property) => (
                <Pressable
                  key={property.id}
                  onPress={() => handleToggleProperty(property.id)}
                  className={`p-3 rounded-lg border-2 ${
                    selectedPropertyIds.includes(property.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <Text className="font-medium text-sm">{property.propertyData?.address || property.title || 'Okänd'}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Content */}
      {comparisonData.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-6xl mb-4">🏠</Text>
          <Text className="text-xl font-bold text-gray-900 mb-2 text-center">
            Inga bostäder valda
          </Text>
          <Text className="text-gray-600 text-center">
            Välj minst 2 bostäder för att jämföra
          </Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1">
          <View className="flex-row gap-4 p-6">
            {comparisonData.map((comparison) => (
              <View key={comparison.property.id} className="w-72 bg-white rounded-xl shadow-lg p-4">
                <Text className="font-bold text-lg mb-2">{comparison.property.propertyData?.address || comparison.property.title || 'Okänd'}</Text>
                <Text className="text-xl font-bold text-blue-600 mb-3">
                  {comparison.property.propertyData?.price?.toLocaleString('sv-SE')} kr
                </Text>
                <View className="space-y-2">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Rum</Text>
                    <Text className="font-medium">{comparison.property.propertyData?.bedrooms || '-'}</Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Storlek</Text>
                    <Text className="font-medium">{comparison.property.propertyData?.area ? `${comparison.property.propertyData.area} m²` : '-'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
