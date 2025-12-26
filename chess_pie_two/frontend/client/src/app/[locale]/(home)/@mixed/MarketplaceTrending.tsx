import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { marketplaceItems } from './MarketplaceData';
import { TrendingUp, Star } from 'lucide-react';

export default function MarketplaceTrending() {
    const t = useTranslations('Sidebar');

    // Show only top 3 items
    const topItems = marketplaceItems.slice(0, 3);

    const typeColors = {
        board: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
        pieces: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
        design: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        game: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
    };

    return (
        <section className="p-6 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-stone-700/50 rounded-3xl h-full flex flex-col">
            <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {t('trending')}
                </h2>
            </div>

            <div className="space-y-3 flex-1">
                {topItems.map((item) => (
                    <div
                        key={item.id}
                        className="group cursor-pointer p-3 rounded-xl hover:bg-white/60 dark:hover:bg-stone-800/60 transition-all"
                    >
                        <div className="flex gap-3 items-center">
                            {/* Preview Image */}
                            <div className="w-12 h-12 bg-linear-to-br from-gray-100 to-gray-50 dark:from-stone-800 dark:to-stone-900 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    width={36}
                                    height={36}
                                    unoptimized
                                    className="opacity-70 group-hover:opacity-100 transition-opacity"
                                    priority
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate mb-1.5">
                                    {item.name}
                                </h3>

                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${typeColors[item.type as keyof typeof typeColors]}`}>
                                        {t(item.type as 'board' | 'pieces' | 'design' | 'game')}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-gray-500">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        {item.rating}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="w-full mt-5 py-2.5 text-sm font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl transition-colors">
                {t('exploreMarketplace')} →
            </button>
        </section>
    );
}
