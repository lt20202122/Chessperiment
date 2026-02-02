"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import confetti from "canvas-confetti";

export const NameChangeAnnouncement = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Target date: 26.01.2026 5 A.M. GMT
        const targetDate = new Date("2026-01-26T05:00:00Z");
        const now = new Date();

        // Check if we are past the target date
        if (now >= targetDate) {
            // Check if user has already seen this announcement
            const hasSeen = localStorage.getItem("chessperiment_name_change_seen");
            if (!hasSeen) {
                setIsOpen(true);
                // Trigger confetti for the celebration
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    zIndex: 9999,
                });
            }
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem("chessperiment_name_change_seen", "true");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-stone-900 shadow-2xl border border-stone-200 dark:border-stone-800"
                    >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-linear-to-r from-orange-500 via-amber-500 to-yellow-500" />

                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-8 text-center space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-3xl">
                                🥧
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold text-stone-900 dark:text-white">
                                    Big News!
                                </h2>
                                <p className="text-lg text-stone-600 dark:text-stone-300">
                                    We have a new name!
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                                <p className="font-serif text-xl italic text-stone-800 dark:text-stone-200">
                                    "We now are <span className="text-orange-600 dark:text-orange-400 font-bold not-italic">chessperiment.app</span> and not chesspie.org anymore"
                                </p>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full py-3 px-6 rounded-lg bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-medium hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors transform active:scale-95"
                            >
                                Got it, let's play!
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
