import { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import type { ListRenderItem } from 'react-native';

import { ErrorBanner } from '../components/ErrorBanner';
import { ErrorState } from '../components/ErrorState';
import { LoadingFooter } from '../components/LoadingFooter';
import { ProductCard } from '../components/ProductCard';
import { useBrand } from '../context/BrandContext';
import { useProducts } from '../hooks/useProducts';
import type { Product } from '../types/product';

/** Half a viewport of remaining content, so the next page starts before the user hits the bottom. */
const END_REACHED_THRESHOLD = 0.5;

export function ProductsScreen() {
  const { brand } = useBrand();
  const { products, isLoading, isRefreshing, isLoadingMore, error, retry, refresh, loadMore } =
    useProducts();

  const renderItem = useCallback<ListRenderItem<Product>>(
    ({ item }) => <ProductCard product={item} />,
    [],
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={brand.primaryColor} />
        <Text style={styles.loadingLabel}>Loading products…</Text>
      </View>
    );
  }

  if (error !== null && products.length === 0) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
      {error !== null && <ErrorBanner message={error} onRetry={refresh} />}
      <FlatList
        data={products}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={refresh}
        onEndReached={loadMore}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        ListFooterComponent={isLoadingMore ? <LoadingFooter /> : null}
      />
    </View>
  );
}

function keyExtractor(product: Product): string {
  return String(product.id);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  loadingLabel: {
    color: '#444',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
});
