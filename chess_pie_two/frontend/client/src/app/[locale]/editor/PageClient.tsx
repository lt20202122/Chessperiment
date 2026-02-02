"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/firebase-client';
import { Project } from '@/types/Project';
import {
    migrateUserAction,
    getUserProjectsAction,
    deleteProjectAction,
    toggleProjectStarAction,
    saveProjectAction
} from '@/app/actions/editor';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import ProjectList from '@/components/editor/ProjectList';

export default function PageClient() {
    const t = useTranslations('Editor');
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [migrating, setMigrating] = useState(false);
    const isLoadingRef = useRef(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        loadProjects();
    }, [user, authLoading, router]);

    async function loadProjects() {
        if (!user || isLoadingRef.current) return;
        isLoadingRef.current = true;

        console.time('editor-load');
        setLoading(true);
        try {
            console.log('Loading user data for:', user.uid);

            // Call server action to get projects
            // This is much faster than client-side Firestore because it uses the Admin SDK
            const result = await getUserProjectsAction();

            if (result.success && result.data && result.data.length > 0) {
                console.log('Found projects via server action:', result.data.length);
                setProjects(result.data);
                setLoading(false);
                console.timeEnd('editor-load');
                return;
            }

            // If no projects found, trigger migration check via server action
            console.log('No projects found, checking migration...');
            setMigrating(true);

            // Get ID token to authenticate server action robustly
            const idToken = await auth.currentUser?.getIdToken();
            const migrationResult = await migrateUserAction(idToken);
            console.log('Migration result:', migrationResult);

            if (migrationResult.success) {
                // Refetch projects after migration
                const refetchResult = await getUserProjectsAction();
                if (refetchResult.success && refetchResult.data) {
                    setProjects(refetchResult.data);
                }
            }
            setMigrating(false);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
            isLoadingRef.current = false;
        }
    }

    const [isCreating, setIsCreating] = useState(false);

    const handleCreateNew = () => {
        router.push('/editor/new');
    };

    const handleQuickCreate = async () => {
        if (!user || isCreating) return;
        setIsCreating(true);
        try {
            const newProject: Omit<Project, 'id' | 'createdAt' | 'updatedAt'> = {
                userId: user.uid,
                name: t('unnamedProject'),
                description: '',
                rows: 8,
                cols: 8,
                gridType: 'square',
                activeSquares: Array.from({ length: 64 }, (_, i) => `${i % 8},${Math.floor(i / 8)}`),
                placedPieces: {},
                isStarred: false,
                customPieces: []
            };

            const result = await saveProjectAction(newProject as Project);
            if (result.success && result.projectId) {
                router.push(`/editor/${result.projectId}/board-editor`);
            } else {
                throw new Error(result.error || 'Failed to create project');
            }
        } catch (error) {
            console.error('Error in quick create:', error);
            setIsCreating(false);
        }
    };

    const handleToggleStar = async (projectId: string) => {
        if (!user) return;
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        try {
            const result = await toggleProjectStarAction(projectId);
            if (result.success) {
                // Optimistic update
                setProjects(prev => prev.map(p =>
                    p.id === projectId ? { ...p, isStarred: result.isStarred ?? !p.isStarred } : p
                ).sort((a, b) => {
                    if (a.isStarred && !b.isStarred) return -1;
                    if (!a.isStarred && b.isStarred) return 1;
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                }));
            }
        } catch (error) {
            console.error('Error starring project:', error);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!user || !confirm(t('deleteConfirm'))) return;
        try {
            const result = await deleteProjectAction(projectId);
            if (result.success) {
                setProjects(prev => prev.filter(p => p.id !== projectId));
            }
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
        );
    }

    if (migrating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
                <div className="relative">
                    <Loader2 className="w-16 h-16 animate-spin text-accent" />
                    <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400 animate-pulse" />
                </div>
                <div className="text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-2">{t('migrating')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                        {t('migratingDescription')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-32 max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                        {t('myProjects')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        {projects.length} {t('projectsActive')}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={handleQuickCreate}
                        disabled={isCreating}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-2xl font-bold transition-all border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95 whitespace-nowrap disabled:opacity-50"
                    >
                        {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-amber-500" />}
                        {t('quickCreate')}
                    </button>

                    <button
                        onClick={handleCreateNew}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-2xl font-bold transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        {t('newProject')}
                    </button>
                </div>
            </div>

            <ProjectList
                projects={projects}
                onToggleStar={handleToggleStar}
                onDelete={handleDeleteProject}
                onCreateNew={handleCreateNew}
            />
        </div>
    );
}
