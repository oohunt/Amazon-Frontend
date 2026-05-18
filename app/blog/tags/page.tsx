import type { Metadata } from 'next';
import Link from 'next/link';

import TaxonomyGrid from '@/components/blog/TaxonomyGrid';
import type { ContentTag } from '@/types/cms';
// import TagCloud from '@/components/blog/TagCloud';

// Fetch all tags data
async function getTags(): Promise<ContentTag[]> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004';
    // Fetch a large number to get all tags, adjust if needed
    const url = `${apiBaseUrl}/api/cms/tags?limit=500`;

    try {
        const res = await fetch(url, {
            cache: 'no-store',
            next: { revalidate: 0 }
        });

        if (!res.ok) {
            return [];
        }

        const json = await res.json();

        if (json.status && json.data?.tags) {
            return json.data.tags;
        }

        return [];
    } catch {
        return [];
    }
}

// Generate page metadata
export const metadata: Metadata = {
    title: 'Oohunt - Blog Tags',
    description: 'Browse our blog posts by tag to quickly find related topics'
};

// Tags list page component
export default async function TagsPage() {
    const tags = await getTags();

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4 py-16 max-w-6xl">
                <header className="mb-12 text-center">
                    <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4">
                        Blog Navigation
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Tags</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Browse articles by tag to quickly find related topics
                    </p>
                </header>

                <div className="mb-16">
                    <TaxonomyGrid items={tags} basePath="/blog/tags" itemType="tag" />
                </div>

                <div className="text-center">
                    <Link
                        href="/blog"
                        className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                        Back to All Posts
                    </Link>
                </div>
            </div>
        </div>
    );
} 