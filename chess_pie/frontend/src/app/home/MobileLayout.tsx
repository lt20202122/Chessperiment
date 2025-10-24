
export default function MobileLayout({children}:{children: React.ReactNode}) {
    return <main style={{gridArea:"main"}}
        className='dark:bg-islandsDark shadow-islands h-[410px]'>{children}
        </main>
}