import { ObjectId } from 'mongodb';
import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

interface ProductInfo {
    id: string;
    title: string;
    price: number;
    image: string | null;
    rating: number;
    url: string;
}

interface FormattedPage {
    _id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    status: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    categories: string[];
    tags: string[];
    seoData?: {
        metaTitle?: string;
        metaDescription?: string;
        canonicalUrl?: string;
        ogImage?: string;
    };
    productIds?: string[];
    products?: ProductInfo[];
    isDraft?: boolean;
}

// Get content page by slug, with support for draft preview
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        // Await params before accessing slug, following the error message suggestion
        const resolvedParams = await params;
        const slug = resolvedParams.slug;

        // Check if preview mode is active
        const isPreview = request.nextUrl.searchParams.has('preview');

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_pages');

        // Build query — do not restrict by status in preview mode
        const query: { slug: string; status?: string } = { slug: slug };

        // In non-preview mode, only retrieve published pages
        if (!isPreview) {
            query.status = 'published';
        }

        // Query the page
        const page = await collection.findOne(query);

        if (!page) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Page not found or not published'
                },
                { status: 404 }
            );
        }

        // If previewing a draft page, add a draft marker
        const isDraft = page.status === 'draft';

        // Format data
        const formattedPage = {
            ...page,
            _id: page._id.toString(),
            createdAt: page.createdAt instanceof Date ? page.createdAt.toISOString() : page.createdAt,
            updatedAt: page.updatedAt instanceof Date ? page.updatedAt.toISOString() : page.updatedAt,
            publishedAt: page.publishedAt instanceof Date ? page.publishedAt.toISOString() : page.publishedAt,
            isDraft: isDraft && isPreview // Add draft marker
        };

        // If the page contains product IDs, fetch the product information
        if (page.productIds && page.productIds.length > 0) {
            const productsCollection = db.collection('products');

            // Convert string IDs to ObjectId
            const objectIds = page.productIds.map((id: string) => {
                return new ObjectId(id);
            });

            // Fetch related product information from the products collection
            const products = await productsCollection.find({
                _id: { $in: objectIds },
                status: 'published'
            }).toArray();

            // Add product information to the response data
            const productInfoArray: ProductInfo[] = products.map(product => ({
                id: product._id.toString(),
                title: product.title,
                price: product.price || 0,
                image: product.image || product.primaryImage || product.images?.[0] || null,
                rating: product.rating || 0,
                url: `/product/${product.slug || product._id}`
            }));

            // Use type assertion
            (formattedPage as FormattedPage).products = productInfoArray;
        }

        return NextResponse.json({
            status: true,
            data: formattedPage
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to get page, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 