'use client';
import { useState, useEffect } from 'react';
import MobileLayout from './MobileLayout';
import DesktopLayout from './DesktopLayout'
import TabletLayout from './TabletLayout';

export default function RootLayout({ children, statistics, mixed }: { children: React.ReactNode; statistics?: React.ReactNode, mixed?: React.ReactNode }) {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false)

    useEffect(() => {
        const checkWidth = () => {
            setIsMobile(window.innerWidth < 600);
            setIsTablet(window.innerWidth > 600 && window.innerWidth < 900)
        }
        checkWidth();
        window.addEventListener('resize', checkWidth);
        return () => window.removeEventListener('resize', checkWidth);
    }, []);

    return (
        isMobile
            ? <MobileLayout>{children}</MobileLayout>
            : isTablet
                ? <TabletLayout>{children}</TabletLayout>
                : <DesktopLayout statistics={statistics} mixed={mixed}>{children}</DesktopLayout>
    )
}
