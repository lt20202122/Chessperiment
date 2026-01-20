import { db } from "@/lib/firebase";

export interface GameResult {
    userId: string
    result: "win" | "loss" | "draw"
    opponent?: string
    timestamp: Date
    roomId?: string
    id?: string
}

export interface UserStats {
    userId: string
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    rating: number
}

export interface SavedBoard {
    id?: string
    userId: string
    name: string
    rows: number
    cols: number
    activeSquares: string[]
    placedPieces: Record<string, { type: string; color: string }>
    isStarred: boolean
    createdAt: Date
    updatedAt: Date
}

export interface PieceSet {
    id?: string
    userId: string
    name: string
    description?: string
    isStarred: boolean
    createdAt: Date
    updatedAt: Date
}

export interface CustomPiece {
    id?: string
    setId: string // Reference to parent set
    userId: string
    name: string
    pixelsWhite: string[][] // Grid for white version
    pixelsBlack: string[][] // Grid for black version
    moves: any[] // Move logic
    logic?: any // Logic blocks (triggers/effects)
    createdAt: Date
    updatedAt: Date
    color?: string // Legacy
    pixels?: string[][] // Legacy
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

    const userStatsRef = db.collection("userStats").doc(userId)
    const doc = await userStatsRef.get()

    if (!doc.exists) {
        return null
    }

    return doc.data() as UserStats
}

export async function getUserGameHistory(userId: string, limit: number = 10) {
    if (!db) throw new Error("Firestore not initialized")

    const snapshot = await db
        .collection("gameHistory")
        .where("userId", "==", userId)
        .orderBy("timestamp", "desc")
        .limit(limit)
        .get()

    return snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : data.timestamp,
        }
    }) as GameResult[]
}

export async function saveBoard(board: SavedBoard) {
    if (!db) throw new Error("Firestore not initialized")
    const boardsRef = db.collection("boards")

    if (board.id) {
        const boardId = board.id
        const boardToUpdate = { ...board } as any
        delete boardToUpdate.id
        await boardsRef.doc(boardId).update({
            ...boardToUpdate,
            updatedAt: new Date()
        })
        return boardId
    } else {
        const docRef = await boardsRef.add({
            ...board,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        return docRef.id
    }
}

export async function getUserBoards(userId: string): Promise<SavedBoard[]> {
    if (!db) throw new Error("Firestore not initialized")
    const snapshot = await db.collection("boards")
        .where("userId", "==", userId)
        .get()

    const boards = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as SavedBoard
    })

    return boards.sort((a, b) => {
        const dateA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0
        const dateB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0
        return dateB - dateA
    })
}

export async function deleteBoard(boardId: string, userId: string) {
    if (!db) throw new Error("Firestore not initialized")
    const boardRef = db.collection("boards").doc(boardId)
    const boardDoc = await boardRef.get()

    if (!boardDoc.exists || boardDoc.data()?.userId !== userId) {
        throw new Error("Board not found or unauthorized")
    }

    await boardRef.delete()
}

export async function toggleBoardStar(boardId: string, userId: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized")
    if (!boardId) return false;
    
    const boardRef = db.collection("boards").doc(boardId)
    const boardDoc = await boardRef.get()

    if (!boardDoc.exists || boardDoc.data()?.userId !== userId) {
        throw new Error("Board not found or unauthorized")
    }

    const currentStarred = boardDoc.data()?.isStarred || false
    await boardRef.update({ isStarred: !currentStarred, updatedAt: new Date() })
    return !currentStarred
}

export async function getBoard(boardId: string, userId: string): Promise<SavedBoard | null> {
    if (!db) throw new Error("Firestore not initialized")
    if (!boardId) return null;
    
    const boardRef = db.collection("boards").doc(boardId)
    const doc = await boardRef.get()

    if (!doc.exists || doc.data()?.userId !== userId) {
        return null
    }

    const data = doc.data()
    return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : data?.createdAt,
        updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : data?.updatedAt,
    } as SavedBoard
}

