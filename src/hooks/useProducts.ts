import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBrand } from '../context/BrandContext';
import { fetchProducts } from '../services/productsApi';
import type { Product } from '../types/product';

/** Fake Store API has no page/limit params, so we fetch the whole collection
once and reveal it a page at a time. That saves render work, not bandwidth.
With real server pagination only the body of loadMore would change.*/ 
const PAGE_SIZE = 10;

// Stands in for a paginated backend round-trip. Without it the footer spinner would never be visible because the next page is already in memory.
// A placeholder for a real backend round-trip. Do NOT add to production.
const PAGE_LOAD_DELAY_MS = 400;

type LoadMode = 'initial' | 'refresh';

type ProductsState = {
  // Full API payload; the visible list is sliced from this.
  allProducts: Product[];
  visibleCount: number;
  status: 'loading' | 'refreshing' | 'idle';
  isLoadingMore: boolean;
  error: string | null;
};

export type UseProductsResult = {
  products: Product[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  retry: () => void;
  refresh: () => void;
  loadMore: () => void;
};

const INITIAL_STATE: ProductsState = {
  allProducts: [],
  visibleCount: PAGE_SIZE,
  status: 'loading',
  isLoadingMore: false,
  error: null,
};

export function useProducts(): UseProductsResult {
  const { brand } = useBrand();
  const [state, setState] = useState<ProductsState>(INITIAL_STATE);
  const requestRef = useRef<AbortController | null>(null);
  const isLoadingMoreRef = useRef(false);
  // Invalidates a loadMore that was already waiting when a refresh/unmount replaced the collection.
  const generationRef = useRef(0);

  const load = useCallback(async (mode: LoadMode): Promise<void> => {
    // Abort the previous request so it cannot write into the new brand/refresh.
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    generationRef.current += 1;

    setState((current) =>
      mode === 'refresh'
        ? { ...current, status: 'refreshing', isLoadingMore: false, error: null }
        : // Drop previous rows on initial load / brand switch so they cannot linger under the new brand's error state.
          INITIAL_STATE,
    );

    try {
      const allProducts = await fetchProducts({
        baseUrl: brand.apiBaseUrl,
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return;
      }
      // Fresh collection always starts at page 1.
      setState({
        allProducts,
        visibleCount: PAGE_SIZE,
        status: 'idle',
        isLoadingMore: false,
        error: null,
      });
    } catch (error: unknown) {
      if (controller.signal.aborted) {
        return;
      }
      setState((current) => ({
        ...current,
        status: 'idle',
        isLoadingMore: false,
        error: toErrorMessage(error),
      }));
    }
 
  }, [brand]);

  useEffect(() => {
    // load's identity changes when the brand changes, so this also refetches on switch.
    void load('initial');
    return () => {
      requestRef.current?.abort();
      generationRef.current += 1;
    };
  }, [load]);

  const { allProducts, visibleCount, status } = state;
  const hasMore = visibleCount < allProducts.length;

  const loadMore = useCallback(async (): Promise<void> => {
    // onEndReached fires more than once per gesture. A ref is required because a state flag would still be false for a second call in the same tick.
    if (isLoadingMoreRef.current || !hasMore || status !== 'idle') {
      return;
    }
    isLoadingMoreRef.current = true;
    const generation = generationRef.current;

    setState((current) => ({ ...current, isLoadingMore: true }));
    await delay(PAGE_LOAD_DELAY_MS);
    isLoadingMoreRef.current = false;

    if (generation !== generationRef.current) {
      // Refresh or unmount replaced the collection while this page was waiting.
      return;
    }
    setState((current) => ({
      ...current,
      visibleCount: Math.min(current.visibleCount + PAGE_SIZE, current.allProducts.length),
      isLoadingMore: false,
    }));
  }, [hasMore, status]);

  // Stable data reference when only the footer/error changes.
  const products = useMemo(() => allProducts.slice(0, visibleCount), [allProducts, visibleCount]);

  const retry = useCallback(() => void load('initial'), [load]);
  const refresh = useCallback(() => void load('refresh'), [load]);

  return {
    products,
    isLoading: status === 'loading',
    isRefreshing: status === 'refreshing',
    isLoadingMore: state.isLoadingMore,
    error: state.error,
    retry,
    refresh,
    loadMore,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong while loading products.';
}
