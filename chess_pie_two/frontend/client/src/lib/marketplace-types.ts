export interface MarketplaceItem {
    id: string;
    title: string;
    author: string;
    type: 'board' | 'pieces' | 'design' | 'game';
    price: number;
    rating: number;
    reviewCount: number;
    isNew: boolean;
    imageUrl: string;
    description: string;
}

export interface MarketplaceFilter {
    id: string;
    label: string;
    options: {
        value: string;
        label: string;
    }[];
}

export const MARKETPLACE_FILTERS: MarketplaceFilter[] = [
    {
        id: 'type',
        label: 'Type',
        options: [
            { value: 'all', label: 'All' },
            { value: 'board', label: 'Board' },
            { value: 'pieces', label: 'Pieces' },
            { value: 'design', label: 'Design' },
            { value: 'game', label: 'Game' },
        ],
    },
    {
        id: 'price',
        label: 'Price',
        options: [
            { value: 'all', label: 'All' },
            { value: 'free', label: 'Free' },
            { value: 'paid', label: 'Paid' },
        ],
    },
    {
        id: 'sort',
        label: 'Sort by',
        options: [
            { value: 'newest', label: 'Newest' },
            { value: 'rating', label: 'Rating' },
            { value: 'reviews', label: 'Reviews' },
        ],
    },
];
