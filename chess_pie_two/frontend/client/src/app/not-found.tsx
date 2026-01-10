"use client";

import Link from "next/link";

export default function GlobalNotFound() {
    return (
        <html lang="en">
            <body className="bg-white dark:bg-stone-950 flex items-center justify-center min-h-screen font-sans">
                <div className="text-center px-4">
                    <h1 className="text-6xl font-black text-amber-500 mb-4">404</h1>
                    <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-6">Page Not Found</h2>
                    <p className="text-stone-600 dark:text-stone-400 mb-8 max-w-sm mx-auto">
                        The page you are looking for doesn't exist or has been moved.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-8 py-3 bg-stone-900 dark:bg-amber-500 text-white dark:text-stone-950 font-bold rounded-xl transition-transform hover:scale-105 active:scale-95"
                    >
                        Return Home
                    </Link>
                </div>
            </body>
        </html>
    );
}