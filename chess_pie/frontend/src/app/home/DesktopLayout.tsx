import {Header} from "./components"

export default function DesktopLayout({
children,statistics,mixed
}: Readonly<{
children: React.ReactNode;
statistics: React.ReactNode;
mixed: React.ReactNode;
}>) {
return (
    <body className='dark:bg-spaceDark'>
        <Header />
        <div className="dark:block hidden bg-headerDark h-3"></div>
        <div className="dark:h-1 h-1 w-full bg-gradient-to-b from-headerLight to-light dark:from-headerDark dark:to-spaceDark dark:mb-9"></div>
        <main
    className="mt-0 "
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
        <section style={{gridArea:"main"}}
        className='dark:bg-islandsDark shadow-islands lg:h-[440px] md:h-[360px] p-4'>{children}</section>
        <aside style={{gridArea:"statistics"}}
        className='dark:bg-islandsDark'>{statistics}</aside>
        <aside style={{gridArea:"mixed"}}
        className='dark:bg-islandsDark'>{mixed}</aside>
    </main>
    </body>
);
}