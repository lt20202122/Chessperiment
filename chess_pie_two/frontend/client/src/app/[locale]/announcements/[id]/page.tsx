
import { useTranslations } from 'next-intl';
import announcements from '@/app/announcements';
import Image from 'next/image';
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
    const imageUrl = `https://chesspie.de${announcement.image}`; // Assuming base URL

    const hreflangs = generateHreflangs(`/announcements/${id}`, ['de', 'en'], locale as Locale, 'https://chesspie.de');

    return {
        title: `ChessPie – ${title}`,
        description: description,
        alternates: {
            canonical: `https://chesspie.de/announcements/${id}`,
            languages: hreflangs.reduce((acc, tag) => {
                acc[tag.hrefLang] = tag.href;
                return acc;
            }, {} as Record<string, string>),
        },
        openGraph: {
            title: `ChessPie – ${title}`,
            description: description,
            url: `https://chesspie.de/announcements/${id}`,
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
        <div className="container mx-auto p-4 md:p-8 max-w-3xl">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="relative w-full h-64 md:h-96">
                    <Image
                        src={announcement.image}
                        alt={announcement.title[locale as keyof typeof announcement.title]}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                <div className="p-6">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        {announcement.title[locale as keyof typeof announcement.title]}
                    </h1>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
                        <span>{t('by')} {announcement.author}</span>
                        <span>{announcement.date}</span>
                    </div>
                    <div
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: announcement.content[locale as keyof typeof announcement.content] }}
                    />
                </div>
            </div>
        </div>
    );
}
