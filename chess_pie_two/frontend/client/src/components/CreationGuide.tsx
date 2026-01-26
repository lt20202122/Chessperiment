"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTranslations } from "next-intl"
import {
    X,
    Grid3X3,
    Shapes,
    Zap,
    Palette,
    Rocket,
    HelpCircle
} from "lucide-react"

export function CreationGuide() {
    const t = useTranslations("CreationGuide")
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const savedState = sessionStorage.getItem("isCreationGuideOpen")
        if (savedState === "true") {
            setIsOpen(true)
        }
    }, [])

    const toggleSidebar = () => {
        const newState = !isOpen
        setIsOpen(newState)
        sessionStorage.setItem("isCreationGuideOpen", newState.toString())
    }

    const steps = [
        {
            id: 1,
            title: t("steps.1.title"),
            description: t("steps.1.description"),
            icon: <Grid3X3 size={20} />
        },
        {
            id: 2,
            title: t("steps.2.title"),
            description: t("steps.2.description"),
            icon: <Shapes size={20} />
        },
        {
            id: 3,
            title: t("steps.3.title"),
            description: t("steps.3.description"),
            icon: <Zap size={20} />
        },
        {
            id: 4,
            title: t("steps.4.title"),
            description: t("steps.4.description"),
            icon: <Palette size={20} />
        },
        {
            id: 5,
            title: t("steps.5.title"),
            description: t("steps.5.description"),
            icon: <Rocket size={20} />,
            isLast: true
        }
    ]

    return (
        <>
            {/* Trigger Button - Positioned next to UserPanel (bottom right) */}
            <div className="fixed bottom-6 right-20 z-100">
                <motion.button
                    onClick={toggleSidebar}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg border ${isOpen
                        ? "bg-amber-400 border-amber-500 text-bg"
                        : "bg-islands/60 backdrop-blur-md border-amber-400/30 text-amber-600 dark:text-amber-400 hover:border-amber-400"
                        }`}
                    title={t("title")}
                >
                    <HelpCircle size={24} />
                </motion.button>
            </div>

            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Mobile backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleSidebar}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-110 lg:hidden"
                        />

                        {/* Sidebar Content */}
                        <motion.aside
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-[320px] bg-islands/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-120 flex flex-col overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-6 sticky top-0 bg-islands/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-10">
                                <div>
                                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-amber-400 to-orange-500">
                                        {t("title")}
                                    </h2>
                                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                                        {t("subtitle")}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleSidebar}
                                    className="p-2 text-stone-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Steps List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-2">
                                {steps.map((step, index) => (
                                    <div key={step.id} className="relative pl-14 pb-8 group cursor-pointer last:pb-0">
                                        {/* Connector Line (Curved) */}
                                        {!step.isLast && (
                                            <svg className="absolute left-[18px] top-[40px] w-6 h-12 pointer-events-none z-0 overflow-visible" fill="none" viewBox="0 0 24 48">
                                                <path
                                                    d={index % 2 === 0 ? "M4 0C4 20 20 20 20 48" : "M20 0C20 28 4 28 4 48"}
                                                    stroke="rgba(120, 113, 108, 0.3)"
                                                    strokeDasharray="4 4"
                                                    strokeWidth="2"
                                                />
                                            </svg>
                                        )}

                                        {/* Step Circle */}
                                        <div className={`absolute left-0 top-0 w-10 h-10 rounded-full font-bold text-lg flex items-center justify-center shadow-lg transition-all duration-300 z-10 
                                            bg-surface-dark border-2 border-stone-700 text-stone-500 group-hover:border-amber-400 group-hover:text-amber-400`}
                                        >
                                            {step.id === 5 ? <Rocket size={18} /> : step.id}
                                        </div>

                                        {/* Step Content */}
                                        <div className="pt-0.5">
                                            <h3 className="font-bold transition-colors text-stone-400 group-hover:text-stone-200">
                                                {step.title}
                                            </h3>
                                            <p className="text-xs text-stone-500 leading-relaxed mt-1 opacity-80">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
