import { db } from "@/lib/firebase";
import { GameResult, UserStats, SavedBoard, PieceSet, CustomPiece } from "@/types/firestore";
import { Project } from "@/types/Project";

export type { GameResult, UserStats, SavedBoard, PieceSet, CustomPiece };


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

export async function deleteUserAccount(userId: string) {
    if (!db) throw new Error("Firestore not initialized");

    const batch = db.batch();

    // 1. Delete user document
    batch.delete(db.collection("users").doc(userId));

    // 2. Delete accounts associated with user
    const accounts = await db.collection("accounts").where("userId", "==", userId).get();
    accounts.forEach(doc => batch.delete(doc.ref));

    // 3. Delete sessions associated with user
    const sessions = await db.collection("sessions").where("userId", "==", userId).get();
    sessions.forEach(doc => batch.delete(doc.ref));

    // 4. Delete user stats
    batch.delete(db.collection("userStats").doc(userId));

    // 5. Delete game history
    const history = await db.collection("gameHistory").where("userId", "==", userId).get();
    history.forEach(doc => batch.delete(doc.ref));

    // 6. Delete boards
    const boards = await db.collection("boards").where("userId", "==", userId).get();
    boards.forEach(doc => batch.delete(doc.ref));

    // 7. Delete piece sets
    const sets = await db.collection("pieceSets").where("userId", "==", userId).get();
    sets.forEach(doc => batch.delete(doc.ref));

    // 8. Delete custom pieces
    const pieces = await db.collection("customPieces").where("userId", "==", userId).get();
    pieces.forEach(doc => batch.delete(doc.ref));

    await batch.commit();
}

export async function updateUserName(userId: string, newName: string) {
    if (!db) throw new Error("Firestore not initialized");
    await db.collection("users").doc(userId).update({ name: newName });
}

// ==================== PROJECT FUNCTIONS ====================

// Project functions are handled below using the imported Project type from @/types/Project

export async function saveProject(project: Project) {
    if (!db) throw new Error("Firestore not initialized");
    const projectsRef = db.collection("projects");

    // Serialize custom pieces
    const serializedProject: any = {
        ...project,
        customPieces: project.customPieces.map(piece => ({
            ...piece,
            pixelsWhite: JSON.stringify(piece.pixelsWhite),
            pixelsBlack: JSON.stringify(piece.pixelsBlack),
            logic: piece.logic !== undefined ? JSON.stringify(piece.logic) : undefined
        }))
    };

    if (project.id) {
        const projectId = project.id;
        const projectToUpdate = { ...serializedProject } as any;
        delete projectToUpdate.id;
        await projectsRef.doc(projectId).update({
            ...projectToUpdate,
            updatedAt: new Date()
        });
        return projectId;
    } else {
        const docRef = await projectsRef.add({
            ...serializedProject,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    }
}

export async function getUserProjects(userId: string): Promise<Project[]> {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection("projects")
        .where("userId", "==", userId)
        .get();

    const projects = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            customPieces: (data.customPieces || []).map((piece: any) => ({
                ...piece,
                pixelsWhite: typeof piece.pixelsWhite === 'string' ? JSON.parse(piece.pixelsWhite) : piece.pixelsWhite,
                pixelsBlack: typeof piece.pixelsBlack === 'string' ? JSON.parse(piece.pixelsBlack) : piece.pixelsBlack,
                logic: typeof piece.logic === 'string' ? JSON.parse(piece.logic) : piece.logic,
            })),
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as Project;
    });

    return projects.sort((a, b) => {
        const dateA = a.updatedAt instanceof Date ? a.updatedAt.getTime() : 0;
        const dateB = b.updatedAt instanceof Date ? b.updatedAt.getTime() : 0;
        return dateB - dateA;
    });
}

