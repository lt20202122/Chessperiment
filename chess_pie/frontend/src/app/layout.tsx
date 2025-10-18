import type { Metadata } from "next";
import "./globals.css";
import {Header} from "./components"
import {Lexend} from 'next/font/google'

const lex = Lexend({
    subsets: ["latin"],
    weight: ["400"],
});

export const metadata: Metadata = {
  title: "chessPie",
  description: "Play fun versions of chess from everywhere you want!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lex.className}`} suppressHydrationWarning={false}>
      <body>
        <Header />
        {children}
      </body>
    </html> 
  );
}