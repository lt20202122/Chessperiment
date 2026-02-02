"use client"

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { X, ChevronRight, Sparkles } from 'lucide-react';

interface TourStep {
    targetId: string;
    message: string;
    title: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

export function OnboardingTour() {
    const t = useTranslations('Onboarding');
    const [currentStep, setCurrentStep] = useState(-1);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const steps: TourStep[] = [
        {
            targetId: 'tour-editor',
            title: t('editorTitle'),
            message: t('editorMessage'),
            position: 'bottom'
        },
        {
            targetId: 'tour-play',
            title: t('playTitle'),
            message: t('playMessage'),
            position: 'bottom'
        }
    ];

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenTour');
        if (!hasSeenTour) {
            // Delay start to ensure page is settled
            const timer = setTimeout(() => {
                setCurrentStep(0);
                setIsVisible(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    useLayoutEffect(() => {
        if (currentStep >= 0 && currentStep < steps.length) {
            const updateRect = () => {
                const element = document.getElementById(steps[currentStep].targetId);
                if (element) {
                    setTargetRect(element.getBoundingClientRect());
                }
            };

            updateRect();
            window.addEventListener('resize', updateRect);
            window.addEventListener('scroll', updateRect);
            return () => {
                window.removeEventListener('resize', updateRect);
                window.removeEventListener('scroll', updateRect);
            };
        } else {
            setTargetRect(null);
        }
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('hasSeenTour', 'true');
        setTimeout(() => setCurrentStep(-1), 500);
    };

    if (!isVisible || currentStep === -1 || !targetRect) return null;

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-9999 pointer-events-none">
            {/* Dark Overlay with Spotlight Effect */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 pointer-events-auto"
                style={{
                    clipPath: `polygon(
                        0% 0%, 
                        0% 100%, 
                        ${targetRect.left - 8}px 100%, 
                        ${targetRect.left - 8}px ${targetRect.top - 8}px, 
                        ${targetRect.right + 8}px ${targetRect.top - 8}px, 
                        ${targetRect.right + 8}px ${targetRect.bottom + 8}px, 
                        ${targetRect.left - 8}px ${targetRect.bottom + 8}px, 
                        ${targetRect.left - 8}px 100%, 
                        100% 100%, 
                        100% 0%
                    )`
                }}
                onClick={handleComplete}
            />

            {/* Content Bubble */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute pointer-events-auto"
                    style={{
                        top: step.position === 'bottom' ? targetRect.bottom + 20 : 'auto',
                        bottom: step.position === 'top' ? (window.innerHeight - targetRect.top) + 20 : 'auto',
                        left: Math.max(20, Math.min(window.innerWidth - 320, targetRect.left + (targetRect.width / 2) - 150)),
                        width: '300px'
                    }}
                >
                    <div className="relative bg-zinc-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
                        {/* Arrow */}
                        <div
                            className={`absolute w-4 h-4 bg-zinc-900 border-l border-t border-amber-500/30 rotate-45`}
                            style={{
                                top: step.position === 'bottom' ? -8 : 'auto',
                                bottom: step.position === 'top' ? -8 : 'auto',
                                left: '50%',
                                transform: 'translateX(-50%) rotate(45deg)',
                                display: step.position === 'bottom' || step.position === 'top' ? 'block' : 'none'
                            }}
                        />

                        <button
                            onClick={handleComplete}
                            className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>

                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-amber-500/20 rounded-lg">
                                <Sparkles className="text-amber-400" size={18} />
                            </div>
                            <h3 className="text-amber-400 font-bold text-lg">{step.title}</h3>
                        </div>

                        <p className="text-zinc-300 text-sm leading-relaxed mb-5">
                            {step.message}
                        </p>

                        <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-4 bg-amber-500' : 'w-1 bg-zinc-700'}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                            >
                                {currentStep === steps.length - 1 ? t('finish') : t('next')}
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
