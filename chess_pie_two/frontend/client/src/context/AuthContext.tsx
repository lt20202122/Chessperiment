'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { User as NextAuthUser } from 'next-auth';

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

    // Map next-auth user to our User type with uid
    const user: User | null = session?.user ? {
        ...session.user,
        uid: (session.user as any).id || (session.user as any).uid || session.user.email || '',
    } as User : null;

    const value: AuthContextType = {
        user,
        loading: status === 'loading',
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
