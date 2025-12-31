import { Platform, View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { KanbanBoard } from './_components/KanbanBoard';

export default function KanbanProjectScreen() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();

  if (!projectId) {
    if (Platform.OS === 'web') {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-900 text-gray-200">
          <div className="text-center space-y-3">
            <h1 className="text-3xl font-bold">Project not found</h1>
            <p className="text-gray-400">A project ID is required to view a kanban board.</p>
          </div>
        </div>
      );
    }

    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-800">Project not found</Text>
        <Text className="text-gray-500 mt-2">A project ID is required to view this kanban board.</Text>
      </View>
    );
  }

  return <KanbanBoard projectId={projectId} />;
}
