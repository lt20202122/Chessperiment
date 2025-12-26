// app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/api/",
                    "/trpc/",
                    "/_next/",
                    "/_vercel/",
                    "/login",
                ],
            },
        ],
        sitemap: "https://chesspie.de/sitemap.xml",
    };
}
