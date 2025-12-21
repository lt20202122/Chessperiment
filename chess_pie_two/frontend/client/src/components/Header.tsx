"use client"
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { Bungee } from "next/font/google";
import { Menu, X } from 'lucide-react';

const bungee = Bungee({
    subsets: ["latin"],
    weight: ["400"],
});

export function Header() {
    const t = useTranslations('Header');
    const locale = useLocale();
    const pathname = usePathname();
    const small = pathname?.includes("/game")
    const [isMenuOpen, setIsMenuOpen] = useState(false);


    return (
        <>
            <header className={`flex justify-between items-center lg:px-5 pt-2 ${small ? "group" : "pb-10"} bg-bg relative z-50`}>
                <Link href="/" className={`${bungee.className} [font-variant-caps:small-caps] ml-1.5 lg:ml-0 transition-color duration-300 ${small ? "text-3xl lg:text-5xl text-amber-400/50 group-hover:text-amber-400" : "text-4xl lg:text-7xl text-yellow-400 dark:text-amber-400"} caret-transparent`}>ChessPie</Link>

                {/* Desktop Nav */}
                <div className={`hidden lg:flex gap-4 items-center`}>
                    <div className="flex gap-2">
                        <Link href="/game" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('play')}</Link>
                        <Link href="/editor/board" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('boardEditor')}</Link>
                        <Link href="/editor/piece" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('pieceEditor')}</Link>
                        <Link href="/news" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('news')}</Link>
                        <Link href="/login" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('login')}</Link>
                    </div>
                    <div className="flex relative items-center bg-amber-400/10 rounded-full p-1 border border-amber-400/20 ml-4 focus-within:ring-2 focus-within:ring-amber-400/40 outline-none">
                        <div
                            className={`absolute h-6 w-8 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-[0_0_8px_rgba(245,158,11,0.5)]`}
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

                {/* Mobile Menu Toggle */}
                <button
                    className="lg:hidden p-2 mr-2 text-amber-400 outline-none hover:bg-amber-400/10 rounded-xl transition-colors"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label={t('menu')}
                    title={t('menu')}
                >
                    {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
                </button>

                {/* Mobile Nav Overlay */}
                {isMenuOpen && (
                    <div className="fixed inset-0 bg-bg/80 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
                        {/* Close button inside overlay */}
                        <button
                            className="absolute top-4 right-4 p-4 text-amber-400 hover:scale-110 transition-transform"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <X size={48} strokeWidth={2} />
                        </button>

                        <div className="flex flex-col gap-8 w-full max-w-sm">
                            <Link
                                href="/game"
                                className="group flex items-center justify-between text-4xl font-black text-white hover:text-accent transition-colors border-b-4 border-amber-400/20 pb-4"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span>{t('play')}</span>
                                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent group-hover:text-bg transition-all">
                                    <Menu size={24} />
                                </div>
                            </Link>
                            <Link
                                href="/editor/board"
                                className="group flex items-center justify-between text-4xl font-black text-white hover:text-accent transition-colors border-b-4 border-amber-400/20 pb-4"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span>{t('boardEditor')}</span>
                                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent group-hover:text-bg transition-all">
                                    <Menu size={24} />
                                </div>
                            </Link>
                            <Link
                                href="/editor/piece"
                                className="group flex items-center justify-between text-4xl font-black text-white hover:text-accent transition-colors border-b-4 border-amber-400/20 pb-4"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span>{t('pieceEditor')}</span>
                                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent group-hover:text-bg transition-all">
                                    <Menu size={24} />
                                </div>
                            </Link>
                            <Link
                                href="/news"
                                className="group flex items-center justify-between text-4xl font-black text-white hover:text-accent transition-colors border-b-4 border-amber-400/20 pb-4"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span>{t('news')}</span>
                                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent group-hover:text-bg transition-all">
                                    <Menu size={24} />
                                </div>
                            </Link>
                            <Link
                                href="/login"
                                className="group flex items-center justify-between text-4xl font-black text-white hover:text-accent transition-colors border-b-4 border-amber-400/20 pb-4"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <span>{t('login')}</span>
                                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center group-hover:bg-accent group-hover:text-bg transition-all">
                                    <Menu size={24} />
                                </div>
                            </Link>
                        </div>

                        <div className="flex gap-12 justify-center mt-16 scale-125">
                            <Link
                                href={pathname}
                                locale="en"
                                className={`text-xl font-black tracking-tighter ${locale === 'en' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-amber-400/40'}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t('english')}
                            </Link>
                            <Link
                                href={pathname}
                                locale="de"
                                className={`text-xl font-black tracking-tighter ${locale === 'de' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-amber-400/40'}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {t('german')}
                            </Link>
                        </div>
                    </div>
                )}
            </header>
        </>
    )
}