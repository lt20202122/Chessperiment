'use client';

import { 
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase-client';
import { Project } from '@/types/Project';
import { GameResult, UserStats, SavedBoard, PieceSet, CustomPiece } from '@/types/firestore';

export type { GameResult, UserStats, SavedBoard, PieceSet, CustomPiece };

// Client-side Project CRUD operations using Firebase client SDK

export async function saveProject(project: Project): Promise<string> {
    const projectsRef = collection(db, 'projects');
    
    if (project.id) {
        const projectDoc = doc(projectsRef, project.id);
        const { id, ...projectData } = project;
        await updateDoc(projectDoc, {
            ...projectData,
            updatedAt: Timestamp.now(),
        });
        return project.id;
    } else {
        const newProjectDoc = doc(projectsRef);
        await setDoc(newProjectDoc, {
            ...project,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return newProjectDoc.id;
    }
}

export async function getUserProjects(userId: string): Promise<Project[]> {
    const projectsRef = collection(db, 'projects');
    const q = query(
        projectsRef,
        where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const projects = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Project;
    });

    // Sort in memory to avoid needing a composite index
    return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export async function getProject(projectId: string, userId?: string): Promise<Project | null> {
    const projectDoc = doc(db, 'projects', projectId);
    const snapshot = await getDoc(projectDoc);
    
    if (!snapshot.exists()) {
        return null;
    }
    
    const data = snapshot.data();
    return {
        id: snapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Project;
}

export async function deleteProject(projectId: string): Promise<void> {
    const projectDoc = doc(db, 'projects', projectId);
    await deleteDoc(projectDoc);
}

export async function toggleProjectStar(projectId: string, isStarred: boolean): Promise<void> {
    const projectDoc = doc(db, 'projects', projectId);
    await updateDoc(projectDoc, {
        isStarred,
        updatedAt: Timestamp.now(),
    });
}

// Migration utilities
export async function hasUserMigrated(userId: string): Promise<boolean> {
    const migrationDoc = doc(db, 'user_migrations', userId);
    const snapshot = await getDoc(migrationDoc);
    return snapshot.exists();
}

export async function markUserMigrated(userId: string): Promise<void> {
    const migrationDoc = doc(db, 'user_migrations', userId);
    await setDoc(migrationDoc, {
        migratedAt: Timestamp.now(),
        userId,
    });
}

export async function getPieceSetPieces(setId: string): Promise<CustomPiece[]> {
    const piecesRef = collection(db, 'custom_pieces');
    const q = query(piecesRef, where('setId', '==', setId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
        } as CustomPiece;
    });
}

export async function importToProject(
    projectId: string, 
    sourceData: SavedBoard | PieceSet, 
    type: 'board' | 'set'
): Promise<void> {
    const project = await getProject(projectId);
    if (!project) throw new Error('Project not found');

    const projectDoc = doc(db, 'projects', projectId);

    if (type === 'board') {
        const board = sourceData as SavedBoard;
        await updateDoc(projectDoc, {
            rows: board.rows,
            cols: board.cols,
            gridType: board.gridType || 'square',
            activeSquares: board.activeSquares,
            placedPieces: board.placedPieces,
            updatedAt: Timestamp.now()
        });
    } else {
        const set = sourceData as PieceSet;
        const pieces = await getPieceSetPieces(set.id!);
        
        // Map pieces to project format (remove setId, add projectId)
        const updatedPieces: CustomPiece[] = [
            ...project.customPieces,
            ...pieces.map(p => ({
                ...p,
                projectId,
                setId: '' // Clear legacy setId
            }))
        ];

        await updateDoc(projectDoc, {
            customPieces: updatedPieces,
            updatedAt: Timestamp.now()
        });
    }
}
