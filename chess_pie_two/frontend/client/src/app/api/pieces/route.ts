import {
    NextResponse
} from "next/server";
import { auth } from "@/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

if (process.env.FIREBASE_PRIVATE_KEY && !getApps().length) {
    initializeApp({
        credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
    });
}
const db = getFirestore();


export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { pieceType, color, pixels } = await req.json();

    if (!pieceType || !color || !pixels) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    try {
        const pieceRef = db.collection("pieces").doc(`${userId}_${pieceType}_${color}`);
        await pieceRef.set({
            userId,
            pieceType,
            color,
            pixels,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving piece:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
