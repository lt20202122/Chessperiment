'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Project } from '@/types/Project';
import { getProjectAction, saveProjectAction } from '@/app/actions/editor';
import { Loader2, Pencil, Check, X } from 'lucide-react';
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

    // Edit states
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [isSaving, setIsSaving] = useState(false);

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
            const result = await getProjectAction(projectId);
            if (result.success && result.data) {
                setProject(result.data);
                setEditedName(result.data.name);
                setEditedDescription(result.data.description || '');
            } else {
                router.push('/editor');
            }
        } catch (error) {
            console.error('Error loading project:', error);
            router.push('/editor');
        } finally {
            setLoading(false);
        }
    }

    const handleSaveInfo = async () => {
        if (!project || !user || isSaving) return;

        setIsSaving(true);
        try {
            const updatedProject: Project = {
                ...project,
                name: editedName.trim() || project.name,
                description: editedDescription.trim(),
                updatedAt: new Date()
            };

            const result = await saveProjectAction(updatedProject);
            if (result.success) {
                setProject(updatedProject);
                setIsEditingName(false);
                setIsEditingDescription(false);
            } else {
                console.error('Failed to save project:', result.error);
            }
        } catch (error) {
            console.error('Error saving project:', error);
        } finally {
            setIsSaving(false);
        }
    };

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
                <div className="container mx-auto max-w-4xl">
                    <div className="mb-12">
                        {/* Name Section */}
                        <div className="group relative flex items-center gap-4 mb-2">
                            {isEditingName ? (
                                <div className="flex items-center gap-2 w-full max-w-2xl">
                                    <input
                                        type="text"
                                        className="text-4xl font-black bg-stone-100 dark:bg-stone-800 px-4 py-2 rounded-2xl outline-none ring-2 ring-accent focus:ring-4 transition-all w-full"
                                        value={editedName}
                                        onChange={(e) => setEditedName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveInfo()}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSaveInfo}
                                        disabled={isSaving}
                                        className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors shadow-lg shadow-green-500/20"
                                    >
                                        {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingName(false);
                                            setEditedName(project.name);
                                        }}
                                        className="p-3 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 rounded-xl transition-colors"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-5xl font-black text-stone-900 dark:text-white tracking-tight">
                                        {project.name}
                                    </h1>
                                    <button
                                        onClick={() => setIsEditingName(true)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-stone-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-all"
                                        title={t('editName')}
                                    >
                                        <Pencil size={20} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Description Section */}
                        <div className="group relative flex items-start gap-4">
                            {isEditingDescription ? (
                                <div className="flex items-start gap-2 w-full max-w-2xl mt-4">
                                    <textarea
                                        className="text-lg text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-4 py-3 rounded-2xl outline-none ring-2 ring-accent focus:ring-4 transition-all w-full min-h-[100px] resize-none"
                                        value={editedDescription}
                                        onChange={(e) => setEditedDescription(e.target.value)}
                                        placeholder={t('placeholderDescription')}
                                        autoFocus
                                    />
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={handleSaveInfo}
                                            disabled={isSaving}
                                            className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors shadow-lg shadow-green-500/20"
                                        >
                                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditingDescription(false);
                                                setEditedDescription(project.description || '');
                                            }}
                                            className="p-3 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-300 rounded-xl transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xl text-stone-600 dark:text-white/60 font-medium max-w-2xl leading-relaxed">
                                        {project.description || <span className="italic opacity-50">{t('placeholderDescription')}</span>}
                                    </p>
                                    <button
                                        onClick={() => setIsEditingDescription(true)}
                                        className="opacity-0 group-hover:opacity-100 p-2 mt-1 text-stone-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-all shrink-0"
                                        title={t('editDescription')}
                                    >
                                        <Pencil size={18} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Board Preview Placeholder */}
                    <div className="group relative bg-white dark:bg-stone-900 border border-stone-200 dark:border-white/10 rounded-[2.5rem] p-12 text-center shadow-xl shadow-stone-200/50 dark:shadow-none transition-all hover:border-accent/30 overflow-hidden">
                        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-accent/10 text-accent rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                                <Loader2 className="w-10 h-10 animate-spin opacity-50" />
                            </div>
                            <h2 className="text-2xl font-black text-stone-900 dark:text-white mb-2">{t('boardViewComingSoon')}</h2>
                            <p className="text-stone-500 dark:text-white/40 font-bold uppercase tracking-widest text-sm">
                                {t('boardDim', { rows: project.rows, cols: project.cols })}
                            </p>
                        </div>

                        {/* Decorative background grid elements */}
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <div className="grid grid-cols-3 gap-2">
                                {[...Array(9)].map((_, i) => (
                                    <div key={i} className="w-8 h-8 bg-stone-900 dark:bg-white rounded-md" />
                                ))}
                            </div>
                        </div>
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
