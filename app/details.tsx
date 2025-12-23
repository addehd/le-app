import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Pressable } from 'react-native';

export default function DetailsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text className="text-2xl font-bold text-gray-800 mb-4">Details Screen</Text>
      <Text className="text-gray-600 mb-6">
        This is the details screen created through file-based routing!
      </Text>
      
      <Pressable
        style={styles.button}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Go Back</Text>
      </Pressable>
      
      <Pressable
        style={[styles.button, styles.secondaryButton]}
        onPress={() => router.push('/')}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>Go to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  secondaryButtonText: {
    color: '#3b82f6',
  },
});