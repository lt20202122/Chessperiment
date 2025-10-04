import type { Metadata } from "next";
import "./globals.css";
import {Header} from "./components"


export const metadata: Metadata = {
  title: "chessPie",
  description: "Play fun versions off chess from everywhere you want!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html> 
  );
}
