import { getTranslations } from 'next-intl/server';
import LobbyPage from "./LobbyPage"
import { GameHelp } from '@/components/help/HelpArticles';

// app/game/page.tsx


export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Game' });
    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `https://chessperiment.app/${locale}/game`,
            siteName: 'chessperiment',
            images: [{ url: '/images/seo/og-game.png', width: 1200, height: 630 }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('title'),
            description: t('description'),
            images: ['/images/seo/twitter-image.png'],
        },
        alternates: {
            canonical: `https://chessperiment.app/${locale}/game`,
            languages: {
                'en': 'https://chessperiment.app/en/game',
                'de': 'https://chessperiment.app/de/game'
            }
        },
    };
}

export default async function Game({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Game' });

    const jsonLd_gameIndex = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "chessperiment Games",
        "url": `https://chessperiment.app/${locale}/game`,
        "applicationCategory": "GameApplication",
        "operatingSystem": "Web",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "description": "Play custom chess variants online with friends."
    };

    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_gameIndex).replace(/</g, '\\u003c') }}
        />
        <h1 className="sr-only">{t('h1')}</h1>
        <LobbyPage />
        <GameHelp />
    </>
}