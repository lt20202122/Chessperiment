import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";

function getFirebaseAdminApp() {
    if (getApps().length > 0) {
        return getApp();
    }

    if (!process.env.FIREBASE_PRIVATE_KEY) {
        console.error("FIREBASE_PRIVATE_KEY is not set");
        return null;
    }

    return initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
}

const app = getFirebaseAdminApp();
export const db = app ? getFirestore(app) : null;

