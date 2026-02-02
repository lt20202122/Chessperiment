'use client';

import { Project } from '@/types/Project';
import { Star, MoreVertical, Trash2, Edit2, Share2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProjectCardProps {
    project: Project;
    onToggleStar: (projectId: string) => void;
    onDelete: (projectId: string) => void;
}

export default function ProjectCard({ project, onToggleStar, onDelete }: ProjectCardProps) {
    const t = useTranslations('Editor');
    const locale = useLocale();
    const [showMenu, setShowMenu] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <Link href={`/${locale}/editor/${project.id}`}>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-accent transition-colors truncate pr-2">
                                {project.name}
                            </h3>
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                            {t('lastEdited')} {new Date(project.updatedAt).toLocaleDateString()}
                        </p>
                    </div>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onToggleStar(project.id!);
                        }}
                        className={`p-2 rounded-full transition-colors ${project.isStarred
                                ? 'bg-yellow-50 text-yellow-400'
                                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                            }`}
                    >
                        <Star className={`w-5 h-5 ${project.isStarred ? 'fill-yellow-400' : ''}`} />
                    </button>
                </div>

                {project.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                        {project.description}
                    </p>
                )}

                <div className="flex items-center gap-3 mb-6">
                    <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                        {project.rows} × {project.cols}
                    </div>
                    <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                        {project.customPieces.length} {t('piecesCount')}
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-50 dark:border-gray-700">
                    <Link
                        href={`/${locale}/editor/${project.id}/board-editor`}
                        className="flex-1 text-center py-2 px-4 rounded-xl bg-accent/10 hover:bg-accent text-accent hover:text-white text-sm font-bold transition-all"
                    >
                        {t('editBoard')}
                    </Link>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute bottom-20 right-6 z-20 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2">
                        <button
                            onClick={() => {
                                setShowMenu(false);
                                onDelete(project.id!);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            {t('deleteProject')}
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
}
