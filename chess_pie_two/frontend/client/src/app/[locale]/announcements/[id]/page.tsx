
import { useTranslations } from 'next-intl';
import announcements from '@/app/announcements';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { generateHreflangs, Locale } from '@/lib/hreflang';

type Props = {
    params: { id: string; locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id, locale } = params;
    const announcement = announcements.find((a) => a.id === id);

    if (!announcement) {
        return {};
    }

    const title = announcement.title[locale as keyof typeof announcement.title];
    const description = announcement.shortDescription[locale as keyof typeof announcement.shortDescription];
    const imageUrl = `https://chesspie.org${announcement.image}`; // Assuming base URL

    const hreflangs = generateHreflangs(`/announcements/${id}`, ['de', 'en'], locale as Locale, 'https://chesspie.org');

    return {
        title: `ChessPie – ${title}`,
        description: description,
        alternates: {
            canonical: `https://chesspie.org/announcements/${id}`,
            languages: hreflangs.reduce((acc, tag) => {
                acc[tag.hrefLang] = tag.href;
                return acc;
            }, {} as Record<string, string>),
        },
        openGraph: {
            title: `ChessPie – ${title}`,
            description: description,
            url: `https://chesspie.org/announcements/${id}`,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title: `ChessPie – ${title}`,
            description: description,
            images: [imageUrl],
        },
    };
}


export default function AnnouncementPage({ params: { id, locale } }: Props) {
    const t = useTranslations('Announcements');
    const announcement = announcements.find((a) => a.id === id);

    if (!announcement) {
        notFound();
    }

    return (
        <article className="min-h-screen bg-white dark:bg-black pb-20">
            {/* Hero Section */}
            <div className="relative w-full h-[60vh] min-h-[400px]">
                <div className="absolute inset-0 bg-linear-to-b from-transparent to-black/80 z-10" />
                <Image
                    src={announcement.image}
                    alt={announcement.title[locale as keyof typeof announcement.title]}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute bottom-0 left-0 w-full z-20 p-8 md:p-16 max-w-7xl mx-auto">
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-amber-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg shadow-amber-500/20">
                                {t('news')}
                            </span>
                            <span className="text-white/80 text-sm font-medium backdrop-blur-md bg-black/30 px-3 py-1 rounded-full">
                                {announcement.date}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight drop-shadow-xl max-w-5xl">
                            {announcement.title[locale as keyof typeof announcement.title]}
                        </h1>
                        <div className="flex items-center gap-3 text-white/90">
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-amber-400 to-orange-600 flex items-center justify-center font-bold text-white shadow-lg">
                                {announcement.author.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-lg">{announcement.author}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-10 relative z-30">
                <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl p-8 md:p-16 border border-gray-100 dark:border-white/5">
                    <div
                        className="prose dark:prose-invert prose-lg md:prose-xl max-w-none 
                        prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
                        prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed
                        prose-a:text-amber-600 dark:prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-amber-600 dark:prose-strong:text-amber-400
                        prose-li:marker:text-amber-500"
                        dangerouslySetInnerHTML={{ __html: announcement.content[locale as keyof typeof announcement.content] }}
                    />

                    <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <Link
                            href="/announcements"
                            className="inline-flex items-center gap-2 text-gray-500 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400 transition-colors font-medium border border-gray-200 dark:border-gray-700 hover:border-amber-500 px-6 py-3 rounded-xl"
                        >
                            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            {t('backToOverview')}
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
