
import type { Metadata } from 'next';
import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.org');

export const metadata: Metadata = {
    title: 'ChessPie User Profiles',
    description: 'View and manage ChessPie user profiles.',
    openGraph: {
        title: 'ChessPie User Profiles',
        description: 'View and manage ChessPie user profiles.',
        url: 'https://chesspie.org/profile',
        siteName: 'ChessPie',
        images: ['/og-profile.png'],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'ChessPie User Profiles',
        description: 'View and manage ChessPie user profiles.',
        images: ['/og-profile.png'],
    },
    alternates: {
        canonical: "https://chesspie.org/profile", // absolute URL
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
