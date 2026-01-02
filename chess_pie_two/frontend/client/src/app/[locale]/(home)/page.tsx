import Btn from "./Buttons"
import { SEOFooter } from "@/components/SEOFooter";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SEO.Home' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: "https://chesspie.org",
      languages: {
        'en': 'https://chesspie.org/en',
        'de': 'https://chesspie.org/de'
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: "https://chesspie.org",
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

const jsonLd_home = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://chesspie.org/#website",
      "url": "https://chesspie.org/",
      "name": "ChessPie",
      "description": "The ultimate platform for custom chess creation and play.",
      "inLanguage": "en"
    },
    {
      "@type": "Organization",
      "@id": "https://chesspie.org/#organization",
      "name": "ChessPie",
      "url": "https://chesspie.org/",
      "logo": {
        "@type": "ImageObject",
        "url": "https://chesspie.org/icon.png"
      },
      "sameAs": []
    }
  ]
};

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SEO.Home' });

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

      <SEOFooter />
    </>
  );
}