"use client";
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Crown, Handshake, ShieldX } from 'lucide-react';

interface GameEndEffectProps {
    result: 'win' | 'loss' | 'draw';
}

export default function GameEndEffect({ result }: GameEndEffectProps) {
    const t = useTranslations('GameEnd');

    const effects = {
        win: {
            Icon: Crown,
            text: t('win'),
            className: 'from-yellow-400 to-amber-500 text-white',
        },
        loss: {
            Icon: ShieldX,
            text: t('loss'),
            className: 'from-red-500 to-rose-600 text-white',
        },
        draw: {
            Icon: Handshake,
            text: t('draw'),
            className: 'from-gray-400 to-slate-500 text-white',
        },
    };

    const { Icon, text, className } = effects[result];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
            <div className={`flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br shadow-2xl ${className}`}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                    transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
                >
                    <Icon size={80} strokeWidth={2.5} />
                </motion.div>
                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-5xl font-black tracking-tighter"
                >
                    {text}
                </motion.h1>
            </div>
        </motion.div>
    );
}
