
import type { Metadata } from 'next';
import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.org');

export const metadata: Metadata = {
    title: 'ChessPie User Profiles',
    description: 'View and manage ChessPie user profiles.',
    openGraph: {
        title: 'ChessPie User Profiles',
        description: 'View and manage ChessPie user profiles.',
        url: 'https://chesspie.org/en/profile',
        siteName: 'ChessPie',
        images: ['/images/seo/og-home.png'],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ChessPie User Profiles',
        description: 'View and manage ChessPie user profiles.',
        images: ['/images/seo/og-home.png'],
    },
    alternates: {
        canonical: "https://chesspie.org/en/profile", // absolute URL
        languages: hreflangs.reduce((acc, tag) => {
            acc[tag.hrefLang] = tag.href;
            return acc;
        }, {} as Record<string, string>),
    },
};

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
        </>
    );
}
