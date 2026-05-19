import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

// Get product list for embedding in CMS content pages
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('products');

        // Build query conditions
        const query: Record<string, unknown> = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { asin: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) {
            query.categoryId = category;
        }

        // Only fetch published products
        query.status = 'published';

        // Calculate total count
        const total = await collection.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Fetch data
        const products = await collection.find(query)
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        // Format data, returning only the fields required for CMS embedding
        const formattedProducts = products.map(product => ({
            id: product._id.toString(),
            asin: product.asin || null,
            title: product.title,
            image: product.image || product.primaryImage || product.featuredImage || product.images?.[0] || null,
            price: product.price || product.salePrice || 0,
            rating: product.rating || 0,
            sku: product.sku || ''
        }));

        return NextResponse.json({
            status: true,
            data: {
                products: formattedProducts,
                totalPages,
                currentPage: page,
                totalItems: total
            }
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to get product list, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 