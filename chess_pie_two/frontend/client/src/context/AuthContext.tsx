'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { User as NextAuthUser } from 'next-auth';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

// Extend User type to include uid for Firebase compatibility
export interface User extends NextAuthUser {
    uid: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [firebaseLoading, setFirebaseLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
            setFirebaseLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Determine the user object
    let user: User | null = null;

    if (session?.user) {
        // Prefer NextAuth session if available (e.g. Google Login)
        user = {
            ...session.user,
            uid: (session.user as any).id || (session.user as any).uid || session.user.email || '',
        } as User;
    } else if (firebaseUser) {
        // Fallback to Firebase Client Auth (e.g. Email/Password)
        user = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || null,
            email: firebaseUser.email || null,
            image: firebaseUser.photoURL || null,
        } as User;
    }

    const value: AuthContextType = {
        user,
        loading: status === 'loading' || firebaseLoading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
