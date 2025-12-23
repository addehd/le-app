import React, { useState, useRef } from 'react';
import { View, Text, Platform } from 'react-native';

interface DraggableButtonWebProps {
  id: string;
  label: string;
  color: string;
  onPositionChange?: (id: string, x: number, y: number) => void;
}

export const DraggableButtonWeb: React.FC<DraggableButtonWebProps> = ({
  id,
  label,
  color,
  onPositionChange,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const elementStartPos = useRef({ x: 0, y: 0 });

  // Web-specific drag handlers
  const handleMouseDown = (e: any) => {
    if (Platform.OS !== 'web') return;
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    elementStartPos.current = { x: position.x, y: position.y };
    
    // Prevent text selection while dragging
    e.preventDefault();
  };

  const handleMouseMove = (e: any) => {
    if (!isDragging || Platform.OS !== 'web') return;
    
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    
    const newX = elementStartPos.current.x + deltaX;
    const newY = elementStartPos.current.y + deltaY;
    
    setPosition({ x: newX, y: newY });
    
    if (onPositionChange) {
      onPositionChange(id, newX, newY);
    }
  };

  const handleMouseUp = () => {
    if (Platform.OS !== 'web') return;
    setIsDragging(false);
  };

  // Attach global listeners for smooth dragging
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;
        
        const newX = elementStartPos.current.x + deltaX;
        const newY = elementStartPos.current.y + deltaY;
        
        setPosition({ x: newX, y: newY });
        
        if (onPositionChange) {
          onPositionChange(id, newX, newY);
        }
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, id, onPositionChange]);

  if (Platform.OS !== 'web') {
    return (
      <View className="bg-gray-300 rounded-lg px-6 py-4 mb-3">
        <Text className="text-gray-600 text-center">
          Web component only
        </Text>
      </View>
    );
  }

  return (
    <View
      // @ts-ignore - Web-specific props
      onMouseDown={handleMouseDown}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
        marginBottom: 12,
        zIndex: isDragging ? 1000 : 1,
        userSelect: 'none',
        position: 'relative',
      }}
    >
      <View
        className={`${color} rounded-xl px-6 py-4 shadow-lg ${
          isDragging ? 'opacity-80' : 'opacity-100'
        }`}
        style={{
          transition: isDragging ? 'none' : 'opacity 0.2s',
        }}
      >
        <Text className="text-white font-bold text-center text-base">
          {label}
        </Text>
        <Text className="text-white text-xs text-center mt-1 opacity-90">
          🌐 Web Optimized
        </Text>
        {!isDragging && (
          <Text className="text-white text-xs text-center mt-1 opacity-70">
            Click & drag to move
          </Text>
        )}
      </View>
    </View>
  );
};
