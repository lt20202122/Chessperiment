import type { Metadata, Viewport } from "next";
import "../globals.css";
import { Lexend } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SessionWrapper } from "@/components/auth/SessionWrapper";
import { UserPanel } from "@/components/auth/UserPanel";
import { generateBreadcrumbs } from "@/lib/breadcrumbs";
import { headers } from "next/headers";
import { Providers } from "../providers";
import Script from "next/script";
import { SEOFooter } from "@/components/SEOFooter";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const lex = Lexend({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap"
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://chesspie.org"),
  title: {
    default: "ChessPie | Custom Chess Platform",
    template: "%s | ChessPie",
  },
  description: "Create individual chess pieces, design unique boards, and play custom chess online with friends.",
  keywords: [
    "chess",
    "custom chess",
    "chess editor",
    "board game designer",
    "chess variants",
    "pixel art chess",
    "custom chess board",
    "piece generator",
    "creative chess",
    "online chess board editor",
    "chess variant creator",
    "create your own chess rules",
    "chess pieces designer",
    "online chess variant",
    "chess rules simulator",
    "play custom chess online",
    "chess game creator"
  ],
  authors: [{ name: "Lasse Mauritz" }],
  creator: "Lasse Mauritz",
  publisher: "ChessPie",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chesspie.org/en",
    siteName: "ChessPie",
    title: "ChessPie | Play, Create & Share Custom Chess Variants",
    description: "Design custom chess pieces, create unique boards, and play chess variants with friends.",
    images: [
      {
        url: "/images/seo/og-home.png",
        width: 1200,
        height: 630,
        alt: "ChessPie - Custom Chess Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChessPie | Play custom chess",
    description: "Create your own chess world. Design pieces, boards and play online.",
    images: ["/images/seo/twitter-image.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
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
  const headersList = await headers();
  const requestUrl = headersList.get("x-invoke-path") || "/";
  const pathname = requestUrl.startsWith("/") ? requestUrl : new URL(requestUrl, "http://example.com").pathname;

  return (
    <html
      lang={locale}
      className={`${lex.className}`}
      suppressHydrationWarning={true}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(generateBreadcrumbs(pathname)) }}
        />
        <Script
          id="cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="9312e6eb-fa6c-4d47-b75f-c043af39a218"
          data-blockingmode="auto"
          strategy="beforeInteractive"
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
              <Providers>

                <UserPanel />
                <ThemeToggle />
                <HeaderWrapper />
                {children}
                <SEOFooter />
              </Providers>
            </ThemeProvider>
          </NextIntlClientProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
