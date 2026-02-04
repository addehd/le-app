import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Redirect to tabs profile which includes the menu bar
export default function ProfileScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(tabs)/profile');
  }, []);

  return null;
}