import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/query/useAuth';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  
  const { 
    signIn, 
    signUp, 
    user, 
    isLoading, 
    signInError, 
    signUpError,
    isSigningIn,
    isSigningUp,
  } = useAuth();

  const error = isLogin ? signInError : signUpError;
  const isSubmitting = isSigningIn || isSigningUp;

  useEffect(() => {
    if (user) {
      router.push('/(tabs)/profile');
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      if (isLogin) {
        signIn({ email, password });
      } else {
        signUp({ email, password });
        Alert.alert('Success', 'Check your email for verification link');
      }
    } catch (err) {
      console.error('Auth error:', err);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center px-6 bg-gray-50">
      <View className="bg-white p-8 rounded-lg shadow-lg">
        <Text className="text-3xl font-bold text-center mb-8 text-gray-800">
          {isLogin ? 'Sign In' : 'Sign Up'}
        </Text>
        
        {error && (
          <View className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <Text className="text-red-700">{error.message || 'An error occurred'}</Text>
          </View>
        )}

        <View className="mb-4">
          <Text className="text-gray-700 text-sm font-medium mb-2">Email</Text>
          <TextInput
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 text-sm font-medium mb-2">Password</Text>
          <TextInput
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
        </View>

        <TouchableOpacity
          className="w-full bg-blue-500 py-3 rounded-lg mb-4"
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text className="text-white text-center font-semibold">
            {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="w-full py-2"
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text className="text-blue-500 text-center">
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}