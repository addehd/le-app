import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../lib/store/simpleAuthStore';
// import { supabase } from '../../lib/api/supabaseClient';

interface Friend {
  id: string;
  email: string;
  full_name?: string;
}

export default function ProfileScreen() {
  const [fullName, setFullName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const router = useRouter();
  
  const { 
    user, 
    userProfile, 
    signOut, 
    updateProfile, 
    addFriend, 
    removeFriend, 
    isLoading, 
    initialize 
  } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!user) {
      router.replace('/auth');
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || '');
      loadFriends();
    }
  }, [userProfile]);

  const loadFriends = async () => {
    console.log('Mock loadFriends');
    setIsLoadingFriends(false);
  };

  const handleUpdateProfile = async () => {
    if (!userProfile) return;
    
    try {
      await updateProfile({ full_name: fullName });
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleAddFriend = async () => {
    console.log('Mock handleAddFriend');
    Alert.alert('Mock', 'Mock friend added');
  };

  const handleRemoveFriend = async (friendId: string) => {
    Alert.alert(
      'Remove Friend',
      'Are you sure you want to remove this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendId);
              setFriends(prev => prev.filter(f => f.id !== friendId));
              Alert.alert('Success', 'Friend removed successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove friend');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
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

  const renderFriend = ({ item }: { item: Friend }) => (
    <View className="flex-row justify-between items-center p-4 bg-white rounded-lg mb-2 shadow-sm">
      <View>
        <Text className="font-medium text-gray-800">{item.full_name || item.email}</Text>
        {item.full_name && <Text className="text-gray-600 text-sm">{item.email}</Text>}
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveFriend(item.id)}
        className="bg-red-500 px-3 py-1 rounded"
      >
        <Text className="text-white text-sm">Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50 p-6">
      <View className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <Text className="text-2xl font-bold text-gray-800 mb-4">Profile</Text>
        
        <View className="mb-4">
          <Text className="text-gray-700 text-sm font-medium mb-2">Email</Text>
          <Text className="text-gray-600">{user.email}</Text>
        </View>

        <View className="mb-4">
          <Text className="text-gray-700 text-sm font-medium mb-2">Full Name</Text>
          <TextInput
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        <TouchableOpacity
          className="w-full bg-blue-500 py-3 rounded-lg mb-4"
          onPress={handleUpdateProfile}
        >
          <Text className="text-white text-center font-semibold">Update Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full bg-red-500 py-3 rounded-lg"
          onPress={handleSignOut}
        >
          <Text className="text-white text-center font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <Text className="text-xl font-bold text-gray-800 mb-4">Add Friends</Text>
        
        <View className="flex-row mb-4">
          <TextInput
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg"
            placeholder="Friend's email"
            value={friendEmail}
            onChangeText={setFriendEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            className="bg-green-500 px-4 py-2 rounded-r-lg"
            onPress={handleAddFriend}
          >
            <Text className="text-white font-semibold">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="bg-white p-6 rounded-lg shadow-lg flex-1">
        <Text className="text-xl font-bold text-gray-800 mb-4">
          Friends ({friends.length})
        </Text>
        
        {isLoadingFriends ? (
          <ActivityIndicator size="small" color="#3b82f6" />
        ) : friends.length === 0 ? (
          <Text className="text-gray-500 text-center py-4">No friends yet</Text>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={renderFriend}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity
        className="mt-4 bg-purple-500 py-3 rounded-lg"
        onPress={() => router.push('/(tabs)/map')}
      >
        <Text className="text-white text-center font-semibold">Go to Map</Text>
      </TouchableOpacity>
    </View>
  );
}