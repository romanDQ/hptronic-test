import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useBrand } from '../context/BrandContext';
import { fetchProducts } from '../services/productsApi';
import type { Product } from '../types/product';

/**
 * Fake Store API serves the whole collection from one endpoint and accepts no
 * page/limit parameters, so pagination happens on the client: the collection is
 * fetched once and revealed one page at a time.
 *
 * The trade-off is that the first request still transfers every product, so this
 * saves rendering work but not bandwidth. With real server-side pagination only
 * the body of `loadMore` changes — it would request the next page instead of
 * widening a slice — while everything this hook exposes stays the same.
 *
 * The page size is deliberately large. FlatList calls onEndReached as soon as
 * `distanceFromEnd <= onEndReachedThreshold * viewportHeight`, so with a 0.5
 * threshold a page of ~88pt cards has to be about 1.5 screens tall, otherwise the
 * first page asks for the second one before the user can scroll at all. A
 * production app would derive this from the measured list height rather than a
 * constant; on a viewport taller than a phone's the first page still auto-fills,
 * which is correct behaviour rather than a bug, since a screen that is not full
 * should load more. The guards in `loadMore` keep those extra calls harmless.
 */
const PAGE_SIZE = 10;

/**
 * Stands in for the round-trip a paginated backend would cost. Without it the
 * footer indicator could never be seen, because the next page is already in
 * memory. This is the only simulated part of the hook.
 */
const PAGE_LOAD_DELAY_MS = 400;

type LoadMode = 'initial' | 'refresh';

type ProductsState = {
  /** Everything the API returned; the source the visible page is sliced from. */
  allProducts: Product[];
  /** How many of `allProducts` are currently exposed to the UI. */
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
  /** Retries the request and shows the full-screen loading state. */
  retry: () => void;
  /** Reloads the collection and restarts pagination at the first page. */
  refresh: () => void;
  /** Appends the next page, if there is one and none is already in flight. */
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
  /** Bumped whenever the collection is replaced, to invalidate a page append that is mid-flight. */
  const generationRef = useRef(0);

  const load = useCallback(async (mode: LoadMode): Promise<void> => {
    // Any request still in flight is superseded by this one.
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    generationRef.current += 1;

    setState((current) =>
      mode === 'refresh'
        ? { ...current, status: 'refreshing', isLoadingMore: false, error: null }
        : // An initial load has no data worth keeping: none exists on mount, and
          // after a brand switch the previous brand's products must not survive,
          // not even underneath an error state.
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
      // A new collection always restarts at the first page.
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
    // Keyed on the whole brand rather than only its URL: two brands may share an
    // endpoint today and still diverge later by key, header or locale, and
    // "the brand changed, so the loaded products are stale" holds either way.
  }, [brand]);

  useEffect(() => {
    // Re-runs when `load` changes identity, which happens exactly when the active
    // brand changes, so switching brands reloads without a second effect.
    void load('initial');
    return () => {
      requestRef.current?.abort();
      generationRef.current += 1;
    };
  }, [load]);

  const { allProducts, visibleCount, status } = state;
  const hasMore = visibleCount < allProducts.length;

  const loadMore = useCallback(async (): Promise<void> => {
    // onEndReached fires repeatedly for a single gesture, so an append that is
    // already running, a fully revealed list, and an in-flight initial load or
    // refresh all have to be ignored. The ref is read synchronously because a
    // state update would not be visible to the next call in the same tick.
    if (isLoadingMoreRef.current || !hasMore || status !== 'idle') {
      return;
    }
    isLoadingMoreRef.current = true;
    const generation = generationRef.current;

    setState((current) => ({ ...current, isLoadingMore: true }));
    await delay(PAGE_LOAD_DELAY_MS);
    isLoadingMoreRef.current = false;

    if (generation !== generationRef.current) {
      // A refresh or an unmount replaced the collection while this page waited.
      return;
    }
    setState((current) => ({
      ...current,
      visibleCount: Math.min(current.visibleCount + PAGE_SIZE, current.allProducts.length),
      isLoadingMore: false,
    }));
  }, [hasMore, status]);

  // Memoized so FlatList keeps receiving the same `data` reference when
  // unrelated state such as the error or the footer indicator changes.
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
