import LoginPage from "./LoginPage"
import { Bungee } from "next/font/google"

const bungee = Bungee({
    subsets: ["latin"],
    weight: ["400"],
})

export default function LoginPageServerSide() {
    return <LoginPage bungee={bungee.className} />
}