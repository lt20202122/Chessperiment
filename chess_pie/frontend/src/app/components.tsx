"use client"
import Link from 'next/link'
import { Merriweather, Sriracha, Bungee_Spice, Bungee, Roboto } from "next/font/google";
import {usePathname} from 'next/navigation'
import { useModal } from '@/components/modalContext';

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
    const {setModalOpen} = useModal();
    const pathname = usePathname();
    const small = pathname?.startsWith("/game")
    return (
        <header className={`bg-headerLight flex justify-between lg:px-5 dark:bg-headerDark dark:pt-2`}>
            <Link href="/" className={`${bungee.className} text-amber-400 dark:text-amber-500 [font-variant-caps:small-caps] ml-1.5 lg:ml-0 ${small?"text-3xl lg:text-6xl":"text-4xl lg:text-7xl"} caret-transparent`}>ChessPie</Link>
            <div className={`flex gap-2`}>
                <button className={`link-underline-regular cursor-pointer`}
                onClick={()=>{
                    setModalOpen(true)
                }}>Play</button>
                <Link href="/support" className="link-underline-regular">Support</Link>
                <Link href={`${pathname}?notifications=true`} className="link-underline-regular mr-1 lg:mr-0">Notifications</Link>
            </div>
        </header>
    )
}