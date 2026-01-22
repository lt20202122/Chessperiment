import LoginPage from "./LoginPage"
import { Bungee } from "next/font/google"
import type { Metadata } from "next";
import { generateHreflangs } from '@/lib/hreflang';

import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Login' });
    const hreflangs = generateHreflangs('/login', ['de', 'en'], 'en', 'https://chesspie.org');

    return {
        title: t('title'),
        description: t('description'),
        alternates: {
            canonical: "https://chesspie.org/en/login",
            languages: hreflangs.reduce((acc, tag) => {
                acc[tag.hrefLang] = tag.href;
                return acc;
            }, {} as Record<string, string>),
        },
        openGraph: {
            title: t('title'),
            description: t('description'),
            url: 'https://chesspie.org/en/login',
            siteName: 'ChessPie',
            images: ['/images/seo/og-home.png'],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('title'),
            description: t('description'),
            images: ['/images/seo/og-home.png'],
        },
        robots: {
            index: false,
            follow: true,
        },
    };
}

const bungee = Bungee({
    subsets: ["latin"],
    display: "swap",
    weight: ["400"],
})

export default async function LoginPageServerSide({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SEO.Login' });

    return (
        <>
            <h1 className="sr-only">{t('h1')}</h1>
            <LoginPage bungee={bungee.className} />
        </>
    );
}