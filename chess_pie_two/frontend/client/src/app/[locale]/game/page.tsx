import { getTranslations } from 'next-intl/server';
import LobbyPage from "./LobbyPage"

// app/game/page.tsx
const jsonLd_gameIndex = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ChessPie Games",
    "url": "https://chesspie.org/en/game",
    "applicationCategory": "GameApplication",
    "operatingSystem": "Web",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
    },
    "description": "Play custom chess variants online with friends."
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Game' });
    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: 'https://chesspie.org/en/game',
            siteName: 'ChessPie',
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
            canonical: "https://chesspie.org/en/game",
            languages: {
                'en': 'https://chesspie.org/en/game',
                'de': 'https://chesspie.org/de/game'
            }
        },
    };
}

export default async function Game({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Game' });

    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_gameIndex).replace(/</g, '\\u003c') }}
        />
        <h1 className="sr-only">{t('h1')}</h1>
        <LobbyPage />
    </>
}