import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="kanban/index" />
      <Stack.Screen name="kanban/[projectId]" />
      <Stack.Screen name="profile/index" />
    </Stack>
  );
}
