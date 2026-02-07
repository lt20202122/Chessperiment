"use client";
import React, { useEffect, useState } from 'react';
import PlayBoard from '@/components/game/PlayBoard';
import { Project } from '@/types/Project';
import { getProjectAction } from '@/app/actions/editor';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

interface PageClientProps {
    projectId: string;
}

export default function PageClient({ projectId }: PageClientProps) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const roomId = searchParams.get('roomId');
    const mode = searchParams.get('mode');
    
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const loadProject = async () => {
            try {
                // Determine if we have the project data already or need to fetch
                // Here we fetch always to be fresh
                const result = await getProjectAction(projectId);
                if (result.success && result.data) {
                    setProject(result.data);
                } else {
                    if (mode === 'online' && roomId) {
                        console.log("Project not found locally, will attempt to load from socket");
                    } else {
                        setError(result.error || "Project not found");
                    }
                }
            } catch (err) {
                console.error("Failed to load project", err);
                if (mode === 'online' && roomId) {
                    console.log("Project load error, will attempt to load from socket");
                } else {
                    setError("Failed to load project");
                }
            } finally {
                setLoading(false);
            }
        };

        loadProject();
    }, [user, authLoading, projectId, router, mode, roomId]);

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-950 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-950 text-white">
                <div className="text-center">
                    <h2 className="text-xl font-bold mb-2 text-red-400">Error</h2>
                    <p className="text-stone-400">{error}</p>
                    <button
                        onClick={() => router.push('/editor')}
                        className="mt-4 px-4 py-2 bg-stone-800 rounded hover:bg-stone-700 transition"
                    >
                        Back to Editor
                    </button>
                </div>
            </div>
        );
    }

    return <PlayBoard project={project as any} projectId={projectId} roomId={roomId || undefined} mode={mode as 'online' | undefined} />;
}
