import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../../lib/query/useAuth';
import { useProperties } from '../../lib/query/useProperties';
import { hasValidCoordinates } from '../../lib/utils/coordinates';

// Valle Sagrado, Peru coordinates (Cusco region)
const INITIAL_REGION = {
  longitude: -71.9589,
  latitude: -13.3048,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

export default function MapTab() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [url, setUrl] = useState('');

  const { user } = useAuth();
  const {
    properties: propertyLinks,
    addProperty: addPropertyLink,
    deleteProperty: removePropertyLink,
    isLoading,
  } = useProperties();

  const handleSubmit = async () => {
    if (!url.trim()) return;

    try {
      const sharedBy = user?.email || 'anon';
      const lat = Math.random() * 180 - 90;
      const lng = Math.random() * 360 - 180;
      addPropertyLink({
        url,
        sharedBy,
        latitude: lat,
        longitude: lng,
      });
      setUrl('');
    } catch (error) {
      console.error('Error adding link:', error);
    }
  };

  // Filter links with valid coordinates to prevent crashes
  const validPropertyLinks = propertyLinks.filter(hasValidCoordinates);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={INITIAL_REGION}
        provider={PROVIDER_GOOGLE}
      >
        {validPropertyLinks.map((link) => (
          <Marker
            key={link.id}
            coordinate={{
              latitude: link.latitude,
              longitude: link.longitude,
            }}
            title={link.title || 'Property'}
            description={link.url}
            pinColor="#3b82f6"
          />
        ))}
      </MapView>

      {/* Add Property Button */}
      <Pressable
        style={styles.addButton}
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
            <Text style={styles.panelTitle}>Add Property Link</Text>

            {/* URL Input Form */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={url}
                onChangeText={setUrl}
                placeholder="https://property-site.com"
                placeholderTextColor="#9ca3af"
                editable={!isLoading}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={[
                  styles.submitButton,
                  (isLoading || !url.trim()) && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={isLoading || !url.trim()}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Loading...' : 'Add'}
                </Text>
              </Pressable>
            </View>

            {!user && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  💡 Links are saved anonymously. Sign in to save with your account.
                </Text>
              </View>
            )}

            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Fetching link data...</Text>
              </View>
            )}

            {!isLoading && (
              <View>
                <Text style={styles.sectionTitle}>
                  Property Links ({propertyLinks.length})
                </Text>

                {propertyLinks.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No property links added yet</Text>
                  </View>
                ) : (
                  <View style={styles.linksList}>
                    {propertyLinks.map((link) => (
                      <View key={link.id} style={styles.linkItem}>
                        <View style={styles.linkContent}>
                          <Text style={styles.linkTitle}>{link.title || 'Link'}</Text>
                          <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
                        </View>
                        <Pressable
                          style={styles.removeButton}
                          onPress={() => removePropertyLink(link.id)}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
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
  addButton: {
    position: 'absolute',
    top: 60,
    left: 20,
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
    maxHeight: '50%',
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
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoText: {
    color: '#1e40af',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  emptyContainer: {
    backgroundColor: '#f9fafb',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
  linksList: {
    gap: 12,
  },
  linkItem: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  linkUrl: {
    fontSize: 12,
    color: '#6b7280',
  },
  removeButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
