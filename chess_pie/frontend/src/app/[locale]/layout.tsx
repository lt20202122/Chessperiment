import type { Metadata } from "next";
import "../globals.css";
import {Lexend} from 'next/font/google'
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {routing} from '@/i18n/routing';
import {Header} from "@/components/Header"

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

const lex = Lexend({
    subsets: ["latin"],
    weight: ["400"],
});

export const metadata: Metadata = {
title: "chessPie",
description: "Play fun versions of chess from everywhere you want!",
};

export default async function RootLayout({
    children,
    params
    }: Readonly<{
    children: React.ReactNode;
    params: Promise<{locale: string}>;
    }>) {
        const {locale} = await params;
    return (
        <html lang={locale} className={`${lex.className}`} suppressHydrationWarning={false}>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body className="bg-bg">
                <NextIntlClientProvider>
                <Header />

                {children}
                </NextIntlClientProvider>
            </body>
        </html> 
    );
}