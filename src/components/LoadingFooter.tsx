import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useBrand } from '../context/BrandContext';

/** Bottom-of-list indicator shown while the next page is being appended. */
export function LoadingFooter() {
  const { brand } = useBrand();

  return (
    <View style={styles.footer}>
      <ActivityIndicator color={brand.primaryColor} />
      <Text style={styles.label}>Loading more…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  label: {
    fontSize: 13,
    color: '#444',
  },
});
