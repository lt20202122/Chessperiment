import CustomBoard from './CustomBoard'
export default function CreateLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
return (
    <div className='bg-bg'>
        <div className="block bg-header h-3"></div>
        <div className="h-1 w-full mb-9"></div>
        <main className="" style={{
            display:"grid",
            gridTemplateColumns:"1fr 1fr",
            gap:"16px",
            gridTemplateAreas:'"CustomBoard CustomPiece"'
        }}>
            {children}
        </main>
    </div>
);
}