import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useProperties } from '../../lib/query/useProperties';
import { useComparison } from '../../lib/query/useComparison';
import { ComparisonCard } from './_components/ComparisonCard';
import { PropertySelector } from './_components/PropertySelector';
import { SunOrientationView } from './_components/SunOrientationView';
import { FloorPlanViewer } from './_components/FloorPlanViewer';

export default function CompareScreenWeb() {
  const router = useRouter();
  const { properties: propertyLinks } = useProperties();
  const {
    selectedPropertyIds,
    comparisonData,
    addPropertyToComparison,
    removePropertyFromComparison,
    saveSession,
  } = useComparison();

  const [showSelector, setShowSelector] = useState(false);

  const handleToggleProperty = (propertyId: string) => {
    if (selectedPropertyIds.includes(propertyId)) {
      removePropertyFromComparison(propertyId);
    } else {
      addPropertyToComparison(propertyId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 mb-2"
              >
                ← Back
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Property Comparison</h1>
              <p className="text-sm text-gray-600 mt-1">Compare up to 4 properties side by side</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSelector(!showSelector)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                {showSelector ? 'Hide' : 'Select'} Properties ({selectedPropertyIds.length})
              </button>

              {selectedPropertyIds.length > 0 && (
                <button
                  onClick={() => saveSession()}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Save Comparison
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Property Selector Modal */}
      {showSelector && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <PropertySelector
            properties={propertyLinks}
            selectedIds={selectedPropertyIds}
            onToggleProperty={handleToggleProperty}
          />
        </div>
      )}

      {/* Comparison View */}
      {comparisonData.length === 0 ? (
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Properties Selected</h2>
            <p className="text-gray-600 mb-6">
              Select at least 2 properties to start comparing
            </p>
            <button
              onClick={() => setShowSelector(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Select Properties
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Side-by-side comparison cards */}
          <div className="flex gap-6 overflow-x-auto pb-6">
            {comparisonData.map((comparison) => (
              <ComparisonCard
                key={comparison.property.id}
                comparison={comparison}
                highlightBest={true}
              />
            ))}
          </div>

          {/* Additional details section */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {comparisonData.map((comparison) => {
              const propertyData = comparison.property.propertyData as any;
              return (
                <div key={`details-${comparison.property.id}`} className="space-y-4">
                  {/* Sun Orientation */}
                  {propertyData?.sunOrientation && (
                    <SunOrientationView orientation={propertyData.sunOrientation} />
                  )}

                  {/* Floor Plans */}
                  {propertyData?.floorPlans && (
                    <FloorPlanViewer floorPlans={propertyData.floorPlans} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
