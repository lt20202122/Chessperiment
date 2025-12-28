"use client";
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Crown, Handshake, ShieldX } from 'lucide-react';

interface GameEndEffectProps {
    result: 'win' | 'loss' | 'draw';
}

import Confetti from './Confetti';

export default function GameEndEffect({ result }: GameEndEffectProps) {
    const t = useTranslations('GameEnd');

    const effects = {
        win: {
            Icon: Crown,
            text: t('win'),
            className: 'from-amber-400 to-orange-600 text-white border-amber-300/50',
            shadow: 'shadow-amber-500/50'
        },
        loss: {
            Icon: ShieldX,
            text: t('loss'),
            className: 'from-red-600 to-rose-700 text-white border-red-500/50',
            shadow: 'shadow-red-500/50'
        },
        draw: {
            Icon: Handshake,
            text: t('draw'),
            className: 'from-slate-600 to-slate-800 text-white border-slate-500/50',
            shadow: 'shadow-slate-500/50'
        },
    };

    const { Icon, text, className, shadow } = effects[result];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            {result === 'win' && <Confetti count={100} />}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 100 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -100 }}
                className="z-10 relative"
            >
                <div className={`flex flex-col items-center gap-6 p-12 rounded-3xl bg-linear-to-br shadow-2xl border-4 ${className} ${shadow} max-w-sm mx-auto text-center transform perspective-1000`}>
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                        className="p-4 bg-white/20 rounded-full backdrop-blur-sm"
                    >
                        <Icon size={80} strokeWidth={2.5} />
                    </motion.div>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-6xl font-black tracking-tighter drop-shadow-lg"
                    >
                        {text}
                    </motion.h1>
                </div>
            </motion.div>
        </div>
    );
}
