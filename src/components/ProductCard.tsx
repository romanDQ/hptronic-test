import { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { Product } from '../types/product';

type ProductCardProps = {
  product: Product;
};

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: product.image }}
        style={styles.image}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
      </View>
    </View>
  );
});

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d0d0d0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  image: {
    width: 64,
    height: 64,
  },
  details: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  price: {
    fontSize: 14,
    color: '#444',
  },
});
