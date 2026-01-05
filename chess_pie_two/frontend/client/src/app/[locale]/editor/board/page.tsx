import PageClient from "./PageClient";
import { getTranslations } from 'next-intl/server';
import { BoardEditorHelp } from "@/components/help/HelpArticles";

const jsonLd_boardEditor = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ChessPie Board Editor",
    "url": "https://chesspie.org/en/editor/board",
    "description": "An editor to design custom chess boards on ChessPie.",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "provider": { "@type": "Organization", "name": "ChessPie", "url": "https://chesspie.org/en" },
    "featureList": ["Grid editor", "Tile coloring", "Custom starting positions"]
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.EditorBoard' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: "https://chesspie.org/en/editor/board",
            languages: {
                'en': 'https://chesspie.org/en/editor/board',
                'de': 'https://chesspie.org/de/editor/board'
            }
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: "https://chesspie.org/en/editor/board",
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

export default async function Board({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.EditorBoard' });

    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_boardEditor).replace(/</g, '\\u003c') }}
        />
        <h1 className="sr-only">{t('h1')}</h1>
        <PageClient />
        <BoardEditorHelp />
    </>
}