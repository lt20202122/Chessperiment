
import { useTranslations } from 'next-intl';
import announcements from '../../../announcements'; // Adjust path as necessary
import Image from 'next/image';
import Link from 'next/link'; // Use next/link for client-side navigation
import type { Metadata } from 'next';
import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/announcements', ['de', 'en'], 'en', 'https://chesspie.de');

export const metadata: Metadata = {
    title: "ChessPie – Announcements & News",
    description: "Stay up-to-date with the latest features, improvements, and news from ChessPie.",
    alternates: {
        canonical: "https://chesspie.de/announcements",
        languages: hreflangs.reduce((acc, tag) => {
            acc[tag.hrefLang] = tag.href;
            return acc;
        }, {} as Record<string, string>),
    },
    openGraph: {
        title: "ChessPie – Announcements & News",
        description: "Stay up-to-date with the latest features, improvements, and news from ChessPie.",
        url: "https://chesspie.de/announcements",
        type: "website"
    },
    twitter: {
        card: "summary_large_image",
        title: "ChessPie – Announcements & News",
        description: "Stay up-to-date with the latest features, improvements, and news from ChessPie."
    },
};

export default function AnnouncementsPage({ params: { locale } }: { params: { locale: string } }) {
    const t = useTranslations('Announcements');

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-4xl font-bold mb-8 text-center">{t('title')}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {announcements.map((announcement) => (
                    <Link href={`/announcements/${announcement.id}`} key={announcement.id} className="block group">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden h-full flex flex-col transform transition-transform duration-300 group-hover:-translate-y-1">
                            <div className="relative w-full h-48">
                                <Image
                                    src={announcement.image}
                                    alt={announcement.title[locale as keyof typeof announcement.title]}
                                    fill
                                    className="object-cover"
                                    loading="lazy"
                                />
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h2 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors duration-300">
                                    {announcement.title[locale as keyof typeof announcement.title]}
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1">
                                    {announcement.shortDescription[locale as keyof typeof announcement.shortDescription]}
                                </p>
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
                                    <span>{announcement.author}</span>
                                    <span>{announcement.date}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
