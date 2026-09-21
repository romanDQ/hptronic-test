import { Pressable, StyleSheet, Text, View } from 'react-native';

type ErrorBannerProps = {
  message: string;
  onRetry: () => void;
};

/** Non-blocking error, used when products are already on screen. */
export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <View style={styles.banner}>
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        hitSlop={8}
        style={({ pressed }) => pressed && styles.actionPressed}
      >
        <Text style={styles.action}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fdecea',
  },
  message: {
    flex: 1,
    fontSize: 13,
    color: '#b00020',
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
    color: '#b00020',
  },
  actionPressed: {
    opacity: 0.6,
  },
});
