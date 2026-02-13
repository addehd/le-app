import { useState, useEffect } from 'react';
import { Platform, View, Text, Pressable, ScrollView, TextInput, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePropertyLinkStore, PropertyLink } from '../../../../lib/store/propertyLinkStore';
import { useAuthStore } from '../../../../lib/store/authStore';
import { fetchOGData, fetchGeocodeData } from './api';

function PropertyCard({ property, onRemove }: { property: PropertyLink; onRemove: () => void }) {
  const router = useRouter();

  const handlePress = () => {
    // Navigate to property detail page
    router.push(`/home/properties/${property.id}`);
  };

  const handleOpenListing = (e: any) => {
    e.stopPropagation();
    Linking.openURL(property.url);
  };

  const formatPrice = (price?: number, currency?: string) => {
    if (!price) return null;
    return `${price.toLocaleString('sv-SE')} ${currency || 'kr'}`;
  };

  if (Platform.OS === 'web') {
    return (
      <div
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={handlePress}
      >
        <div className="flex">
          {/* Image */}
          <div className="w-40 h-32 flex-shrink-0 bg-gray-200">
            {property.image ? (
              <img
                src={property.image}
                alt={property.title || 'Property'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                🏠
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg line-clamp-1">
                {property.title || 'Property'}
              </h3>
              {property.description && (
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {property.description}
                </p>
              )}
              {property.propertyData?.address && (
                <p className="text-gray-500 text-xs mt-1">
                  📍 {property.propertyData.address}
                  {property.propertyData.city && `, ${property.propertyData.city}`}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-2">
              {property.propertyData?.price && (
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                  {formatPrice(property.propertyData.price, property.propertyData.currency)}
                </span>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {property.propertyData?.area && (
                  <span>{property.propertyData.area} {property.propertyData.areaUnit || 'm²'}</span>
                )}
                {property.propertyData?.bedrooms && (
                  <span>{property.propertyData.bedrooms} rum</span>
                )}
              </div>
            </div>
          </div>

          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-2 text-gray-400 hover:text-red-500 self-start m-2"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Native version
  return (
    <Pressable
      onPress={handlePress}
      className="bg-white rounded-xl shadow-md overflow-hidden mb-3"
    >
      <View className="flex-row">
        {/* Image */}
        <View className="w-32 h-28 bg-gray-200">
          {property.image ? (
            <Image
              source={{ uri: property.image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Text className="text-4xl">🏠</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 p-3 justify-between">
          <View>
            <Text className="font-semibold text-gray-900 text-base" numberOfLines={1}>
              {property.title || 'Property'}
            </Text>
            {property.description && (
              <Text className="text-gray-600 text-sm mt-1" numberOfLines={2}>
                {property.description}
              </Text>
            )}
          </View>

          <View className="flex-row items-center justify-between mt-2">
            {property.propertyData?.price && (
              <View className="bg-blue-100 px-2 py-1 rounded-full">
                <Text className="text-blue-800 text-xs font-semibold">
                  {formatPrice(property.propertyData.price, property.propertyData.currency)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Remove button */}
        <Pressable
          onPress={onRemove}
          className="p-2 self-start"
        >
          <Text className="text-gray-400 text-lg">✕</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function LoadingCard() {
  if (Platform.OS === 'web') {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
        <div className="flex">
          <div className="w-40 h-32 bg-gray-300" />
          <div className="flex-1 p-4 space-y-3">
            <div className="h-5 bg-gray-300 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <View className="bg-white rounded-xl shadow-md overflow-hidden mb-3">
      <View className="flex-row">
        <View className="w-32 h-28 bg-gray-300" />
        <View className="flex-1 p-3 gap-2">
          <View className="h-4 bg-gray-300 rounded w-3/4" />
          <View className="h-3 bg-gray-200 rounded w-full" />
          <View className="h-3 bg-gray-200 rounded w-1/2" />
        </View>
      </View>
    </View>
  );
}

export default function PropertiesScreen() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const {
    propertyLinks,
    savePropertyLink,
    removePropertyLink,
    loadFromDatabase,
  } = usePropertyLinkStore();

  useEffect(() => {
    loadFromDatabase();
  }, []);

  const handleAddProperty = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch OG data and geocoding data in parallel
      const [ogResult, geocodeResult] = await Promise.allSettled([
        fetchOGData(url),
        fetchGeocodeData(url),
      ]);

      // OG data is critical - throw if it fails
      if (ogResult.status === 'rejected') {
        throw new Error('Failed to fetch property data');
      }
      const ogData = ogResult.value;

      // Geocode data is optional - just log if it fails
      const geocodeData = geocodeResult.status === 'fulfilled' ? geocodeResult.value : null;
      
      if (geocodeResult.status === 'rejected') {
        console.warn('Geocoding failed, continuing without location data:', geocodeResult.reason);
      }

      console.log('OG data:', ogData);
      console.log('Geocode data:', geocodeData);
      
      // Merge location data: prefer geocode over OG metadata
      const latitude = geocodeData?.latitude ?? ogData.latitude;
      const longitude = geocodeData?.longitude ?? ogData.longitude;
      const address = geocodeData?.address ?? ogData.address;
      const city = geocodeData?.city ?? ogData.city;
      
      // Save to store with merged data
      const sharedBy = user?.email || 'anon';
      await savePropertyLink({
        url,
        title: ogData.title,
        description: ogData.description,
        image: ogData.image,
        sharedBy,
        latitude,
        longitude,
        propertyData: {
          price: ogData.price,
          currency: ogData.currency,
          address,
          city,
          postalCode: geocodeData?.postalCode ?? ogData.postalCode,
          country: geocodeData?.country ?? ogData.country,
          area: ogData.area,
          areaUnit: ogData.areaUnit,
          bedrooms: ogData.bedrooms,
          bathrooms: ogData.bathrooms,
        },
      });
      
      setUrl('');
    } catch (err: any) {
      console.error('Error adding property:', err);
      setError(err.message || 'Failed to add property');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async () => {
    if (Platform.OS === 'web') {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.startsWith('http')) {
          setUrl(text);
        }
      } catch (err) {
        console.error('Failed to read clipboard:', err);
      }
    }
  };

  if (Platform.OS === 'web') {
    return (
      <div className="h-screen bg-gray-100 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-6 py-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mb-2"
            >
              ← Tillbaka
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Bostadslista</h1>
            <p className="text-sm text-gray-600 mt-1">
              Klistra in länkar till bostäder ni är intresserade av
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* URL Input */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lägg till bostad
            </label>
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddProperty()}
                placeholder="https://www.hemnet.se/bostad/..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handlePaste}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Klistra in
              </button>
              <button
                onClick={handleAddProperty}
                disabled={isLoading || !url.trim()}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isLoading || !url.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isLoading ? 'Laddar...' : 'Lägg till'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Loading state */}
          {isLoading && <LoadingCard />}

          {/* Property List */}
          <div className="space-y-4">
            {propertyLinks.length === 0 && !isLoading ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🏠</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Inga bostäder än
                </h2>
                <p className="text-gray-600">
                  Klistra in en länk från Hemnet, Booli eller annan bostadssajt för att komma igång
                </p>
              </div>
            ) : (
              propertyLinks.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onRemove={() => removePropertyLink(property.id)}
                />
              ))
            )}
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
            <Text className="text-gray-600">← Tillbaka</Text>
          </Pressable>
          <Text className="text-2xl font-bold text-gray-900">Bostadslista</Text>
          <Text className="text-sm text-gray-600 mt-1">
            Klistra in länkar till bostäder ni är intresserade av
          </Text>
        </View>

        {/* Content */}
        <View className="px-6 py-4">
          {/* URL Input */}
          <View className="bg-white rounded-xl shadow-md p-4 mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Lägg till bostad
            </Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              placeholder="https://www.hemnet.se/bostad/..."
              className="px-4 py-3 border border-gray-300 rounded-lg mb-3"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!isLoading}
            />
            <Pressable
              onPress={handleAddProperty}
              disabled={isLoading || !url.trim()}
              className={`py-3 rounded-lg ${
                isLoading || !url.trim() ? 'bg-gray-300' : 'bg-blue-600'
              }`}
            >
              <Text className={`text-center font-semibold ${
                isLoading || !url.trim() ? 'text-gray-500' : 'text-white'
              }`}>
                {isLoading ? 'Laddar...' : 'Lägg till'}
              </Text>
            </Pressable>
            {error && (
              <Text className="mt-2 text-sm text-red-600">{error}</Text>
            )}
          </View>

          {/* Loading state */}
          {isLoading && <LoadingCard />}

          {/* Property List */}
          {propertyLinks.length === 0 && !isLoading ? (
            <View className="bg-white rounded-xl shadow-md p-8 items-center">
              <Text className="text-5xl mb-4">🏠</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
                Inga bostäder än
              </Text>
              <Text className="text-gray-600 text-center">
                Klistra in en länk från Hemnet, Booli eller annan bostadssajt
              </Text>
            </View>
          ) : (
            propertyLinks.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onRemove={() => removePropertyLink(property.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
