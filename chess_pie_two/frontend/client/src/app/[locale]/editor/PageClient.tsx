"use client";
import { useEffect, useState } from 'react';
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

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        loadProjects();
    }, [user, authLoading, router]);

    async function loadProjects() {
        if (!user) return;

        console.time('editor-load');
        setLoading(true);
        try {
            console.log('Loading user data for:', user.uid);

            // Parallelize checks: Check migration status and fetch projects simultaneously
            const [migrated, userProjects] = await Promise.all([
                hasUserMigrated(user.uid),
                getUserProjects(user.uid)
            ]);

            console.log('Migration status:', migrated);
            console.log('Found projects:', userProjects.length);

            // Logic:
            // 1. If migrated: use fetched projects.
            // 2. If NOT migrated but has projects: maybe partial state? Assume migrated.
            // 3. If NOT migrated AND no projects: check if we need to migrate (could be a new user or legacy user).

            if (migrated || userProjects.length > 0) {
                setProjects(userProjects);
            } else {
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
            setLoading(false);
            console.timeEnd('editor-load');
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
