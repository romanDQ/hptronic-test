import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BRAND_LIST } from '../config/brands';
import { useBrand } from '../context/BrandContext';

// Iterates BRAND_LIST so adding a brand in config is enough — no id literals here.
export function BrandSwitcher() {
  const { brand: activeBrand, setBrand } = useBrand();

  return (
    <View style={[styles.bar, { borderBottomColor: activeBrand.primaryColor }]}>
      {BRAND_LIST.map((brand) => {
        const isActive = brand.id === activeBrand.id;
        return (
          <Pressable
            key={brand.id}
            onPress={() => setBrand(brand.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [
              styles.segment,
              { borderColor: brand.primaryColor },
              isActive && { backgroundColor: brand.primaryColor },
              pressed && styles.segmentPressed,
            ]}
          >
            <Text
              style={[
                styles.segmentLabel,
                isActive ? styles.segmentLabelActive : { color: brand.primaryColor },
              ]}
            >
              {brand.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 2,
    backgroundColor: '#fff',
  },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  segmentPressed: {
    opacity: 0.7,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  segmentLabelActive: {
    color: '#fff',
  },
});
