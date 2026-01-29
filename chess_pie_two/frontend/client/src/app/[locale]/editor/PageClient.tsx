"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Project } from '@/types/Project';
import { getUserProjects, hasUserMigrated, deleteProject, toggleProjectStar } from '@/lib/firestore-client';
import { migrateUserAction } from '@/app/actions/editor';
import { Plus, Loader2, Sparkles } from 'lucide-react';
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
        console.log('[PageClient] Mounted. Auth Loading:', authLoading, 'User:', user?.uid);
        if (authLoading) return;

        if (!user) {
            console.log('[PageClient] No user, redirecting to login');
            router.push('/login');
            return;
        }

        // Prevent double loading if already in progress or if user hasn't changed.
        // Actually, since user is in dependency array, we do want to reload if user changes.
        // But we want to avoid double-firing on initial mount if react strict mode is on.
        loadProjects();
    }, [user, authLoading, router]);

    async function loadProjects() {
        if (!user || isLoadingRef.current) return;
        isLoadingRef.current = true;

        console.time('editor-load');
        setLoading(true);
        try {
            console.log('Loading user data for:', user.uid);

            // Start both requests independently
            const projectsPromise = getUserProjects(user.uid);
            const migrationPromise = hasUserMigrated(user.uid);

            // 1. Wait for projects first. If we have them, we don't strictly need to wait for the migration check.
            const userProjects = await projectsPromise;
            console.log('Found projects:', userProjects.length);

            if (userProjects.length > 0) {
                setProjects(userProjects);
                setLoading(false); // Stop loading immediately
                console.timeEnd('editor-load');
                return;
            }

            // 2. Only if no projects found, check migration status
            console.log('No projects found, checking migration status...');
            const migrated = await migrationPromise;
            console.log('Migration status:', migrated);

            if (!migrated) {
                // Not migrated and no new projects found. This could be a legacy user.
                console.log('Starting migration check...');
                setMigrating(true);
                const result = await migrateUserAction();
                console.log('Migration result:', result);

                if (result.success) {
                    // Refetch projects after migration
                    const migratedProjects = await getUserProjects(user.uid);
                    setProjects(migratedProjects);
                }
                setMigrating(false);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            // Ensure loading is off (if not already handled)
            setLoading(false);
        }
    }

    const handleCreateNew = () => {
        router.push('/editor/new');
    };

    const handleToggleStar = async (projectId: string) => {
        if (!user) return;
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        try {
            await toggleProjectStar(projectId, !project.isStarred);
            // Optimistic update
            setProjects(prev => prev.map(p =>
                p.id === projectId ? { ...p, isStarred: !p.isStarred } : p
            ).sort((a, b) => {
                if (a.isStarred && !b.isStarred) return -1;
                if (!a.isStarred && b.isStarred) return 1;
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }));
        } catch (error) {
            console.error('Error starring project:', error);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!user || !confirm(t('deleteConfirm'))) return;
        try {
            await deleteProject(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
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

                <button
                    onClick={handleCreateNew}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-2xl font-bold transition-all shadow-lg shadow-accent/25 hover:shadow-accent/40 active:scale-95 whitespace-nowrap"
                >
                    <Plus className="w-5 h-5" />
                    {t('newProject')}
                </button>
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
