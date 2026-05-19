import type { MetadataRoute } from 'next';

// Set to dynamic generation
export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Revalidate every 24 hours

// Define API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.oohunt.com';

// Function to fetch category data
async function getCategoryStats() {
    try {
        // Use correct API path — corrected to /api/categories/stats
        const response = await fetch(`${API_BASE_URL}/api/categories/stats?sort_by=count&sort_order=desc&page_size=100`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(process.env.NEXT_PUBLIC_API_KEY && {
                    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
                })
            },
            // Set cache strategy
            next: {
                revalidate: 3600 // Cache for 1 hour
            }
        });

        if (!response.ok) {
            return { product_groups: {} };
        }

        const result = await response.json();
        // Handle possible nested data structures
        const data = result.data || result;

        return data;

    } catch {
        return { product_groups: {} };
    }
}

// Sitemap generator function
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Current date as last modified date for static pages
    const currentDate = new Date().toISOString();

    // Static route list
    const staticRoutes = [
        '',
        '/about-us',
        '/contact-us',
        '/terms-of-use',
        '/privacy-policy',
        '/cookies-policy',
        '/disclaimer',
        '/affiliate-disclosure',
        '/deals',
        '/favorites',
        '/categories',
    ].map(route => ({
        url: `${SITE_URL}${route}`,
        lastModified: currentDate,
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    try {
        // Get category data
        const categoryStats = await getCategoryStats();
        const categoryRoutes: MetadataRoute.Sitemap = [];

        if (categoryStats && categoryStats.product_groups) {
            // Convert object to array, filter categories with count > 50 — controls category count in sitemap
            const categories = Object.entries(categoryStats.product_groups)
                .filter(([_groupName, count]) => (count as number) > 1)
                .map(([groupName]) => groupName);

            // Create routes for each category
            for (const category of categories) {
                categoryRoutes.push({
                    url: `${SITE_URL}/product/category/${encodeURIComponent(category)}`,
                    lastModified: currentDate,
                    changeFrequency: 'daily' as const,
                    priority: 0.7,
                });
            }
        }

        // Merge static routes and category routes
        return [...staticRoutes, ...categoryRoutes];
    } catch {
        // Still return static routes on error
        return staticRoutes;
    }
} 