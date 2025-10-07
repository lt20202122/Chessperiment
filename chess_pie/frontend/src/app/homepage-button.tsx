"use client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation";

export default function HomepageButton () {
    const router = useRouter()
    return(
        <Button variant="secondary" onClick={()=>{router.push("/")}} className="bg-blue-400 text-black">Go back to Homepage</Button>
    )
}