"use client"
import Link from 'next/link'
import { Merriweather, Sriracha, Bungee_Spice, Bungee, Roboto } from "next/font/google";
import {usePathname} from 'next/navigation'

const merri = Merriweather({
    subsets: ["latin"],
    weight: ["400", "700"],
});

const roboto = Roboto({
    subsets: ["latin"],
    weight: ["400", "700"],
});

const bungee = Bungee({
    subsets: ["latin"],
    weight: ["400"],
});

const sri = Sriracha({
    subsets: ["latin"],
    weight: ["400"],
});

const bun_spl = Bungee_Spice({
    subsets: ["latin"],
    weight: ["400"],
});

export function Header() {
    const pathname = usePathname();
    const hide = pathname?.startsWith("/game")
    if (hide) return null
    return (
        <header className="bg-amber-100 flex justify-between lg:px-5">
            <Link href="/" className={`text-4xl lg:text-7xl ${bungee.className} text-amber-400 [font-variant-caps:small-caps] ml-1.5 lg:ml-0`}>ChessPie</Link>
            <div className="flex gap-2">
                <Link href="/play" className={`link-underline-regular`}>Play</Link>
                <Link href="/support" className="link-underline-regular">Support</Link>
                <Link href="?notifications=true" className="link-underline-regular mr-1 lg:mr-0">Notifications</Link>
            </div>
        </header>
    )
}