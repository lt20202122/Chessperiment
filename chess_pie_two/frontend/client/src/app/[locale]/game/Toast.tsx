"use client";
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

interface ToastProps {
    message: string;
    show: boolean;
    onClose: () => void;
}

export default function Toast({ message, show, onClose }: ToastProps) {
    useEffect(() => {
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.3 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.5 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50"
                >
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-500 text-white shadow-lg">
                        <Info size={24} />
                        <p className="font-semibold">{message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
