import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Star, Filter, ShoppingCart, Heart } from 'lucide-react';
import { Header } from "@/components/Header";
import { getTranslations } from 'next-intl/server';
import { SEOFooter } from "@/components/SEOFooter";

const MockItems = [
    { id: 1, name: "Crystal Board", type: "Board", price: 15.99, rating: 4.8, image: "/images/marketplace/board1.png" },
    { id: 2, name: "Neon Pieces", type: "Pieces", price: 9.99, rating: 4.5, image: "/images/marketplace/pieces1.png" },
    { id: 3, name: "Wooden Classic", type: "Set", price: 29.99, rating: 4.9, image: "/images/marketplace/set1.png" },
    { id: 4, name: "Glass Modern", type: "Board", price: 12.00, rating: 4.2, image: "/images/marketplace/board2.png" },
    { id: 5, name: "Cyberpunk Set", type: "Set", price: 45.00, rating: 5.0, image: "/images/marketplace/set2.png" },
    { id: 6, name: "Minimalist", type: "Pieces", price: "Free", rating: 4.6, image: "/images/marketplace/pieces2.png" },
];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Marketplace' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/marketplace`,
            languages: {
                'en': 'https://chessperiment.app/en/marketplace',
                'de': 'https://chessperiment.app/de/marketplace'
            }
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `https://chessperiment.app/${locale}/marketplace`,
            type: "website",
        },
    };
}

export default async function MarketplacePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Marketplace' });
    const marketT = await getTranslations({ locale, namespace: 'Marketplace' });

    return (
        <div className="min-h-screen bg-bg text-stone-900 dark:text-stone-100">
            <h1 className="sr-only">{t('h1')}</h1>

            <main className="max-w-7xl mx-auto pt-24 px-4 pb-12">
                <div className="mb-8 text-center">
                    <h2 className="text-4xl md:text-5xl font-black mb-4 bg-clip-text text-transparent bg-linear-to-r from-amber-500 to-orange-600">
                        chessperiment Marketplace
                    </h2>
                    <p className="text-xl text-stone-500 dark:text-stone-400 max-w-2xl mx-auto">
                        Discover unique boards, stunning piece sets, and exclusive designs created by the community.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 relative">
                    {/* Coming Soon Overlay - Only shown if beta overlay is enabled */}
                    {process.env.NEXT_PUBLIC_ENABLE_BETA_OVERLAY !== 'false' && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden pointer-events-none">
                            <div className="text-center p-8 bg-black/60 backdrop-blur-md rounded-2xl border border-amber-500/30 max-w-md animate-in zoom-in duration-500 pointer-events-auto">
                                <h2 className="text-3xl font-black text-amber-500 mb-4 uppercase tracking-wider">{marketT('inProduction') || 'Coming Soon'}</h2>
                                <p className="text-gray-200 font-medium text-lg leading-relaxed">
                                    {marketT('marketplaceBetaMessage') || 'Our marketplace is currently under heavy development. Stay tuned for unique piece designs and custom boards!'}
                                </p>
                                <div className="mt-8 flex justify-center gap-4">
                                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-bounce" />
                                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]" />
                                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filter Sidebar */}
                    <aside className={`w-full lg:w-64 bg-white dark:bg-stone-900 p-6 rounded-2xl shadow-sm h-fit ${process.env.NEXT_PUBLIC_ENABLE_BETA_OVERLAY !== 'false' ? 'blur-sm' : ''}`}>
                        <div className="flex items-center gap-2 font-bold text-lg mb-6">
                            <Filter size={20} /> Filters
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold mb-3">Categories</h3>
                                <div className="space-y-2 text-sm text-stone-600 dark:text-stone-400">
                                    <label className="flex items-center gap-2 cursor-pointer hover:text-amber-500 transition-colors">
                                        <input type="checkbox" className="rounded text-amber-500 focus:ring-amber-500" /> Boards
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer hover:text-amber-500 transition-colors">
                                        <input type="checkbox" className="rounded text-amber-500 focus:ring-amber-500" /> Pieces
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer hover:text-amber-500 transition-colors">
                                        <input type="checkbox" className="rounded text-amber-500 focus:ring-amber-500" /> Full Sets
                                    </label>
                                </div>
                            </div>

                            <div className="border-t border-stone-100 dark:border-stone-800 pt-6">
                                <h3 className="font-semibold mb-3">Price Range</h3>
                                <input type="range" className="w-full accent-amber-500" />
                                <div className="flex justify-between text-xs text-stone-400 mt-1">
                                    <span>Free</span>
                                    <span>$100+</span>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Grid */}
                    <div className={`flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${process.env.NEXT_PUBLIC_ENABLE_BETA_OVERLAY !== 'false' ? 'blur-sm' : ''}`}>
                        {MockItems.map((item) => (
                            <div key={item.id} className="group bg-white dark:bg-stone-900 rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-transparent hover:border-amber-500/20">
                                <div className="relative aspect-square rounded-xl bg-stone-100 dark:bg-stone-800 mb-4 overflow-hidden">
                                    {/* Placeholder Image */}
                                    <div className="absolute inset-0 flex items-center justify-center text-stone-300">
                                        [Image: {item.name}]
                                    </div>
                                    <button className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-black/50 backdrop-blur rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:scale-110">
                                        <Heart size={18} />
                                    </button>
                                </div>

                                <div>
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-lg group-hover:text-amber-500 transition-colors">{item.name}</h3>
                                        <div className="flex items-center gap-1 text-sm font-medium text-amber-500">
                                            <Star size={14} fill="currentColor" /> {item.rating}
                                        </div>
                                    </div>
                                    <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">{item.type}</p>

                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-xl">{typeof item.price === 'number' ? `$${item.price}` : item.price}</span>
                                        <button className="p-2 bg-stone-900 dark:bg-white text-white dark:text-black rounded-xl hover:scale-105 transition-transform">
                                            <ShoppingCart size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}