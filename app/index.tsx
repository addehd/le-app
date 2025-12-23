import { Platform, View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

export default function HomeScreen() {
  if (Platform.OS === 'web') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <div className="max-w-xl w-full px-8 py-10 bg-gray-800 rounded-2xl shadow-xl space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Welcome</h1>
            <p className="text-gray-300">Choose where you want to go.</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <Link href="/kanban" asChild>
              <button className="flex-1 min-w-[160px] bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors">Kanban</button>
            </Link>
            <Link href="/map" asChild>
              <button className="flex-1 min-w-[160px] bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors">Map</button>
            </Link>
            <Link href="/bidding" asChild>
              <button className="flex-1 min-w-[160px] bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors">Bidding</button>
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
          <Text className="text-3xl font-bold text-gray-900">Welcome</Text>
          <Text className="text-base text-gray-600 mt-1">Choose where you want to go.</Text>
        </View>
        <Link href="/kanban" asChild>
          <Pressable className="w-full bg-primary-600 px-4 py-3 rounded-lg mb-3">
            <Text className="text-white text-center font-semibold">Kanban</Text>
          </Pressable>
        </Link>
        <Link href="/map" asChild>
          <Pressable className="w-full bg-green-600 px-4 py-3 rounded-lg mb-3">
            <Text className="text-white text-center font-semibold">Map</Text>
          </Pressable>
        </Link>
        <Link href="/bidding" asChild>
          <Pressable className="w-full bg-orange-600 px-4 py-3 rounded-lg">
            <Text className="text-white text-center font-semibold">Bidding</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}
