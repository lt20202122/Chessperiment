export default function HomeLayout({
    children,
    statistics,
    mixed
}: {
    children: React.ReactNode;
    statistics?: React.ReactNode;
    mixed?: React.ReactNode
}) {
    return (
        <main className="px-4 md:px-10 pb-20 max-w-[1920px] mx-auto">
            {/* 3-column grid for desktop, stacks on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-8 mt-4 lg:mt-0 items-start">

                {/* Main Content (Center) - Appears first on mobile */}
                <div className="order-1 lg:order-2 space-y-8">
                    <section className='bg-primary-island transition-all duration-300 shadow-islands min-h-[440px] p-4 md:p-6 rounded-3xl h-fit border border-gray-200/50 dark:border-stone-700/50 backdrop-blur-sm bg-white/30 dark:bg-stone-900/30'>
                        {children}
                    </section>
                </div>

                {/* Left Sidebar (Library) - Appears second on mobile */}
                <div className="order-2 lg:order-1 h-fit">
                    {statistics}
                </div>

                {/* Right Sidebar (Trending) - Appears third on mobile */}
                <div className="order-3 lg:order-3 h-fit">
                    {mixed}
                </div>
            </div>
        </main>
    );
}
