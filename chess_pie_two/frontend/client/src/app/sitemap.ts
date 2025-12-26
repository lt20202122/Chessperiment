import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://chesspie.de';
    const locales = ['de', 'en'];

    const staticPages = [
        '',
        '/login',
        '/game',
        '/marketplace',
        '/profile',
        '/editor/board',
        '/editor/piece',
        '/announcements',
        '/legal-notice',
        '/privacy-policy',
    ];

    const sitemap = staticPages.flatMap((path) =>
        locales.map((locale) => ({
            url: `${baseUrl}/${locale}${path}`,
            lastModified: new Date().toISOString(),
        }))
    );

    return sitemap;
}
