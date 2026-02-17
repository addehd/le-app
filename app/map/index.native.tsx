import { View, Text, StyleSheet, ActivityIndicator, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useMapPlaces } from '../../lib/query/useMapPlaces';
import type { PropertyData, Place } from './mapStore';

// Malmö city center coordinates
const MALMO_CENTER = {
  latitude: 55.6050,
  longitude: 13.0038,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Dammfri area in Malmö (near Pildammsparken)
const PROPERTY_LOCATION = {
  latitude: 55.5925,
  longitude: 13.0015,
};

const MOCK_PROPERTY_DATA: PropertyData = {
  address: {
    street: "Roskildevägen 9B",
    area: "Dammfri",
    city: "Malmö"
  },
  property_type: "Lägenhet",
  rooms: {
    total: 4,
    bedrooms: 3
  },
  area: {
    living_space: 106.5,
    unit: "m²"
  },
  status: "Snart till salu",
  floor: {
    current: 2,
    total: 6
  },
  built_year: 1964,
  energy_class: "D",
  monthly_fee: {
    amount: 6992,
    currency: "kr"
  },
  highlights: [
    "Stilfullt renovera fyra med stor gårdsvänd balkong",
    "Stor balkong i sydväst",
    "Smakfullt renoverat",
    "Genomgående planlösning",
    "Smakfull interiör",
    "Kvalitativa materialval",
    "Vinkyl & arbetsbänk i kompositsten",
    "Sociala sällskapsytor",
    "Enhetlig interiör",
    "Genomtänkt förvaring",
    "Badrum & WC",
    "Egen tvättutrustning",
    "Möjlighet till parkeringsplats",
    "Hiss i huset",
    "Övernattningsrum i brf",
    "Attraktiv adress",
    "Inivid Pildammsparken",
    "Promenad till Triangeln",
    "Matbutiker & service",
    "Brett restaurangutbud",
    "Goda kommunikationer"
  ]
};

export default function MapScreen() {
  const { places, isLoading, error, addPlace } = useMapPlaces();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Place | null>(null);
  const insets = useSafeAreaInsets();

  const handleSubmit = () => {
    if (!url.trim()) return;

    setIsLoadingProperty(true);
    setSelectedProperty(null);

    // Simulate loading for 3 seconds
    setTimeout(() => {
      const newProperty: Place = {
        id: `property_${Date.now()}`,
        title: MOCK_PROPERTY_DATA.address.street,
        description: `${MOCK_PROPERTY_DATA.property_type} - ${MOCK_PROPERTY_DATA.rooms.total} rum, ${MOCK_PROPERTY_DATA.area.living_space} ${MOCK_PROPERTY_DATA.area.unit}`,
        latitude: PROPERTY_LOCATION.latitude,
        longitude: PROPERTY_LOCATION.longitude,
        propertyData: MOCK_PROPERTY_DATA,
        url: url,
        created_at: new Date().toISOString(),
      };
      
      addPlace(newProperty);
      setSelectedProperty(newProperty);
      setIsLoadingProperty(false);
      setUrl('');
    }, 3000);
  };

  const handleMarkerPress = (place: Place) => {
    setSelectedProperty(place);
    setIsPanelOpen(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isLoading && places.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading places...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Error Loading Places</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHint}>
            Make sure you&apos;ve configured your Supabase credentials in lib/api/supabaseClient.ts
          </Text>
        </View>
      ) : (
        <>
          <MapView
            style={styles.map}
            initialRegion={MALMO_CENTER}
            provider={PROVIDER_GOOGLE}
            mapType="satellite"
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {places.map((place) => (
              <Marker
                key={place.id}
                coordinate={{
                  latitude: place.latitude,
                  longitude: place.longitude,
                }}
                title={place.title}
                description={place.description}
                pinColor={place.propertyData ? '#10b981' : '#ff0000'}
                onPress={() => handleMarkerPress(place)}
              />
            ))}
          </MapView>
          
        </>
      )}
      
      {!isLoading && !error && places.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No places found</Text>
          <Text style={styles.emptyHint}>
            Make sure the &apos;hem&apos; table exists in your Supabase database
          </Text>
        </View>
      )}

      {/* Add Property Button */}
      <Pressable
        style={[styles.addButton, { top: insets.top + 20 }]}
        onPress={() => setIsPanelOpen(!isPanelOpen)}
      >
        <Text style={styles.addButtonText}>
          {isPanelOpen ? '✕ Close' : '+ Add Property'}
        </Text>
      </Pressable>

      {/* Bottom Panel */}
      {isPanelOpen && (
        <View style={styles.panel}>
          <ScrollView style={styles.panelScroll}>
            <Text style={styles.panelTitle}>Add Property from URL</Text>

            {/* URL Input Form */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="https://google.com"
                placeholderTextColor="#9ca3af"
                editable={!isLoadingProperty}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={[
                  styles.scrapeButton,
                  (isLoadingProperty || !url.trim()) && styles.scrapeButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={isLoadingProperty || !url.trim()}
              >
                <Text style={styles.scrapeButtonText}>
                  {isLoadingProperty ? 'Loading...' : 'Scrape'}
                </Text>
              </Pressable>
            </View>

            {/* Loading State */}
            {isLoadingProperty && (
              <View style={styles.loadingPropertyContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingPropertyText}>Scraping property data...</Text>
              </View>
            )}

            {/* Property Data Display */}
            {selectedProperty?.propertyData && !isLoadingProperty && (
              <View style={styles.propertyCard}>
                <Text style={styles.propertyTitle}>
                  {selectedProperty.propertyData.address.street}, {selectedProperty.propertyData.address.city}
                </Text>

                {selectedProperty.url && (
                  <Text style={styles.propertyUrl} numberOfLines={1}>
                    {selectedProperty.url}
                  </Text>
                )}

                <View style={styles.propertyGrid}>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Property Type</Text>
                    <Text style={styles.propertyValue}>{selectedProperty.propertyData.property_type}</Text>
                  </View>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Rooms</Text>
                    <Text style={styles.propertyValue}>
                      {selectedProperty.propertyData.rooms.total} ({selectedProperty.propertyData.rooms.bedrooms} bedrooms)
                    </Text>
                  </View>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Area</Text>
                    <Text style={styles.propertyValue}>
                      {selectedProperty.propertyData.area.living_space} {selectedProperty.propertyData.area.unit}
                    </Text>
                  </View>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Status</Text>
                    <Text style={styles.propertyValue}>{selectedProperty.propertyData.status}</Text>
                  </View>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Floor</Text>
                    <Text style={styles.propertyValue}>
                      {selectedProperty.propertyData.floor.current} / {selectedProperty.propertyData.floor.total}
                    </Text>
                  </View>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Built Year</Text>
                    <Text style={styles.propertyValue}>{selectedProperty.propertyData.built_year}</Text>
                  </View>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Energy Class</Text>
                    <Text style={styles.propertyValue}>{selectedProperty.propertyData.energy_class}</Text>
                  </View>
                  <View style={styles.propertyItem}>
                    <Text style={styles.propertyLabel}>Monthly Fee</Text>
                    <Text style={styles.propertyValue}>
                      {selectedProperty.propertyData.monthly_fee.amount} {selectedProperty.propertyData.monthly_fee.currency}
                    </Text>
                  </View>
                </View>

                <View style={styles.highlightsContainer}>
                  <Text style={styles.highlightsLabel}>Highlights</Text>
                  {selectedProperty.propertyData.highlights.slice(0, 5).map((highlight, index) => (
                    <Text key={index} style={styles.highlight}>• {highlight}</Text>
                  ))}
                  {selectedProperty.propertyData.highlights.length > 5 && (
                    <Text style={styles.highlightMore}>
                      ...and {selectedProperty.propertyData.highlights.length - 5} more
                    </Text>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    transform: [{ translateY: -40 }],
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  callout: {
    minWidth: 200,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1f2937',
  },
  calloutDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  panelScroll: {
    padding: 24,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  input: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    fontSize: 14,
    color: '#1f2937',
  },
  scrapeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  scrapeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  scrapeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingPropertyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingPropertyText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  propertyCard: {
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
  },
  propertyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  propertyUrl: {
    fontSize: 12,
    color: '#3b82f6',
    marginBottom: 16,
  },
  propertyGrid: {
    marginBottom: 16,
  },
  propertyItem: {
    marginBottom: 12,
  },
  propertyLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  highlightsContainer: {
    marginTop: 8,
  },
  highlightsLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  highlight: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  highlightMore: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
});
