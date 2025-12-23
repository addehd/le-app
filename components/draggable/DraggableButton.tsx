import React, { useRef, useState } from 'react';
import { View, Text, PanResponder, Animated } from 'react-native';

interface DraggableButtonProps {
  id: string;
  label: string;
  color: string;
  onPositionChange?: (id: string, x: number, y: number) => void;
}

export const DraggableButton: React.FC<DraggableButtonProps> = ({
  id,
  label,
  color,
  onPositionChange,
}) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isDragging, setIsDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Allow immediate movement on iOS
        return true;
      },
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

      onPanResponderRelease: (_, gesture) => {
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
        setIsDragging(false);
        
        // Scale back to normal on terminate
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }).start();
        
        pan.flattenOffset();
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
        className={`${color} rounded-lg px-6 py-4 shadow-md ${
          isDragging ? 'opacity-80' : 'opacity-100'
        }`}
        style={{
          elevation: isDragging ? 8 : 2,
        }}
      >
        <Text className="text-white font-bold text-center text-base">
          {label}
        </Text>
        <Text className="text-white text-xs text-center mt-1 opacity-80">
          Universal Component
        </Text>
      </View>
    </Animated.View>
  );
};