export async function saveCustomPiece(piece: CustomPiece) {
    if (!db) throw new Error("Firestore not initialized")
    const piecesRef = db.collection("customPieces")
    
    const serializedPiece: any = {
        ...piece,
        pixelsWhite: JSON.stringify(piece.pixelsWhite),
        pixelsBlack: JSON.stringify(piece.pixelsBlack),
    }
    
    if (piece.logic !== undefined) {
        serializedPiece.logic = JSON.stringify(piece.logic)
    }

    if (piece.id) {
        const pieceId = piece.id
        const pieceToUpdate = { ...serializedPiece } as any
        delete pieceToUpdate.id
        await piecesRef.doc(pieceId).update({
            ...pieceToUpdate,
            updatedAt: new Date()
        })
        return pieceId
    } else {
        const docRef = await piecesRef.add({
            ...serializedPiece,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        return docRef.id
    }
}

export async function getUserCustomPieces(userId: string): Promise<CustomPiece[]> {
    if (!db) throw new Error("Firestore not initialized")
    const snapshot = await db.collection("customPieces")
        .where("userId", "==", userId)
        .get()

    const pieces = snapshot.docs.map(doc => {
        const data = doc.data()
        // Support legacy pieces with 'pixels' and 'color'
        let pixelsWhite = data.pixelsWhite ? JSON.parse(data.pixelsWhite) : null;
        let pixelsBlack = data.pixelsBlack ? JSON.parse(data.pixelsBlack) : null;
        
        if (!pixelsWhite && !pixelsBlack && data.pixels) {
            const legacyPixels = typeof data.pixels === 'string' ? JSON.parse(data.pixels) : data.pixels;
            if (data.color === 'black') pixelsBlack = legacyPixels;
            else pixelsWhite = legacyPixels;
        }

        return {
            id: doc.id,
            ...data,
            pixelsWhite: pixelsWhite || Array(64).fill(Array(64).fill('transparent')),
            pixelsBlack: pixelsBlack || Array(64).fill(Array(64).fill('transparent')),
            logic: typeof data.logic === 'string' ? JSON.parse(data.logic) : data.logic,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as CustomPiece
    })

    return pieces.sort((a, b) => {
        const dateA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0
        const dateB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0
        return dateB - dateA
    })
}

export async function getCustomPiece(pieceId: string, userId: string): Promise<CustomPiece | null> {
    if (!db) throw new Error("Firestore not initialized")
    const pieceRef = db.collection("customPieces").doc(pieceId)
    const doc = await pieceRef.get()

    if (!doc.exists || doc.data()?.userId !== userId) {
        return null
    }

    const data = doc.data()
    if (!data) return null;

    let pixelsWhite = data.pixelsWhite ? JSON.parse(data.pixelsWhite) : null;
    let pixelsBlack = data.pixelsBlack ? JSON.parse(data.pixelsBlack) : null;
    
    if (!pixelsWhite && !pixelsBlack && data.pixels) {
        const legacyPixels = typeof data.pixels === 'string' ? JSON.parse(data.pixels) : data.pixels;
        if (data.color === 'black') pixelsBlack = legacyPixels;
        else pixelsWhite = legacyPixels;
    }

    return {
        id: doc.id,
        ...data,
        pixelsWhite: pixelsWhite || Array(64).fill(Array(64).fill('transparent')),
        pixelsBlack: pixelsBlack || Array(64).fill(Array(64).fill('transparent')),
        logic: typeof data.logic === 'string' ? JSON.parse(data.logic) : data.logic,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
    } as CustomPiece
}

export async function deleteCustomPiece(pieceId: string, userId: string) {
    if (!db) throw new Error("Firestore not initialized")
    const pieceRef = db.collection("customPieces").doc(pieceId)
    const pieceDoc = await pieceRef.get()

    if (!pieceDoc.exists || pieceDoc.data()?.userId !== userId) {
        throw new Error("Piece not found or unauthorized")
    }

    await pieceRef.delete()
}

// ==================== PIECE SET FUNCTIONS ====================

export async function savePieceSet(set: PieceSet) {
    if (!db) throw new Error("Firestore not initialized")
    const setsRef = db.collection("pieceSets")

    if (set.id) {
        const setId = set.id
        const setToUpdate = { ...set } as any
        delete setToUpdate.id
        await setsRef.doc(setId).update({
            ...setToUpdate,
            updatedAt: new Date()
        })
        return setId
    } else {
        const docRef = await setsRef.add({
            ...set,
            createdAt: new Date(),
            updatedAt: new Date()
        })
        return docRef.id
    }
}

export async function getUserPieceSets(userId: string): Promise<PieceSet[]> {
    if (!db) throw new Error("Firestore not initialized")
    const snapshot = await db.collection("pieceSets")
        .where("userId", "==", userId)
        .get()

    const sets = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as PieceSet
    })

    return sets.sort((a, b) => {
        const dateA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0
        const dateB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0
        return dateB - dateA
    })
}

export async function getPieceSet(setId: string, userId: string): Promise<PieceSet | null> {
    if (!db) throw new Error("Firestore not initialized")
    if (!setId) return null

    const setRef = db.collection("pieceSets").doc(setId)
    const doc = await setRef.get()

    if (!doc.exists || doc.data()?.userId !== userId) {
        return null
    }

    const data = doc.data()
    return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : data?.createdAt,
        updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : data?.updatedAt,
    } as PieceSet
}

