import type { MetadataRoute } from 'next';

// robots.txt generator function
export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.SITE_URL || 'https://www.oohunt.com';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/dashboard/',
                '/api/',
                '/auth/signin',
                '/auth/signout',
            ],
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    };
} 