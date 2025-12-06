
export default function MobileLayout({children}:{children: React.ReactNode}) {
    return <main style={{gridArea:"main"}}
        className='bg-islands shadow-islands h-[410px]'>{children}
        </main>
}