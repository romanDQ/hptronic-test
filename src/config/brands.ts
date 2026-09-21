/** Constrained instead of `string`, so an unknown brand cannot be referenced anywhere. */
export type BrandId = 'brandA' | 'brandB';

export type BrandConfig = {
  readonly id: BrandId;
  readonly name: string;
  readonly primaryColor: string;
  /** Base URL of this brand's API; the resource path belongs to the service layer. */
  readonly apiBaseUrl: string;
};

/**
 * Both brands point at the Fake Store API because the assessment has no second
 * backend, and inventing a host would only produce a brand that always errors.
 * The URL is still owned per brand, so giving Brand B its own environment is a
 * one-line change here that nothing else in the app has to know about.
 */
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

/** Lets the switcher render every configured brand without naming any of them. */
export const BRAND_LIST: readonly BrandConfig[] = Object.values(BRANDS);
