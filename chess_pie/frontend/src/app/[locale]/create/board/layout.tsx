import EditableBoard from "./EditableBoard";

export default function CreateLayout({
children,
}: Readonly<{
children: React.ReactNode;
}>) {
    
    return <div className=''>
        <main className='bg-islands h-screen w-[50vw]'><EditableBoard /></main>
    </div>
}