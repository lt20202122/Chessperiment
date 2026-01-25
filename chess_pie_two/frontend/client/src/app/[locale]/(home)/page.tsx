import Btn from "./Buttons"
import { getTranslations } from 'next-intl/server';
import { HelpArticlesAll } from "@/components/help/HelpArticles";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SEO.Home' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `https://chessperiment.app/${locale}`,
      languages: {
        'en': 'https://chessperiment.app/en',
        'de': 'https://chessperiment.app/de'
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `https://chessperiment.app/${locale}`,
      type: "website",
      images: [{ url: "/images/seo/og-home.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t('title'),
      description: t('description'),
      images: ["/images/seo/twitter-image.png"],
    },
  };
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SEO.Home' });

  const jsonLd_home = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `https://chessperiment.app/${locale}/#website`,
        "url": `https://chessperiment.app/${locale}`,
        "name": "chessperiment",
        "description": t('description'),
        "inLanguage": locale
      },
      {
        "@type": "Organization",
        "@id": `https://chessperiment.app/${locale}/#organization`,
        "name": "chessperiment",
        "url": `https://chessperiment.app/${locale}`,
        "logo": {
          "@type": "ImageObject",
          "url": "https://chessperiment.app/icon.png"
        },
        "sameAs": []
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd_home).replace(/</g, '\\u003c') }}
      />
      {/* Hidden H1 for SEO */}
      <h1 className="sr-only">{t('h1')}</h1>
      <p className="sr-only">{t('p')}</p>

      <Btn />

      <HelpArticlesAll />
    </>
  );
}