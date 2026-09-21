import type { Product } from '../types/product';

export type FetchProductsOptions = {
  // Comes from the active brand; this module does not import React or Context.
  baseUrl: string;
  signal?: AbortSignal;
};

// The endpoint has no page/limit params — the whole catalogue arrives in one response.
export async function fetchProducts({ baseUrl, signal }: FetchProductsOptions): Promise<Product[]> {
  const response = await requestProducts(`${baseUrl}/products`, signal);

  if (!response.ok) {
    throw new Error(`Could not load products (server responded with status ${response.status}).`);
  }

  const payload: unknown = await response.json();

  if (!isProductList(payload)) {
    throw new Error('Could not load products: unexpected response format.');
  }

  return payload;
}

async function requestProducts(url: string, signal?: AbortSignal): Promise<Response> {
  try {
    return await fetch(url, { signal });
  } catch (error: unknown) {
    // Re-throw abort so the hook can ignore it; everything else is a user-facing network error.
    if (isAbortError(error)) {
      throw error;
    }
    throw new Error('Could not load products: please check your internet connection.');
  }
}

// response.json() is untyped; validate before treating it as Product[].
function isProductList(value: unknown): value is Product[] {
  return Array.isArray(value) && value.every(isProduct);
}

function isProduct(value: unknown): value is Product {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.title === 'string' &&
    typeof value.price === 'number' &&
    typeof value.description === 'string' &&
    typeof value.category === 'string' &&
    typeof value.image === 'string' &&
    isRecord(value.rating) &&
    typeof value.rating.rate === 'number' &&
    typeof value.rating.count === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
