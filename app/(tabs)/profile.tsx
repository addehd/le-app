import React, { useState, useEffect } from 'react';
import { Platform, View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/query/useAuth';

export default function ProfileTab() {
  const [fullName, setFullName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const router = useRouter();
  
  const { 
    user, 
    signOut, 
    isLoading,
  } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace('/auth');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    // TODO: Implement profile update with Supabase profiles table
    console.log('Profile update:', { fullName });
  };

  const handleSignOut = () => {
    try {
      signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Failed to sign out');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  if (Platform.OS === 'web') {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Profil</h1>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-post</label>
                <p className="text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">{user.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Namn</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ange ditt namn"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleUpdateProfile}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Uppdatera Profil
              </button>
            </div>
          </div>

          {/* Friends Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lägg till vänner</h2>
            
            <div className="flex gap-2">
              <input
                type="email"
                value={friendEmail}
                onChange={(e) => setFriendEmail(e.target.value)}
                placeholder="Väns e-post"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <button className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
                Lägg till
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Logga ut
          </button>
        </div>
      </div>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-6">
        {/* Profile Card */}
        <View className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <Text className="text-2xl font-bold text-gray-900 mb-4">Profil</Text>
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">E-post</Text>
            <Text className="text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">{user.email}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Namn</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ange ditt namn"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
            />
          </View>

          <Pressable
            onPress={handleUpdateProfile}
            className="w-full bg-blue-600 py-3 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">Uppdatera Profil</Text>
          </Pressable>
        </View>

        {/* Friends Card */}
        <View className="bg-white p-6 rounded-xl shadow-lg mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Lägg till vänner</Text>
          
          <View className="flex-row gap-2">
            <TextInput
              value={friendEmail}
              onChangeText={setFriendEmail}
              placeholder="Väns e-post"
              keyboardType="email-address"
              autoCapitalize="none"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg"
            />
            <Pressable className="bg-green-600 px-4 py-3 rounded-lg">
              <Text className="text-white font-semibold">Lägg till</Text>
            </Pressable>
          </View>
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          className="w-full bg-red-600 py-3 rounded-lg"
        >
          <Text className="text-white text-center font-semibold">Logga ut</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
