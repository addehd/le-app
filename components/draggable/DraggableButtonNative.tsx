import React, { useRef, useState } from 'react';
import { View, Text, PanResponder, Animated, Platform } from 'react-native';

interface DraggableButtonNativeProps {
  id: string;
  label: string;
  color: string;
  onPositionChange?: (id: string, x: number, y: number) => void;
}

export const DraggableButtonNative: React.FC<DraggableButtonNativeProps> = ({
  id,
  label,
  color,
  onPositionChange,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: () => {
        setIsDragging(true);
        
        // Tween to 105% scale (5% increase)
        Animated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }).start();

        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y },
        ],
        { useNativeDriver: false }
      ),

      onPanResponderRelease: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }

        setIsDragging(false);
        
        // Scale back to normal
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }).start();

        pan.flattenOffset();
        
        // Report final position
        if (onPositionChange) {
          onPositionChange(id, (pan.x as any)._value, (pan.y as any)._value);
        }
      },

      onPanResponderTerminate: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
        }
        
        setIsDragging(false);
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        transform: [
          { translateX: pan.x },
          { translateY: pan.y },
          { scale },
        ],
        marginBottom: 12,
        zIndex: isDragging ? 1000 : 1,
      }}
    >
      <View
        className={`${color} rounded-xl px-6 py-4 shadow-lg ${
          isDragging ? 'opacity-90' : 'opacity-100'
        }`}
        style={{
          elevation: isDragging ? 12 : 3,
        }}
      >
        <Text className="text-white font-bold text-center text-base">
          {label}
        </Text>
        <Text className="text-white text-xs text-center mt-1 opacity-90">
          {Platform.OS === 'ios' ? '📱 iOS Optimized' : '🤖 Android Optimized'}
        </Text>
        {!isDragging && (
          <Text className="text-white text-xs text-center mt-1 opacity-70">
            Touch & drag to move
          </Text>
        )}
      </View>
    </Animated.View>
  );
};
