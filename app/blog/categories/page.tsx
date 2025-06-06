import type { Metadata } from 'next';
import Link from 'next/link';

import TaxonomyGrid from '@/components/blog/TaxonomyGrid';
import type { ContentCategory } from '@/types/cms';
// import CategoryCloud from '@/components/blog/CategoryCloud';

// Fetch all categories data
async function getCategories(): Promise<ContentCategory[]> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    // Fetch a large number to get all categories, adjust if needed
    const url = `${apiBaseUrl}/api/cms/categories?limit=500`;

    try {
        const res = await fetch(url, {
            cache: 'no-store',
            next: { revalidate: 0 }
        });

        if (!res.ok) {
            return [];
        }

        const json = await res.json();

        if (json.status && json.data?.categories) {
            return json.data.categories;
        }

        return [];
    } catch {
        return [];
    }
}

// Generate page metadata
export const metadata: Metadata = {
    title: 'Oohunt - Blog Categories',
    description: 'Browse our blog posts by category to find the content you are interested in'
};

// Categories list page component
export default async function CategoriesPage() {
    const categories = await getCategories();

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <div className="container mx-auto px-4 py-16 max-w-6xl">
                <header className="mb-12 text-center">
                    <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4">
                        Blog Navigation
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Categories</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Browse our blog posts by category to find the content you are interested in
                    </p>
                </header>

                <div className="mb-16">
                    <TaxonomyGrid items={categories} basePath="/blog/categories" itemType="category" />
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