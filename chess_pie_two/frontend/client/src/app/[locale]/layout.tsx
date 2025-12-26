import type { Metadata } from "next";
import "../globals.css";
import { Lexend } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SessionWrapper } from "@/components/auth/SessionWrapper";
import { UserPanel } from "@/components/auth/UserPanel";
import { generateBreadcrumbs } from "@/lib/breadcrumbs";
import { headers } from "next/headers"; // für server-seitigen Zugriff auf die URL

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const lex = Lexend({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "chessPie",
  description: "Play fun versions of chess from everywhere you want!",
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages();

  // --- server-seitiger Zugriff auf die URL ---
  const headersList = await headers();
  const requestUrl = headersList.get("x-invoke-path") || "/"; // Default / falls Header fehlt

  // Optional: pathname sauber extrahieren
  const pathname = new URL(requestUrl, "http://example.com").pathname;

  return (
    <html
      lang={locale}
      className={`${lex.className}`}
      suppressHydrationWarning={true}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbs(pathname)) }}
        />
      </head>
      <body className="bg-bg transition-colors duration-300 dark:bg-stone-950">
        <SessionWrapper>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Header />
              {children}
              <UserPanel />
              <ThemeToggle />
            </ThemeProvider>
          </NextIntlClientProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
