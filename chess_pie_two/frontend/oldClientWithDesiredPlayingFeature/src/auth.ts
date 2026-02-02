import NextAuth from "next-auth"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { db } from "./lib/firebase"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: db ? FirestoreAdapter(db) : undefined,
    ...authConfig,
    debug: process.env.NODE_ENV === "development",
})


