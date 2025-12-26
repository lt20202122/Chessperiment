
import { NextResponse } from "next/server";
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

export async function GET(req: Request, { params }: { params: { piece: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { piece } = params;
    const [pieceType, color] = piece.split('_');

    if (!pieceType || !color) {
        return NextResponse.json({ error: "Invalid piece identifier" }, { status: 400 });
    }

    try {
        const pieceRef = db.collection("pieces").doc(`${userId}_${pieceType}_${color}`);
        const doc = await pieceRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Piece not found" }, { status: 404 });
        }

        return NextResponse.json(doc.data());
    } catch (error) {
        console.error("Error loading piece:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
