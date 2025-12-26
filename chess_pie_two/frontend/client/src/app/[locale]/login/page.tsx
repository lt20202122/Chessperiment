import LoginPage from "./LoginPage"
import { Bungee } from "next/font/google"
import type { Metadata } from "next";
import { generateHreflangs } from '@/lib/hreflang';

const hreflangs = generateHreflangs('/game', ['de', 'en'], 'en', 'https://chesspie.de');

export const metadata: Metadata = {
    title: 'Login – ChessPie',
    description: 'Access your ChessPie account to manage games, boards, and marketplace items.',
    openGraph: {
        title: 'Login – ChessPie',
        description: 'Access your ChessPie account to manage games, boards, and marketplace items.',
        url: 'https://chesspie.de/login',
        siteName: 'ChessPie',
        images: ['/og-login.png'],
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Login – ChessPie',
        description: 'Access your ChessPie account to manage games, boards, and marketplace items.',
        images: ['/og-login.png'],
    },
    alternates: {
        canonical: "https://chesspie.de/login", // absolute URL
        languages: hreflangs.reduce((acc, tag) => {
            acc[tag.hrefLang] = tag.href;
            return acc;
        }, {} as Record<string, string>),
    },
};

const bungee = Bungee({
    subsets: ["latin"],
    display: "swap",
    weight: ["400"],
})

export default function LoginPageServerSide() {
    return <LoginPage bungee={bungee.className} />
}