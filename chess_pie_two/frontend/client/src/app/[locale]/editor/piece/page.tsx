import PageClient from "./PageClient";
import { getTranslations } from 'next-intl/server';
import { PieceEditorHelp } from "@/components/help/HelpArticles";

const jsonLd_pieceEditor = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ChessPie Piece Editor",
    "url": "https://chesspie.org/en/editor/piece",
    "description": "Design and customize chess pieces — shapes, colors, and animations.",
    "applicationCategory": "DesignApplication",
    "operatingSystem": "Web",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "provider": { "@type": "Organization", "name": "ChessPie", "url": "https://chesspie.org/en" }
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.EditorPiece' });
    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: `https://chesspie.org/${locale}/editor/piece`,
            languages: {
                'en': 'https://chesspie.org/en/editor/piece',
                'de': 'https://chesspie.org/de/editor/piece'
            }
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: "https://chesspie.org/en/editor/piece",
            siteName: "ChessPie",
            images: [{ url: "/images/seo/og-editor.png", width: 1200, height: 630 }],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: t('title'),
            description: t('description'),
            images: ["/images/seo/twitter-image.png"],
        },
    };
}

export default async function PiecePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.EditorPiece' });

    return <>
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_pieceEditor).replace(/</g, '\\u003c') }}
        />
        <h1 className="sr-only">{t('h1')}</h1>
        <PageClient />
        <PieceEditorHelp />
    </>
}