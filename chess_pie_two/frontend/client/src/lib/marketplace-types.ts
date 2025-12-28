export type MarketplaceItemType = 'board' | 'piece' | 'design';

export interface MarketplaceItem {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  type: MarketplaceItemType;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  description?: string;
  isNew?: boolean;
  createdAt?: Date;
}

export interface MarketplaceFilter {
  id: string;
  label: string;
  value: string;
}

export const MARKETPLACE_FILTERS: MarketplaceFilter[] = [
  { id: 'all', label: 'All', value: 'all' },
  { id: 'board', label: 'Boards', value: 'board' },
  { id: 'piece', label: 'Pieces', value: 'piece' },
  { id: 'design', label: 'Designs', value: 'design' },
  { id: 'free', label: 'Free', value: 'free' },
  { id: 'paid', label: 'Premium', value: 'paid' },
];
