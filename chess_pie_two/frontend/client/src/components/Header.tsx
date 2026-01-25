"use client"
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Bungee } from "next/font/google";
import { Menu, X } from 'lucide-react';

const bungee = Bungee({
    display: "swap",
    subsets: ["latin"],
    weight: ["400"],
});

export function Header({ pathname, locale, isMenuOpen, setIsMenuOpen }: { pathname: string, locale: string, isMenuOpen: boolean, setIsMenuOpen: (val: boolean) => void }) {
    const t = useTranslations('Header');

    const small = pathname?.includes("/game")

    return (
        <header className={`flex justify-between items-center px-4 lg:px-5 pt-2 ${small ? "group" : "pb-6 lg:pb-10"} bg-bg relative z-50`}>
            <div className="flex items-center gap-2">
                <button
                    className="lg:hidden p-2 text-amber-400 outline-none hover:bg-amber-400/10 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={t('menu')}
                    title={t('menu')}
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
                <Link href="/" className="flex items-center gap-2 group/logo transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                    <img
                        src="/logo.png"
                        alt="ChessPie Logo"
                        className={`transition-all duration-300 ${small ? "h-8 w-8" : "h-12 w-12"} object-contain`}
                    />
                    <span className={`${bungee.className} [font-variant-caps:small-caps] ${small ? "text-2xl md:text-3xl lg:text-5xl text-amber-400/50 group-hover/logo:text-amber-400" : "text-4xl md:text-5xl lg:text-7xl text-amber-400"} caret-transparent drop-shadow-sm`}>
                        ChessPie
                    </span>
                </Link>
            </div>

            {/* Desktop Nav */}
            <div className={`hidden lg:flex gap-4 items-center`}>
                <div className="flex gap-2">
                    <Link href="/game" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('play')}</Link>
                    <Link href="/editor/board" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('boardEditor')}</Link>
                    <Link href="/editor/piece" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('pieceEditor')}</Link>
                    <Link href="/announcements" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('news')}</Link>
                    <Link href="/marketplace" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('marketplace')}</Link>
                    <Link href="/library" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('library')}</Link>
                    <Link href="/about" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('about')}</Link>
                    <Link href="/login" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('login')}</Link>
                </div>
                <div className="flex relative items-center bg-amber-400/10 rounded-full p-1 border border-amber-400/20 ml-4 focus-within:ring-2 focus-within:ring-amber-400/40 outline-none">
                    <div
                        className={`absolute h-6 w-8 bg-linear-to-br from-amber-300 to-amber-500 rounded-full transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_0_8px_rgba(245,158,11,0.5)]`}
                        style={{
                            left: locale === 'en' ? '4px' : '36px',
                        }}
                    />
                    <Link
                        href={pathname}
                        locale="en"
                        className={`relative z-10 w-8 h-6 flex items-center justify-center text-xs font-bold transition-colors duration-300 ${locale === 'en' ? 'text-bg' : 'text-amber-400/60 hover:text-amber-400'}`}
                    >
                        EN
                    </Link>
                    <Link
                        href={pathname}
                        locale="de"
                        className={`relative z-10 w-8 h-6 flex items-center justify-center text-xs font-bold transition-colors duration-300 ${locale === 'de' ? 'text-bg' : 'text-amber-400/60 hover:text-amber-400'}`}
                    >
                        DE
                    </Link>
                </div>
            </div>

        </header>
    )
}
