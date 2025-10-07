import Footer from './Footer'


export default function GameLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
    {children}
    <Footer />
    </>
  );
}
