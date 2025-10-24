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
    const small = pathname?.startsWith("/game")
    return (
        <header className={`bg-headerLight flex justify-between lg:px-5 dark:bg-headerDark dark:pt-2`}>
            <Link href="/" className={`${bungee.className} text-amber-400 dark:text-amber-500 [font-variant-caps:small-caps] ml-1.5 lg:ml-0 ${small?"text-3xl lg:text-6xl":"text-4xl lg:text-7xl"} caret-transparent`}>ChessPie</Link>
            <div className={`flex gap-2`}>
                <button className={`link-underline-regular cursor-pointer`}>Play</button>
                <button onClick={()=>{router.push("/news")}} className="link-underline-regular">News</button>
                <button className="link-underline-regular mr-1 lg:mr-0">Notifications</button>
            </div>
        </header>
    )
}