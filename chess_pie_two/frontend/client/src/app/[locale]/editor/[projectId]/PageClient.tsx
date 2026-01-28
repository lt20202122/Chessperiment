'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Project } from '@/types/Project';
import { getProject } from '@/lib/firestore-client';
import { Loader2 } from 'lucide-react';
import ProjectEditorSidebar from '@/components/editor/ProjectEditorSidebar';
import BottomPiecePanel from '@/components/editor/BottomPiecePanel';

interface PageClientProps {
    projectId: string;
}

export default function PageClient({ projectId }: PageClientProps) {
    const t = useTranslations('ProjectView');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        loadProject();
    }, [user, authLoading, projectId, router]);

    async function loadProject() {
        if (!user) return;

        setLoading(true);
        try {
            const loadedProject = await getProject(projectId, user.uid);
            if (!loadedProject) {
                router.push('/editor');
                return;
            }
            setProject(loadedProject);
        } catch (error) {
            console.error('Error loading project:', error);
            router.push('/editor');
        } finally {
            setLoading(false);
        }
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <div className="relative min-h-screen">
            {/* Board display area */}
            <div className="pt-24 pb-32 px-4">
                <div className="container mx-auto">
                    <h1 className="text-3xl font-bold mb-6">{project.name}</h1>
                    {project.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-8">{project.description}</p>
                    )}

                    {/* TODO: Add board visualization component here */}
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
                        <p className="text-gray-500">Board view coming soon</p>
                        <p className="text-sm text-gray-400 mt-2">{project.rows}×{project.cols} board</p>
                    </div>
                </div>
            </div>

            {/* Editor Sidebar */}
            <ProjectEditorSidebar projectId={projectId} />

            {/* Bottom Piece Panel */}
            <BottomPiecePanel project={project} />
        </div>
    );
}
