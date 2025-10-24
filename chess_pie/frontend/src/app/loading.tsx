import { Square } from 'ldrs/react'
import Link from 'next/link'
import 'ldrs/react/Square.css'
import {Bungee } from "next/font/google";

const bungee = Bungee({
    subsets: ["latin"],
    weight: ["400"],
});

export default function Loading(){
    return (
<<<<<<< Updated upstream
        <Square
            size="80"
            stroke="6"
            strokeLength="0.25"
            bgOpacity="0.22"
            speed="1.2"
            color="rgb(115,117,0)" 
=======
        <div className="w-screen h-screen flex items-center flex-col mt-[30vh] gap-10">
                        <Link href="/" className={`${bungee.className} text-amber-400 dark:text-amber-500 [font-variant-caps:small-caps] ml-1.5 lg:ml-0 text-9xl caret-transparent`}>ChessPie</Link>
            <Square
                size="80"
                stroke="6"
                strokeLength="0.25"
                bgOpacity="0.22"
                speed="1.2"
                color="rgb(115,117,0)"
>>>>>>> Stashed changes
            />
    )
}
