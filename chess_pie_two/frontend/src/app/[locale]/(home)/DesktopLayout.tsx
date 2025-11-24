
export default function DesktopLayout({
children,statistics,mixed
}: Readonly<{
children: React.ReactNode;
statistics: React.ReactNode;
mixed: React.ReactNode;
}>) {
return (
    <main
    className="mt-0  px-10 bg-bg"
    style={{
        display: "grid",
        gridTemplateColumns: "1fr 2fr 1fr",
        gridTemplateAreas: `
        "statistics main mixed"
        `,
        gap: "40px",
        height: "100vh"
    }}
    >
    <div className="block h-3"></div>
    <div className="h-1 w-full mb-9"></div>
        <section style={{gridArea:"main"}}
        className='bg-islands transition-all duration-300 shadow-islands lg:h-[440px] md:h-[360px] p-4 rounded-lg'>{children}</section>
        <aside style={{gridArea:"statistics"}}
        className='bg-islands'>{statistics}</aside>
        <aside style={{gridArea:"mixed"}}
        className='bg-islands'>{mixed}</aside>
    </main>
);
}