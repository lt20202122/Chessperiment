import Btn from "./Buttons"
import { getTranslations } from 'next-intl/server';
import { HelpArticlesAll } from "@/components/help/HelpArticles";
import { auth } from "@/auth";
import LandingPage from "@/components/landing/LandingPage";

const siteUrl = "https://chessperiment.app";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'SEO.Home' });

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        'en': `${siteUrl}/en`,
        'de': `${siteUrl}/de`
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: `${siteUrl}/${locale}`,
      type: "website",
      images: [
        {
          url: "/images/seo/og-home.png",
          width: 1200,
          height: 630,
          type: "image/png"
        }
      ],
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
  const session = await auth();
  const t = await getTranslations({ locale, namespace: 'SEO.Home' });

  if (!session) {
    return <LandingPage />;
  }

  const jsonLd_home = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/${locale}/#website`,
        "url": `${siteUrl}/${locale}`,
        "name": "Chessperiment",
        "description": t('description'),
        "inLanguage": locale
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/${locale}/#organization`,
        "name": "Chessperiment",
        "url": `${siteUrl}/${locale}`,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/icon.png`
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
