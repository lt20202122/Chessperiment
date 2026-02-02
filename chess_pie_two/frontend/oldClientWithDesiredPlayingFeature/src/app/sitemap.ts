import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://chessperiment.app';
  const locales = ['en', 'de'];
  
  // List of known static routes
  const routes = [
    '',
    '/editor/board',
    '/editor/board/faq',
    '/editor/piece',
    '/editor/piece/faq',
    '/marketplace',
    '/game',
    '/announcements',
    '/library',
    '/login',
    '/features/analyze',
    '/legal-notice',
    '/privacy-policy',
    '/about',
    '/profile'
  ];

  return routes.flatMap((route) => 
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: (route === '' ? 'daily' : 'weekly') as any,
      priority: route === '' ? 1 : 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/en${route}`,
          de: `${baseUrl}/de${route}`,
        },
      },
    }))
  );
}
