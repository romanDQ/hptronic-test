import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { BRANDS, DEFAULT_BRAND_ID } from '../config/brands';
import type { BrandConfig, BrandId } from '../config/brands';

type BrandContextValue = {
  brand: BrandConfig;
  setBrand: (id: BrandId) => void;
};

// Null default so useBrand() throws outside the provider instead of silently serving a fallback brand.
const BrandContext = createContext<BrandContextValue | null>(null);

type BrandProviderProps = {
  children: ReactNode;
};

export function BrandProvider({ children }: BrandProviderProps) {
  const [brandId, setBrandId] = useState<BrandId>(DEFAULT_BRAND_ID);

  const value = useMemo<BrandContextValue>(
    () => ({ brand: BRANDS[brandId], setBrand: setBrandId }),
    [brandId],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextValue {
  const value = useContext(BrandContext);
  if (value === null) {
    throw new Error('useBrand must be used inside a BrandProvider.');
  }
  return value;
}