export async function getSetPieces(setId: string, userId: string): Promise<CustomPiece[]> {
    if (!db) throw new Error("Firestore not initialized")
    const snapshot = await db.collection("customPieces")
        .where("setId", "==", setId)
        .where("userId", "==", userId)
        .get()

    const pieces = snapshot.docs.map(doc => {
        const data = doc.data()
        
        let pixelsWhite = data.pixelsWhite ? JSON.parse(data.pixelsWhite) : null;
        let pixelsBlack = data.pixelsBlack ? JSON.parse(data.pixelsBlack) : null;
        
        if (!pixelsWhite && !pixelsBlack && data.pixels) {
            const legacyPixels = typeof data.pixels === 'string' ? JSON.parse(data.pixels) : data.pixels;
            if (data.color === 'black') pixelsBlack = legacyPixels;
            else pixelsWhite = legacyPixels;
        }

        return {
            id: doc.id,
            ...data,
            pixelsWhite: pixelsWhite || Array(64).fill(Array(64).fill('transparent')),
            pixelsBlack: pixelsBlack || Array(64).fill(Array(64).fill('transparent')),
            logic: typeof data.logic === 'string' ? JSON.parse(data.logic) : data.logic,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as CustomPiece
    })

    return pieces.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
        const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
        return dateA - dateB // Oldest first
    })
}

export async function deletePieceSet(setId: string, userId: string) {
    if (!db) throw new Error("Firestore not initialized")
    
    // Verify ownership
    const setRef = db.collection("pieceSets").doc(setId)
    const setDoc = await setRef.get()

    if (!setDoc.exists || setDoc.data()?.userId !== userId) {
        throw new Error("Set not found or unauthorized")
    }

    // Delete all pieces in the set
    const piecesSnapshot = await db.collection("customPieces")
        .where("setId", "==", setId)
        .where("userId", "==", userId)
        .get()

    const batch = db.batch()
    piecesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
    })
    batch.delete(setRef)
    await batch.commit()
}

export async function togglePieceSetStar(setId: string, userId: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized")
    if (!setId) return false

    const setRef = db.collection("pieceSets").doc(setId)
    const setDoc = await setRef.get()

    if (!setDoc.exists || setDoc.data()?.userId !== userId) {
        throw new Error("Set not found or unauthorized")
    }

    const currentStarred = setDoc.data()?.isStarred || false
    await setRef.update({ isStarred: !currentStarred, updatedAt: new Date() })
    return !currentStarred
}
