import { Platform, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

export default function HomeScreen() {
  if (Platform.OS === 'web') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="max-w-xl w-full px-8 py-10 bg-gray-800 rounded-2xl shadow-xl space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Välkommen Hem</h1>
            <p className="text-gray-300">Snabbåtkomst till dina verktyg</p>
          </div>

          {/* Primary action - Property List */}
          <Link href="/(tabs)/home/properties" asChild>
            <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-5 rounded-xl transition-all shadow-lg hover:shadow-xl">
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">🏠</span>
                <div className="text-left">
                  <div className="text-lg font-bold">Bostadslista</div>
                  <div className="text-sm text-blue-200">Samla bostäder ni gillar</div>
                </div>
              </div>
            </button>
          </Link>

          {/* Secondary actions */}
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <Link href="/(tabs)/home/kanban" asChild>
              <button className="flex-1 min-w-[160px] bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors">
                Kanban
              </button>
            </Link>
            <Link href="/(tabs)/home/profile" asChild>
              <button className="flex-1 min-w-[160px] bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors">
                Profil
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
      <View className="w-full max-w-md gap-4">
        <View className="items-center mb-2">
          <Text className="text-3xl font-bold text-gray-900">Välkommen Hem</Text>
          <Text className="text-base text-gray-600 mt-1">Snabbåtkomst till dina verktyg</Text>
        </View>

        {/* Primary action - Property List */}
        <Link href="/(tabs)/home/properties" asChild>
          <Pressable className="w-full bg-blue-600 px-6 py-5 rounded-xl mb-4 shadow-lg">
            <View className="flex-row items-center justify-center gap-3">
              <Text className="text-2xl">🏠</Text>
              <View>
                <Text className="text-lg font-bold text-white">Bostadslista</Text>
                <Text className="text-sm text-blue-200">Samla bostäder ni gillar</Text>
              </View>
            </View>
          </Pressable>
        </Link>

        {/* Secondary actions */}
        <Link href="/(tabs)/home/kanban" asChild>
          <Pressable className="w-full bg-primary-600 px-4 py-3 rounded-lg mb-3">
            <Text className="text-white text-center font-semibold">Kanban</Text>
          </Pressable>
        </Link>
        <Link href="/(tabs)/home/profile" asChild>
          <Pressable className="w-full bg-purple-600 px-4 py-3 rounded-lg">
            <Text className="text-white text-center font-semibold">Profil</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
