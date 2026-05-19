import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';

import ContentRenderer from '@/components/cms/ContentRenderer';

// Assumes you have a function or API client to fetch page data
// e.g., from your API route /api/cms/content/[slug]
async function getPageData(slug: string): Promise<PageData | null> {
    // In a real app, replace this with an actual API call
    const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004'; // Use environment variable or default

    try {
        // Call the API using a relative or absolute path
        // For server components calling the same app's API, a relative path is usually sufficient
        const res = await fetch(`${apiBaseUrl}/api/cms/content/${slug}`, { cache: 'no-store' }); // Example: no cache

        if (!res.ok) {
            if (res.status === 404) {
                return null; // Page not found
            }

            return null;
        }

        const json = await res.json();

        if (json.status && json.data) {
            return json.data as PageData; // Return the data portion directly
        } else {
            return null;
        }
    } catch {
        // Don't throw here, let the page component handle null and show 404
        // throw new Error('Failed to fetch page data due to network or parsing error');
        return null; // Return null on fetch error so page shows 404
    }

    /* --- Remove or comment out mock data ---
    console.log(`Fetching mock data for slug: ${slug}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate network delay
    if (slug === 'test-page' || slug === 'test') { // Include slugs from previous tests
        return {
            _id: '123',
            title: `Test Page (${slug})`,
            slug: slug,
            content: `<p>This is the content for <strong>${slug}</strong>.</p><h2>Section Heading</h2><p>More content...</p><img src="/images/placeholder.png" alt="Placeholder Image">`, // Example image
            excerpt: `Short description for test page ${slug}`,
            status: 'published',
            author: 'Admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            categories: [],
            tags: [],
            seoData: { metaTitle: `Test Page ${slug} SEO Title`, metaDescription: `Test page ${slug} meta description` },
            products: [] // Assume products can be associated
        };
    }
    console.log(`Mock data not found for slug: ${slug}`);
    return null; // Simulate page not found
     --- End of mock data --- */
}

// Define page data type (should match your API response)
interface PageData {
    _id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    status: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    categories: string[];
    tags: string[];
    seoData?: {
        metaTitle?: string;
        metaDescription?: string;
        canonicalUrl?: string;
        ogImage?: string;
    };
    products?: unknown[]; // Adjust to your product type
}

// Generate page metadata (optional but recommended)
export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    // Await params before accessing slug
    const resolvedParams = await params;
    const page = await getPageData(resolvedParams.slug);

    if (!page) {
        return {
            title: 'Page Not Found'
        };
    }

    // Generate metadata from page data
    const previousImages = (await parent).openGraph?.images || [];

    return {
        title: page.seoData?.metaTitle || page.title,
        description: page.seoData?.metaDescription || page.excerpt,
        alternates: {
            canonical: page.seoData?.canonicalUrl || `/${resolvedParams.slug}`,
        },
        openGraph: {
            title: page.seoData?.metaTitle || page.title,
            description: page.seoData?.metaDescription || page.excerpt || '',
            url: `/${resolvedParams.slug}`,
            // Note: ensure ogImage URL is an absolute path or full URL
            images: page.seoData?.ogImage ? [page.seoData.ogImage, ...previousImages] : previousImages,
        },
    };
}

// Page component
export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
    // Await params before accessing slug
    const resolvedParams = await params;
    const pageData: PageData | null = await getPageData(resolvedParams.slug);

    // If page data is not found, show 404
    if (!pageData) {
        notFound();
    }

    return (
        <main className="container mx-auto px-4 py-8">
            <article className="prose lg:prose-xl max-w-none bg-white p-6 rounded shadow"> {/* Add background and shadow */}
                <h1 className="mb-4">{pageData.title}</h1>

                <ContentRenderer content={pageData.content} />

                {pageData.products && pageData.products.length > 0 && (
                    <div className="mt-8 pt-4 border-t"> {/* Add separator */}
                        <h2 className="text-xl font-semibold mb-4">Related Products</h2>
                        {/* Render product list here */}
                        <p className="text-gray-500">(Product rendering logic to be implemented)</p>
                    </div>
                )}

                <div className="mt-8 text-sm text-gray-500 pt-4 border-t"> {/* Add footer info */}
                    <span>Author: {pageData.author}</span> |
                    <span> Last Updated: {new Date(pageData.updatedAt).toLocaleDateString()}</span>
                </div>
            </article>
        </main>
    );
}

// Add revalidate option (optional)
// This causes the page to be regenerated after the specified number of seconds (Incremental Static Regeneration)
// export const revalidate = 60; // Revalidate every 60 seconds