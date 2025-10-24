import EditableBoard from "./EditableBoard";

export default function CreateLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
    
    return <body className='bg-spaceDark'>
        <main className='bg-islandsDark h-screen w-[50vw]'><EditableBoard /></main>
    </body>
}