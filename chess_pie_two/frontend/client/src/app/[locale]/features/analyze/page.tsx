'use client';

import { useState, useEffect } from 'react';
import { Zilla_Slab, Lexend } from 'next/font/google';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

const zillaSlab = Zilla_Slab({
    weight: ['700'],
    subsets: ['latin'],
});

const lexend = Lexend({
    weight: ['400', '600'],
    subsets: ['latin'],
});

// Set a target date for the feature launch.
// For this example, it's set 7 days from now.
const calculateTargetDate = () => {
    const target = new Date();
    target.setDate(target.getDate() + 7);
    return target;
};

export default function AnalyzeFeaturePage() {
    const t = useTranslations('Analyze');
    const [targetDate] = useState(calculateTargetDate());
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const timer = setInterval(() => {
            const difference = targetDate.getTime() - new Date().getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            } else {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    const timerComponents = [
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Minutes', value: timeLeft.minutes },
        { label: 'Seconds', value: timeLeft.seconds },
    ];

    return (
        <main className="flex flex-col items-center justify-center leading-xl min-h-screen bg-bg text-white p-6 text-center">
            <div className="max-w-3xl">
                <h1 className={`${zillaSlab.className} text-5xl md:text-7xl font-bold text-[#F2FF00] text-shadow-yellow mb-4`}>
                    {t('title')}
                </h1>
                <p className={`${lexend.className} text-lg md:text-xl text-gray-300 mb-8`}>
                    {t('description')}
                </p>

                {/* <div className="flex justify-center gap-4 md:gap-8 my-10">
                    {timerComponents.map(({ label, value }) => (
                        <div key={label} className="flex flex-col items-center justify-center bg-gray-800/50 p-4 md:p-6 rounded-lg w-24 h-24 md:w-32 md:h-32 border border-gray-700">
                            <span className={`${lexend.className} text-4xl md:text-5xl font-semibold text-[#F2FF00]`}>
                                {String(value).padStart(2, '0')}
                            </span>
                            <span className="text-sm text-gray-400 mt-1">{label}</span>
                        </div>
                    ))}
                </div> */}

                <Link
                    href="/"
                    className={`${lexend.className} inline-block bg-yellow-400 text-black font-semibold px-8 py-3 rounded-lg hover:bg-yellow-300 transition-colors duration-300`}
                >
                    {t('goBackHome')}
                </Link>
            </div>
        </main>
    );
}


