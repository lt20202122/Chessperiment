'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Project } from '@/types/Project';
import { getProjectAction, saveProjectAction } from '@/app/actions/editor';
import { Loader2, Pencil, Check, X, Gamepad2 } from 'lucide-react';
import ProjectEditorSidebar from '@/components/editor/ProjectEditorSidebar';
import BottomPiecePanel from '@/components/editor/BottomPiecePanel';
import BoardPreviewWrapper from '@/components/editor/BoardPreviewWrapper';

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

                    {/* Board Preview */}
                    <div className="mt-12 flex flex-col items-center gap-6">
                        <div className="flex gap-4">
                            <button
                                onClick={() => router.push(`/editor/${projectId}/play`)}
                                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-xl shadow-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <Gamepad2 size={24} className="relative z-10" />
                                <span className="relative z-10 text-lg font-bold">Play Local Game</span>
                            </button>
                        </div>

                        <div className="w-full h-[600px] relative z-10">
                            <BoardPreviewWrapper board={project as any} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Sidebar */}
            <ProjectEditorSidebar projectId={projectId} />


        </div>
    );
}
