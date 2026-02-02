import { getTranslations } from 'next-intl/server';
import PageClient from './PageClient';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Editor' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://chessperiment.app/${locale}/editor`,
            languages: {
                'en': 'https://chessperiment.app/en/editor',
                'de': 'https://chessperiment.app/de/editor'
            }
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: `https://chessperiment.app/${locale}/editor`,
            type: "website",
            images: [{ url: "/images/seo/og-editor.png", width: 1200, height: 630 }],
        },
        twitter: {
            card: "summary_large_image",
            title: t('title'),
            description: t('description'),
            images: ["/images/seo/twitter-image.png"],
        },
    };
}

export default async function EditorPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Editor' });

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "chessperiment Project Editor",
        "url": `https://chessperiment.app/${locale}/editor`,
        "description": t('description'),
        "applicationCategory": "DesignApplication",
        "operatingSystem": "Web",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "provider": { "@type": "Organization", "name": "chessperiment", "url": `https://chessperiment.app/${locale}` },
        "featureList": ["Project management", "Board editor", "Piece editor", "Custom game rules"]
    };

    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
        <PageClient />
    </>;
}
