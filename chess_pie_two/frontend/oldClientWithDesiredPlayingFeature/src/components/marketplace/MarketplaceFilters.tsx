'use client';

import { Search } from 'lucide-react';
import { MarketplaceFilter } from '@/lib/marketplace-types';
import { useTranslations } from 'next-intl';

interface MarketplaceFiltersProps {
    filters: MarketplaceFilter[];
    activeFilter: string;
    onFilterChange: (id: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
}

export function MarketplaceFilters({
    filters,
    activeFilter,
    onFilterChange,
    searchQuery,
    onSearchChange,
}: MarketplaceFiltersProps) {
    // Try to use translations if available, fallback to label
    // In a real app, we might pass t function or keys
    const t = useTranslations('Marketplace');

    return (
        <div className="flex flex-col gap-4 mb-8">
            {/* Search Bar */}
            <div className="relative w-full max-w-2xl mx-auto">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-gray-700 rounded-xl leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition duration-150 ease-in-out sm:text-sm shadow-sm"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap justify-center gap-2">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => onFilterChange(filter.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${activeFilter === filter.id
                            ? 'bg-amber-400 text-black border-amber-500 shadow-md scale-105'
                            : 'bg-islands dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        {/* Try to translate the label if possible, else use raw label */}
                        {t(`filters.${filter.id}`) !== `Marketplace.filters.${filter.id}` ? t(`filters.${filter.id}`) : filter.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
