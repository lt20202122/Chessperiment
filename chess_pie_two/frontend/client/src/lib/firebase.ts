import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

const firebaseConfig = process.env.FIREBASE_PRIVATE_KEY ? {
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
} : null;

if (firebaseConfig && !getApps().length) {
    initializeApp(firebaseConfig);
}

export const db = firebaseConfig ? getFirestore() : null;

