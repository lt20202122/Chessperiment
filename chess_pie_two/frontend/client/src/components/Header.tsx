"use client"
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Bungee } from "next/font/google";

const bungee = Bungee({
    display: "swap",
    subsets: ["latin"],
    weight: ["400"],
});

export function Header({ pathname, locale }: { pathname: string, locale: string }) {
    const t = useTranslations('Header');

    const small = pathname?.includes("/game")

    return (
        <header className={`flex justify-between items-center lg:px-5 pt-2 ${small ? "group" : "pb-10"} bg-bg relative z-50`}>
            <Link href="/" className={`${bungee.className} [font-variant-caps:small-caps] ml-1.5 lg:ml-0 transition-colors duration-300 ${small ? "text-3xl lg:text-5xl text-amber-400/50 dark:text-amber-400/50 group-hover:text-amber-400 dark:group-hover:text-amber-400" : "text-4xl lg:text-7xl text-amber-400"} caret-transparent`}>ChessPie</Link>

            {/* Desktop Nav */}
            <div className={`hidden lg:flex gap-4 items-center`}>
                <div className="flex gap-2">
                    <Link href="/game" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('play')}</Link>
                    <Link href="/editor/board" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('boardEditor')}</Link>
                    <Link href="/editor/piece" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('pieceEditor')}</Link>
                    <Link href="/announcements" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('news')}</Link>
                    <Link href="/marketplace" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('marketplace')}</Link>
                    <Link href="/library" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-600/50 dark:text-amber-400/50 group-hover:text-accent" : "text-accent dark:before:accent hover:text-accent-hover"}`}>{t('library')}</Link>
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
