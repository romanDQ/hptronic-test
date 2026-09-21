// Constrained union so an unknown brand cannot be referenced.
export type BrandId = 'brandA' | 'brandB';

export type BrandConfig = {
  readonly id: BrandId;
  readonly name: string;
  readonly primaryColor: string;
  // Brand owns the host; the resource path (/products) stays in the service.
  readonly apiBaseUrl: string;
};

// Both brands use Fake Store API because the assessment has no second backend.

export const BRANDS: Record<BrandId, BrandConfig> = {
  brandA: {
    id: 'brandA',
    name: 'Brand A',
    primaryColor: '#1f6feb',
    apiBaseUrl: 'https://fakestoreapi.com',
  },
  brandB: {
    id: 'brandB',
    name: 'Brand B',
    primaryColor: '#c2410c',
    apiBaseUrl: 'https://fakestoreapi.com',
  },
};

export const DEFAULT_BRAND_ID: BrandId = 'brandA';

// Drives the switcher from config so no component names a specific brand id.
export const BRAND_LIST: readonly BrandConfig[] = Object.values(BRANDS);
