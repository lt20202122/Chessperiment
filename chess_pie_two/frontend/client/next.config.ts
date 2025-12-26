import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
    // Redirects: www → non-www
    async redirects() {
        return [
            {
                source: '/:path*',
                has: [
                    {
                        type: 'host',
                        value: 'www.chesspie.de',
                    },
                ],
                destination: 'https://chesspie.de/:path*',
                permanent: true, // 301 Redirect
            },
        ];
    },

    // HSTS Header erzwingen
    async headers() {
        return [
            {
                source: '/(.*)', // Alle Seiten
                headers: [
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=63072000; includeSubDomains; preload',
                    },
                ],
            },
        ];
    },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
