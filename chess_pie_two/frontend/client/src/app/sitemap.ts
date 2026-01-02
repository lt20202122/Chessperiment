import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://chesspie.org';
  const locales = ['en', 'de'];
  
  // List of known static routes
  const routes = [
    '',
    '/editor/board',
    '/editor/piece',
    '/marketplace',
    '/game',
    '/announcements',
    '/login',
    '/features/analyze',
    '/legal-notice'
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  routes.forEach((route) => {
    locales.forEach((locale) => {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
      });
    });
  });

  return sitemapEntries;
}
