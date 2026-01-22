import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";

function getFirebaseAdminApp() {
    if (getApps().length > 0) {
        return getApp();
    }

    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!privateKey) {
        console.error("FIREBASE_PRIVATE_KEY is not set");
        return null;
    }

    // Defensive parsing for Vercel/Docker env vars
    const formattedKey = privateKey
        .trim()
        .replace(/^["']|["']$/g, '')
        .replace(/\\n/g, '\n');

    return initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: formattedKey,
        }),
    });
}

const app = getFirebaseAdminApp();
if (app) {
    console.log("Firebase Admin initialized successfully");
} else {
    console.warn("Firebase Admin failed to initialize (check env vars)");
}

export const db = app ? getFirestore(app) : null;

