import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

// Fetch all posts data
async function getPages(): Promise<PageData[]> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004';

    try {
        const res = await fetch(`${apiBaseUrl}/api/cms/content`, {
            cache: 'no-store',
            next: { revalidate: 0 }
        });

        if (!res.ok) {
            return [];
        }

        const json = await res.json();

        // Add this line to print data in the server terminal

        if (json.status && json.data) {
            return json.data as PageData[];
        } else {
            return [];
        }
    } catch {
        return [];
    }
}

// Define post data type
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
    featuredImage?: string;
}

// Generate page metadata
export const metadata: Metadata = {
    title: 'Oohunt - Blog - Latest Product Info & Shopping Guides',
    description: 'Browse our blog posts for the latest product information and shopping guides'
};

// Format date
function _formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Page component
export default async function BlogList() {
    const pages = await getPages();

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <main className="container mx-auto px-4 py-16 max-w-6xl">
                <header className="mb-16 text-center">
                    <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-4">
                        Explore Knowledge
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 mb-6">Blog Posts</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                        Discover the latest trends, product reviews, and shopping guides
                    </p>

                    <div className="flex flex-wrap justify-center gap-4 mt-6">
                        <Link href="/blog/categories" className="px-6 py-2 bg-white shadow-sm rounded-full text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            Browse by Category
                        </Link>
                        <Link href="/blog/tags" className="px-6 py-2 bg-white shadow-sm rounded-full text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                            Browse by Tag
                        </Link>
                    </div>
                </header>

                {pages.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">No posts available</h3>
                        <p className="text-gray-500">We&apos;re working on new content. Please check back later.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {pages.map((page) => {
                            // Prefer the featuredImage field as the cover image
                            const imageUrl = page.featuredImage || page.seoData?.ogImage;

                            return (
                                <article key={page._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full group">
                                    <Link href={`/blog/${page.slug}`} className="block aspect-[12/7] relative overflow-hidden">
                                        {imageUrl ? (
                                            <Image
                                                src={imageUrl}
                                                alt={page.title}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="aspect-video bg-gray-200 relative overflow-hidden flex items-center justify-center h-full w-full">
                                                <span className="text-gray-400">Oohunt</span>
                                            </div>
                                        )}
                                    </Link>
                                    <div className="p-6 flex flex-col flex-grow">
                                        <div className="flex-grow">
                                            <h2 className="text-xl font-semibold mb-3 text-gray-900 line-clamp-2">
                                                <Link
                                                    href={`/blog/${page.slug}`}
                                                    className="hover:text-blue-600 transition-colors"
                                                >
                                                    {page.title}
                                                </Link>
                                            </h2>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
} 