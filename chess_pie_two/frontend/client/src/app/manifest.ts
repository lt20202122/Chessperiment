import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ChessPie',
    short_name: 'ChessPie',
    description: 'Play, Create & Share Custom Chess Variants',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0c0a09',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png', // Ideally 512x512
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
