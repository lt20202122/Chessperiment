
export default function MobileLayout({ children }: { children: React.ReactNode }) {
    return <main style={{ gridArea: "main" }}
        className='bg-islands shadow-islands min-h-[410px] h-full flex flex-col items-center justify-center pb-8'>{children}
    </main>
}