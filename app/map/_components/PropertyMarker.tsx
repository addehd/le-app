import { useState } from 'react';
import { Marker, Popup } from 'react-map-gl/maplibre';
import { Property } from '../../../lib/api/properties-table';

interface PropertyMarkerProps {
  property: Property;
}

export function PropertyMarker({ property }: PropertyMarkerProps) {
  const [showPopup, setShowPopup] = useState(false);

  if (!property.latitude || !property.longitude) {
    return null;
  }

  const formatPrice = (price?: number) => {
    if (!price) return 'Price not available';
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <Marker
        longitude={property.longitude}
        latitude={property.latitude}
        anchor="center"
      >
        <div
          onClick={() => setShowPopup(true)}
          style={{
            cursor: 'pointer',
            position: 'relative',
          }}
          title={property.title || 'Property'}
        >
          {/* Image thumbnail marker */}
          {property.imageUrl ? (
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                border: '3px solid #10b981',
                boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                overflow: 'hidden',
                backgroundColor: '#fff',
              }}
            >
              <img
                src={property.imageUrl}
                alt={property.title || 'Property'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  // Fallback to colored pin if image fails
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : (
            // Fallback to colored pin marker if no image
            <div
              style={{
                backgroundColor: '#10b981',
                borderRadius: '50% 50% 50% 0',
                width: '30px',
                height: '30px',
                transform: 'rotate(-45deg)',
                border: '3px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
          )}

          {/* Small label below marker */}
          {property.price && (
            <div
              style={{
                position: 'absolute',
                top: '55px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#10b981',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              }}
            >
              {formatPrice(property.price)}
            </div>
          )}
        </div>
      </Marker>

      {showPopup && (
        <Popup
          longitude={property.longitude}
          latitude={property.latitude}
          anchor="bottom"
          onClose={() => setShowPopup(false)}
          closeOnClick={false}
          maxWidth="320px"
        >
          <div style={{ padding: '8px', maxWidth: '300px' }}>
            {/* Property Image */}
            {property.imageUrl && (
              <img
                src={property.imageUrl}
                alt={property.title || 'Property'}
                style={{
                  width: '100%',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  marginBottom: '8px',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}

            {/* Title */}
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
              {property.title || 'Property'}
            </h3>

            {/* Price */}
            {property.price && (
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>
                {formatPrice(property.price)}
              </div>
            )}

            {/* Key details grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px',
                marginBottom: '8px',
                fontSize: '13px',
                color: '#6b7280',
              }}
            >
              {property.rooms && (
                <div>
                  <strong>Rooms:</strong> {property.rooms}
                </div>
              )}
              {property.areaSqm && (
                <div>
                  <strong>Area:</strong> {property.areaSqm} m²
                </div>
              )}
              {property.propertyType && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Type:</strong> {property.propertyType}
                </div>
              )}
              {property.monthlyFee && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Monthly fee:</strong> {formatPrice(property.monthlyFee)}
                </div>
              )}
            </div>

            {/* Address */}
            {property.address && (
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                📍 {property.address}
                {property.municipality && `, ${property.municipality}`}
              </div>
            )}

            {/* Description */}
            {property.description && (
              <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#4b5563', lineHeight: '1.4' }}>
                {property.description}
              </p>
            )}

            {/* View link */}
            {property.url && (
              <a
                href={property.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: '8px',
                  padding: '6px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                View Listing →
              </a>
            )}
          </div>
        </Popup>
      )}
    </>
  );
}
