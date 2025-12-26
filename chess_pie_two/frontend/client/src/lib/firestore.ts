import { cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { initializeApp, getApps, cert as adminCert } from "firebase-admin/app"

// Initialize Firebase Admin if not already initialized
if (!getApps().length && process.env.FIREBASE_PROJECT_ID) {
    try {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        })
    } catch (error) {
        console.error("Error initializing Firebase Admin:", error);
    }
}

const db = process.env.FIREBASE_PROJECT_ID ? getFirestore() : null

export interface GameResult {
    userId: string
    result: "win" | "loss" | "draw"
    opponent?: string
    timestamp: Date
    roomId?: string
}

export interface UserStats {
    userId: string
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    rating: number
}

export async function saveGameResult(gameResult: GameResult) {
    if (!db) throw new Error("Firestore not initialized")

    const userStatsRef = db.collection("userStats").doc(gameResult.userId)
    const gameHistoryRef = db.collection("gameHistory")

    // Save game to history
    await gameHistoryRef.add({
        ...gameResult,
        timestamp: gameResult.timestamp,
    })

    // Update user stats
    const userStatsDoc = await userStatsRef.get()

    if (userStatsDoc.exists) {
        const currentStats = userStatsDoc.data() as UserStats
        const updates: Partial<UserStats> = {
            gamesPlayed: currentStats.gamesPlayed + 1,
            wins: currentStats.wins + (gameResult.result === "win" ? 1 : 0),
            losses: currentStats.losses + (gameResult.result === "loss" ? 1 : 0),
            draws: currentStats.draws + (gameResult.result === "draw" ? 1 : 0),
        }

        await userStatsRef.update(updates)
    } else {
        // Create new stats document
        const newStats: UserStats = {
            userId: gameResult.userId,
            gamesPlayed: 1,
            wins: gameResult.result === "win" ? 1 : 0,
            losses: gameResult.result === "loss" ? 1 : 0,
            draws: gameResult.result === "draw" ? 1 : 0,
            rating: 1500, // Default starting rating
        }

        await userStatsRef.set(newStats)
    }
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
    if (!db) throw new Error("Firestore not initialized")

    const userStatsDoc = await db.collection("userStats").doc(userId).get()

    if (!userStatsDoc.exists) {
        return null
    }

    return userStatsDoc.data() as UserStats
}

export async function getGameHistory(userId: string, limit: number = 10) {
    if (!db) throw new Error("Firestore not initialized")

    const gamesSnapshot = await db
        .collection("gameHistory")
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get()

    return gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }))
}
