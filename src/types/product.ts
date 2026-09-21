// Data from https://fakestoreapi.com/products
export type Product = {
  readonly id: number;
  readonly title: string;
  readonly price: number;
  readonly description: string;
  readonly category: string;
  readonly image: string;
  readonly rating: ProductRating;
};

export type ProductRating = {
  readonly rate: number;
  readonly count: number;
};
