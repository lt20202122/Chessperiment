"use client"
import Link from 'next/link'
import { Bungee } from "next/font/google";
import {usePathname} from 'next/navigation'
import {useRouter} from 'next/navigation'

const bungee = Bungee({
    subsets: ["latin"],
    weight: ["400"],
});

export function Header() {
    const router = useRouter()
    const pathname = usePathname();
    const small = pathname?.includes("/game")
    return (
        <>
        <header className={`flex justify-between lg:px-5 pt-2 bg-bg group ${small ? "": "mb-10"}`}>
            <Link href="/" className={`${bungee.className} [font-variant-caps:small-caps] ml-1.5 lg:ml-0 transition-color duration-300 ${small?"text-3xl lg:text-5xl text-amber-400/50 group-hover:text-amber-400":"text-4xl lg:text-7xl dark:text-amber-400 text-amber-500"} caret-transparent`}>ChessPie</Link>
            <div className={`flex gap-2`}>
                <Link href="/game" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-400/50 group-hover:text-amber-400":"dark:text-amber-500 dark:hover:text-orange-400 dark:before:bg-orange-400 hover:text-amber-500"}`}>Play</Link>
                <Link href="/news" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-400/50 group-hover:text-amber-400":"dark:text-amber-500 dark:hover:text-orange-400 dark:before:bg-orange-400 hover:text-amber-500"}`}>News</Link>
                <Link href="?notifications=True" className={`link-underline-regular cursor-pointer block ${small ? "text-amber-400/50 group-hover:text-amber-400":"dark:text-amber-500 dark:hover:text-orange-400 dark:before:bg-orange-400 hover:text-amber-500"}`}>Notifications</Link>
            </div>
        </header>
        </>
    )
}