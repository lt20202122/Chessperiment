import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { FirestoreAdapter } from "@auth/firebase-adapter"
import { cert } from "firebase-admin/app"

console.log("Auth config - FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("Auth config - FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("Auth config - FIREBASE_PRIVATE_KEY (first 20 chars):", process.env.FIREBASE_PRIVATE_KEY?.substring(0, 20));

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
    providers: [Google],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub
            }
            return session
        },
    },
    pages: {
        signIn: "/login",
        error: "/login", // Redirect to login page on error
    }
})
