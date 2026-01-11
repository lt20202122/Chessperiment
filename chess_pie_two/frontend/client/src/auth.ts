import NextAuth from "next-auth"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { cert } from "firebase-admin/app"
import { authConfig } from "./auth.config"



const firestoreAdapter = process.env.FIREBASE_PROJECT_ID
    ? FirestoreAdapter({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    })
    : undefined

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: firestoreAdapter,
    ...authConfig,
})

