import { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import { useAuthStore } from '../../lib/store/authStore';
import { usePropertyLinkStore } from '../../lib/store/propertyLinkStore';
import { hasValidCoordinates } from '../../lib/utils/coordinates';
import 'maplibre-gl/dist/maplibre-gl.css';

// Valle Sagrado, Peru coordinates (Cusco region)
const INITIAL_VIEW_STATE = {
  longitude: -71.9589,
  latitude: -13.3048,
  zoom: 12
};

export default function MapScreen() {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [url, setUrl] = useState('');
  const { user, initialize } = useAuthStore();
  const {
    propertyLinks,
    addPropertyLink,
    removePropertyLink,
    isLoading: isPropertyLoading,
    loadFromDatabase
  } = usePropertyLinkStore();

  useEffect(() => {
    initialize();
    loadFromDatabase(); // Load property links from Supabase
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      const sharedBy = user?.email || 'anon';
      const lat = Math.random() * 180 - 90;
      const lng = Math.random() * 360 - 180;

      // Add property link with property-specific data extraction
      await addPropertyLink(url, sharedBy, lat, lng);
      setUrl('');
    } catch (error) {
      console.error('Error adding link:', error);
    }
  };

  const isLoading = isPropertyLoading;
  const currentLinks = propertyLinks;

  // Filter links with valid coordinates to prevent type errors
  const validPropertyLinks = propertyLinks.filter(hasValidCoordinates) as Array<typeof propertyLinks[0] & { latitude: number; longitude: number }>;

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', position: 'relative' }}>
      {/* MapLibre Map */}
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
      >
        {/* Markers for property links (blue) */}
        {validPropertyLinks.map((link) => (
          <Marker
            key={`property-${link.id}`}
            longitude={link.longitude}
            latitude={link.latitude}
            anchor="bottom"
          >
            <div
              style={{
                backgroundColor: '#3b82f6',
                borderRadius: '50% 50% 50% 0',
                width: '30px',
                height: '30px',
                transform: 'rotate(-45deg)',
                border: '3px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                cursor: 'pointer',
              }}
              title={link.title || link.url}
            />
          </Marker>
        ))}

        {/* Markers for shared links (green) */}
      </Map>

      {/* Add Property Button */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
        }}
      >
        {isPanelOpen ? '✕ Close' : '+ Add Property'}
      </button>

      {/* Bottom Panel */}
      {isPanelOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
            padding: '24px',
            maxHeight: '70vh',
            overflowY: 'auto',
            zIndex: 999,
          }}
        >
          <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
            Add Property Link
          </h2>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://property-site.com"
                style={{
                  flex: 1,
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !url.trim()}
                style={{
                  backgroundColor: isLoading || !url.trim() ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isLoading || !url.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? 'Loading...' : 'Add'}
              </button>
            </div>
          </form>

          {/* Optional Sign-In Info */}
          {!user && (
            <div style={{
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px'
            }}>
              <p style={{ margin: 0, color: '#1e40af', fontSize: '14px' }}>
                💡 Links are saved anonymously. <a href="/auth" style={{ textDecoration: 'underline', color: '#1e40af' }}>Sign in</a> to save with your account.
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid #e5e7eb',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  margin: '0 auto',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <p style={{ marginTop: '16px', color: '#6b7280' }}>
                Fetching link data...
              </p>
              <style>
                {`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>
            </div>
          )}

          {/* Links Display */}
          {!isLoading && (
            <div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                Property Links ({currentLinks.length})
              </h3>

              {currentLinks.length === 0 ? (
                <div style={{
                  backgroundColor: '#f9fafb',
                  padding: '40px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}>
                  <p style={{ margin: 0, color: '#6b7280' }}>
                    No property links added yet
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentLinks.map((link) => {
                    const isPropertyLink = 'propertyData' in link;
                    const propertyData = isPropertyLink ? (link as any).propertyData : null;

                    return (
                      <div key={link.id} style={{
                        backgroundColor: '#f9fafb',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                          {link.image && (
                            <img
                              src={link.image}
                              alt={link.title || 'Property image'}
                              style={{
                                width: '120px',
                                height: '80px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                flexShrink: 0
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
                              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>
                                {link.title || 'Property Link'}
                              </h4>
                              <button
                                onClick={() => removePropertyLink(link.id)}
                                style={{
                                  backgroundColor: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  marginLeft: '12px',
                                  flexShrink: 0
                                }}
                              >
                                Remove
                              </button>
                            </div>

                            {/* Property-specific metadata */}
                            {isPropertyLink && propertyData && (
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '6px',
                                marginBottom: '8px',
                                padding: '8px',
                                backgroundColor: '#eff6ff',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                {propertyData.price && (
                                  <div>
                                    <strong>Price:</strong> {propertyData.price.toLocaleString()} {propertyData.currency || 'SEK'}
                                  </div>
                                )}
                                {propertyData.bedrooms && (
                                  <div>
                                    <strong>Bedrooms:</strong> {propertyData.bedrooms}
                                  </div>
                                )}
                                {propertyData.bathrooms && (
                                  <div>
                                    <strong>Bathrooms:</strong> {propertyData.bathrooms}
                                  </div>
                                )}
                                {propertyData.area && (
                                  <div>
                                    <strong>Area:</strong> {propertyData.area} {propertyData.areaUnit || 'm²'}
                                  </div>
                                )}
                                {propertyData.propertyType && (
                                  <div>
                                    <strong>Type:</strong> {propertyData.propertyType}
                                  </div>
                                )}
                                {propertyData.address && (
                                  <div style={{ gridColumn: '1 / -1' }}>
                                    <strong>Address:</strong> {propertyData.address}
                                  </div>
                                )}
                                {propertyData.energyClass && (
                                  <div>
                                    <strong>Energy:</strong> {propertyData.energyClass}
                                  </div>
                                )}
                                {propertyData.builtYear && (
                                  <div>
                                    <strong>Built:</strong> {propertyData.builtYear}
                                  </div>
                                )}
                              </div>
                            )}

                            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>
                              {link.description}
                            </p>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: '12px',
                                color: '#3b82f6',
                                textDecoration: 'none',
                                wordBreak: 'break-all'
                              }}
                            >
                              {link.url}
                            </a>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#9ca3af' }}>
                          <span>Shared by: {link.sharedBy}</span>
                          <span>{new Date(link.sharedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
