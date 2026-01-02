
import { useTranslations } from 'next-intl';
import announcements from '@/app/announcements';
import Image from 'next/image';
import Link from 'next/link'; // Use next/link for client-side navigation
import { getTranslations } from 'next-intl/server';
import { SEOFooter } from "@/components/SEOFooter";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Announcements' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: "https://chesspie.org/announcements",
            languages: {
                'en': 'https://chesspie.org/en/announcements',
                'de': 'https://chesspie.org/de/announcements'
            }
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: "https://chesspie.org/announcements",
            type: "website",
            images: [{ url: "/images/seo/og-home.png", width: 1200, height: 630 }],
        },
    };
}


export default function AnnouncementsPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Announcements');

    return (
        <div className="min-h-screen bg-linear-to-b from-white to-gray-50 dark:from-black dark:to-stone-950 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-16">

                {/* Header Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-linear-to-r from-amber-500 via-orange-500 to-amber-600 dark:from-amber-300 dark:via-yellow-400 dark:to-orange-500 pb-2">
                        {t('title')}
                    </h1>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {announcements.map((announcement, index) => (
                        <Link
                            href={`/announcements/${announcement.id}`}
                            key={announcement.id}
                            className="group relative block h-full"
                        >
                            <div className="relative h-full bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-2 dark:hover:border-amber-500/50 hover:border-amber-500/50">

                                {/* Image Container */}
                                <div className="relative h-64 overflow-hidden">
                                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                                    <Image
                                        src={announcement.image}
                                        alt={announcement.title[locale as keyof typeof announcement.title]}
                                        fill
                                        className="object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                                        loading={index < 3 ? "eager" : "lazy"}
                                        priority={index < 3}
                                    />

                                    {/* Date Badge */}
                                    <div className="absolute top-4 right-4 z-20">
                                        <span className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs font-medium text-white border border-white/20">
                                            {announcement.date}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 md:p-8 space-y-4">
                                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                        {announcement.author}
                                    </div>

                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        {announcement.title[locale as keyof typeof announcement.title]}
                                    </h2>

                                    <p className="text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                                        {announcement.shortDescription[locale as keyof typeof announcement.shortDescription]}
                                    </p>

                                    <div className="pt-4 flex items-center text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-1 transition-transform">
                                        Read more
                                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <SEOFooter />
        </div>
    );
}
