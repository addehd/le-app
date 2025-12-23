import React, { useState } from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DraggableButton } from './DraggableButton';
import { DraggableButtonWeb } from './DraggableButtonWeb';
import { DraggableButtonNative } from './DraggableButtonNative';

export const DraggableExamples: React.FC = () => {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({
    basic1: { x: 0, y: 0 },
    basic2: { x: 0, y: 0 },
    basic3: { x: 0, y: 0 },
    native1: { x: 0, y: 0 },
    native2: { x: 0, y: 0 },
    web1: { x: 0, y: 0 },
    web2: { x: 0, y: 0 },
  });

  const handlePositionChange = (id: string, x: number, y: number) => {
    setPositions(prev => ({ ...prev, [id]: { x, y } }));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-4 py-6 bg-white shadow-sm">
          <Text className="text-3xl font-bold text-gray-900">
            Draggable Examples
          </Text>
          <Text className="text-sm text-gray-600 mt-2">
            Platform: {Platform.OS === 'web' ? '🌐 Web' : Platform.OS === 'ios' ? '📱 iOS' : '🤖 Android'}
          </Text>
        </View>

        {/* Universal Examples (Work on all platforms) */}
        <View className="px-4 py-6">
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Universal Examples
          </Text>
          <Text className="text-sm text-gray-600 mb-4">
            These work on iOS, Android, and Web
          </Text>

          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <Text className="text-base font-semibold text-gray-800 mb-3">
              Basic Draggable Buttons
            </Text>
            
            <View className="mb-6 bg-gray-100 rounded-lg p-4 min-h-[200px]">
              <DraggableButton
                id="basic1"
                label="Drag Me!"
                color="bg-blue-500"
                onPositionChange={handlePositionChange}
              />
              <DraggableButton
                id="basic2"
                label="Card 1"
                color="bg-green-500"
                onPositionChange={handlePositionChange}
              />
              <DraggableButton
                id="basic3"
                label="Card 2"
                color="bg-purple-500"
                onPositionChange={handlePositionChange}
              />
            </View>

            <Text className="text-xs text-gray-500 mt-2">
              Position basic1: x={positions.basic1.x.toFixed(0)}, y={positions.basic1.y.toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Native-Specific Examples */}
        {Platform.OS !== 'web' && (
          <View className="px-4 py-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Native Examples ({Platform.OS === 'ios' ? 'iOS' : 'Android'})
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Using PanResponder with Animated API
            </Text>

            <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <Text className="text-base font-semibold text-gray-800 mb-3">
                Smooth Animated Dragging
              </Text>
              
              <View className="mb-6 bg-gray-100 rounded-lg p-4 min-h-[250px]">
                <DraggableButtonNative
                  id="native1"
                  label="Smooth Drag"
                  color="bg-orange-500"
                  onPositionChange={handlePositionChange}
                />
                <DraggableButtonNative
                  id="native2"
                  label="Animated"
                  color="bg-pink-500"
                  onPositionChange={handlePositionChange}
                />
              </View>

              <Text className="text-xs text-gray-500 mt-2">
                Position native1: x={positions.native1.x.toFixed(0)}, y={positions.native1.y.toFixed(0)}
              </Text>
            <Text className="text-xs text-gray-600 mt-1 italic">
              Touch and drag immediately - optimized for iOS/Android
            </Text>
            </View>
          </View>
        )}

        {/* Web-Specific Examples */}
        {Platform.OS === 'web' && (
          <View className="px-4 py-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Web Examples
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Using HTML5 Drag and Drop API
            </Text>

            <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <Text className="text-base font-semibold text-gray-800 mb-3">
                Native HTML5 Drag & Drop
              </Text>
              
              <View className="mb-6 bg-gray-100 rounded-lg p-4 min-h-[250px]">
                <DraggableButtonWeb
                  id="web1"
                  label="HTML5 Drag"
                  color="bg-teal-500"
                  onPositionChange={handlePositionChange}
                />
                <DraggableButtonWeb
                  id="web2"
                  label="Native Drop"
                  color="bg-indigo-500"
                  onPositionChange={handlePositionChange}
                />
              </View>

              <Text className="text-xs text-gray-500 mt-2">
                Position web1: x={positions.web1.x.toFixed(0)}, y={positions.web1.y.toFixed(0)}
              </Text>
              <Text className="text-xs text-gray-600 mt-1 italic">
                Click and drag to move
              </Text>
            </View>
          </View>
        )}

        {/* Tips Section */}
        <View className="px-4 py-6 mb-8">
          <View className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <Text className="text-base font-semibold text-blue-900 mb-2">
              💡 Implementation Tips
            </Text>
            <Text className="text-sm text-blue-800 mb-2">
              • Universal: Works everywhere but with basic features
            </Text>
            <Text className="text-sm text-blue-800 mb-2">
              • Native: Smooth animations with PanResponder
            </Text>
            <Text className="text-sm text-blue-800">
              • Web: Uses HTML5 drag events for best browser support
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
