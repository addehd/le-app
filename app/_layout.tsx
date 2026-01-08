import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { Platform } from 'react-native';
import { StyleSheet } from 'react-native-web';

// Set dark mode strategy before importing styles
if (typeof StyleSheet !== 'undefined' && StyleSheet.setFlag) {
  StyleSheet.setFlag('darkMode', 'class');
}

import '../global.css';

// Conditionally import GestureHandlerRootView for native platforms
let GestureHandlerRootView: any = View;
try {
  if (Platform.OS !== 'web') {
    const { GestureHandlerRootView: GHRootView } = require('react-native-gesture-handler');
    GestureHandlerRootView = GHRootView;
  }
} catch (error) {
  // Fallback to View if gesture handler is not available
  console.warn('GestureHandler not available, using View fallback');
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false, // Hide header for cleaner kanban view
        }}>
        <Stack.Screen name="index" options={{ title: 'Kanban' }} />
        <Stack.Screen name="kanban" options={{ title: 'Kanban' }} />
        <Stack.Screen name="kanban/[projectId]" options={{ title: 'Kanban Project' }} />
        <Stack.Screen name="auth" options={{ title: 'Authentication' }} />
        <Stack.Screen name="profile/index" options={{ title: 'Profil', headerShown: true }} />
        <Stack.Screen name="bidding" options={{ title: 'Bidding Strategy' }} />
        <Stack.Screen name="compare/index" options={{ title: 'Compare Properties' }} />
        <Stack.Screen name="details" options={{ title: 'Details' }} />
        <Stack.Screen name="draggable" options={{ title: 'Draggable Examples' }} />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
