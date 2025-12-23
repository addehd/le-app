import { useState } from 'react';

interface PropertyData {
  address: {
    street: string;
    area: string;
    city: string;
  };
  property_type: string;
  rooms: {
    total: number;
    bedrooms: number;
  };
  area: {
    living_space: number;
    unit: string;
  };
  status: string;
  floor: {
    current: number;
    total: number;
  };
  built_year: number;
  energy_class: string;
  monthly_fee: {
    amount: number;
    currency: string;
  };
  highlights: string[];
}

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
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setPropertyData(null);

    // Simulate loading for 3 seconds
    setTimeout(() => {
      setPropertyData(MOCK_PROPERTY_DATA);
      setIsLoading(false);
    }, 3000);
  };

  return (
    <div style={{ width: '100%', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', position: 'relative' }}>
      {/* Map iframe */}
      <iframe
        src="https://www.rikuy.one/"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0,
          display: 'block',
        }}
        title="Rikuy Map - Valle Sagrado"
        allow="geolocation"
      />

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
            Add Property from URL
          </h2>

          {/* URL Input Form */}
          <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://google.com"
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
                {isLoading ? 'Loading...' : 'Scrape'}
              </button>
            </div>
          </form>

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
              <p style={{ marginTop: '16px', color: '#6b7280' }}>Scraping property data...</p>
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

          {/* Property Data Display */}
          {propertyData && !isLoading && (
            <div style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937' }}>
                {propertyData.address.street}, {propertyData.address.city}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Property Type</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{propertyData.property_type}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Rooms</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1f2937' }}>
                    {propertyData.rooms.total} ({propertyData.rooms.bedrooms} bedrooms)
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Area</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1f2937' }}>
                    {propertyData.area.living_space} {propertyData.area.unit}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Status</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{propertyData.status}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Floor</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1f2937' }}>
                    {propertyData.floor.current} / {propertyData.floor.total}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Built Year</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{propertyData.built_year}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Energy Class</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{propertyData.energy_class}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Monthly Fee</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1f2937' }}>
                    {propertyData.monthly_fee.amount} {propertyData.monthly_fee.currency}
                  </p>
                </div>
              </div>

              <div>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Highlights</p>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#1f2937' }}>
                  {propertyData.highlights.slice(0, 5).map((highlight, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{highlight}</li>
                  ))}
                  {propertyData.highlights.length > 5 && (
                    <li style={{ marginBottom: '4px', color: '#6b7280', fontStyle: 'italic' }}>
                      ...and {propertyData.highlights.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
