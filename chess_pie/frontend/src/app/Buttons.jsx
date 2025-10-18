"use client"
import { Button } from "@/components/ui/button"
import {useRouter} from 'next/navigation'
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip"


export default function Btn() {
    const router = useRouter()

    return (
    <TooltipProvider delayDuration={1200}>
    <Tooltip>
    <TooltipTrigger asChild>
    <Button variant="outline" className={`hover:bg-Btns-regular transition-all duration-400 
    hover:scale-105 antialiased text-4xl
    h-[3.69rem] w-[36rem] cursor-pointer`} onClick={() => {
        router.push("/game")
        fetch("http://127.0.0.1:5000/start"); console.log("Start fetched")}}>Play</Button>
    </TooltipTrigger>
    <TooltipContent>
        <p>Play standard chess to improve your elo!</p>
    </TooltipContent>
    </Tooltip>
    </TooltipProvider>
    );
}