export async function getProject(projectId: string, userId: string): Promise<Project | null> {
    if (!db) throw new Error("Firestore not initialized");
    if (!projectId) return null;
    
    const projectRef = db.collection("projects").doc(projectId);
    const doc = await projectRef.get();

    if (!doc.exists || doc.data()?.userId !== userId) {
        return null;
    }

    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        customPieces: (data?.customPieces || []).map((piece: any) => ({
            ...piece,
            pixelsWhite: typeof piece.pixelsWhite === 'string' ? JSON.parse(piece.pixelsWhite) : piece.pixelsWhite,
            pixelsBlack: typeof piece.pixelsBlack === 'string' ? JSON.parse(piece.pixelsBlack) : piece.pixelsBlack,
            logic: typeof piece.logic === 'string' ? JSON.parse(piece.logic) : piece.logic,
        })),
        createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : data?.createdAt,
        updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : data?.updatedAt,
    } as Project;
}

export async function deleteProject(projectId: string, userId: string) {
    if (!db) throw new Error("Firestore not initialized");
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists || projectDoc.data()?.userId !== userId) {
        throw new Error("Project not found or unauthorized");
    }

    await projectRef.delete();
}

export async function toggleProjectStar(projectId: string, userId: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    if (!projectId) return false;
    
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists || projectDoc.data()?.userId !== userId) {
        throw new Error("Project not found or unauthorized");
    }

    const currentStarred = projectDoc.data()?.isStarred || false;
    await projectRef.update({ isStarred: !currentStarred, updatedAt: new Date() });
    return !currentStarred;
}

// ==================== MIGRATION UTILITIES ====================

export async function hasUserMigrated(userId: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized");
    const migrationRef = db.collection("user_migrations").doc(userId);
    const doc = await migrationRef.get();
    return doc.exists;
}

export async function markUserMigrated(userId: string) {
    if (!db) throw new Error("Firestore not initialized");
    const migrationRef = db.collection("user_migrations").doc(userId);
    await migrationRef.set({
        userId,
        migratedAt: new Date(),
        version: 1
    });
}

export async function getUserLegacyBoards(userId: string): Promise<SavedBoard[]> {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection("legacy_boards")
        .where("userId", "==", userId)
        .get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as SavedBoard;
    });
}

export async function getUserLegacyPieceSets(userId: string): Promise<PieceSet[]> {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection("legacy_pieceSets")
        .where("userId", "==", userId)
        .get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
        } as PieceSet;
    });
}

export async function getLegacySetPieces(setId: string, userId: string): Promise<CustomPiece[]> {
    if (!db) throw new Error("Firestore not initialized");
    const snapshot = await db.collection("legacy_customPieces")
        .where("setId", "==", setId)
        .where("userId", "==", userId)
        .get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        
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
        } as CustomPiece;
    });
}

export async function migrateUserData(userId: string): Promise<void> {
    console.log(`[MIGRATE] Function called for: ${userId}`);
    if (!db) throw new Error("Firestore not initialized");
    
    // Check if user has already migrated
    const already = await hasUserMigrated(userId);
    console.log(`[MIGRATE] Check hasUserMigrated: ${already}`);
    if (already) {
        return;
    }

    // Get all legacy boards
    console.log(`[MIGRATE] Fetching legacy boards...`);
    const legacyBoards = await getUserLegacyBoards(userId);
    console.log(`[MIGRATE] Found ${legacyBoards.length} legacy boards.`);
    
    // For each legacy board, create a new project (parallelized)
    await Promise.all(legacyBoards.map(async (board) => {
        const project: Project = {
            userId: board.userId,
            name: board.name,
            description: `Migrated from board: ${board.name}`,
            isStarred: board.isStarred,
            createdAt: board.createdAt,
            updatedAt: board.updatedAt,
            rows: board.rows,
            cols: board.cols,
            gridType: board.gridType,
            activeSquares: board.activeSquares,
            placedPieces: board.placedPieces,
            customPieces: []
        };
        
        return saveProject(project);
    }));
    
    // Mark user as migrated
    await markUserMigrated(userId);
}
