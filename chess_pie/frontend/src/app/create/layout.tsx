import CustomBoard from './CustomBoard'
export default function CreateLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
return (
    <body className='dark:bg-spaceDark'>
        <div className="dark:block hidden bg-headerDark h-3"></div>
        <div className="dark:h-1 h-1 w-full bg-gradient-to-b from-headerLight to-light dark:from-headerDark dark:to-spaceDark dark:mb-9"></div>
        <main className="" style={{
            display:"grid",
            gridTemplateColumns:"1fr 1fr",
            gap:"16px",
            gridTemplateAreas:'"CustomBoard CustomPiece"'
        }}>
            {children}
        </main>
    </body>
);
}