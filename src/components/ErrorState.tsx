import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useBrand } from '../context/BrandContext';

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
};

// Full-screen error when there are no products to keep on screen.
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { brand } = useBrand();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: brand.primaryColor },
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.buttonLabel}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    color: '#b00020',
  },
  button: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
