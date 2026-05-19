import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';
import type { ContentPageCreateRequest } from '@/types/cms';

// Get content page list
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const sortBy = searchParams.get('sortBy') || 'updatedAt';
        const sortOrder = searchParams.get('sortOrder') || 'desc';
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_pages');

        // Build query conditions
        const query: Record<string, unknown> = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        // Calculate total count
        const total = await collection.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Fetch data
        const pages = await collection.find(query)
            .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        // Format data
        const formattedPages = pages.map(page => ({
            ...page,
            _id: page._id.toString(),
            createdAt: page.createdAt instanceof Date ? page.createdAt.toISOString() : page.createdAt,
            updatedAt: page.updatedAt instanceof Date ? page.updatedAt.toISOString() : page.updatedAt,
            publishedAt: page.publishedAt instanceof Date ? page.publishedAt.toISOString() : page.publishedAt
        }));

        return NextResponse.json({
            status: 200,
            success: true,
            data: {
                pages: formattedPages,
                totalPages,
                currentPage: page,
                totalItems: total
            }
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to get page list, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Create new content page
export async function POST(request: NextRequest) {
    try {
        const body: ContentPageCreateRequest = await request.json();

        // Validate required fields
        if (!body.title || !body.slug || !body.content) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Title, URL path, and content are required'
                },
                { status: 400 }
            );
        }

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_pages');

        // Check if the slug already exists
        const existingPage = await collection.findOne({ slug: body.slug });

        if (existingPage) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'This URL path is already in use, please choose a different one'
                },
                { status: 400 }
            );
        }

        // Build page data
        const now = new Date();
        const pageData = {
            title: body.title,
            slug: body.slug,
            content: body.content,
            excerpt: body.excerpt || '',
            featuredImage: body.featuredImage || '',
            categories: body.categories || [],
            tags: body.tags || [],
            author: body.author || 'Unknown',
            status: body.status || 'draft',
            publishedAt: body.publishedAt || null,
            createdAt: now,
            updatedAt: now,
            seoData: body.seoData || {},
            productIds: body.productIds || []
        };

        // Insert data
        const result = await collection.insertOne(pageData);

        if (!result.acknowledged) {
            throw new Error('Database insertion failed');
        }

        // Return the created page data
        return NextResponse.json({
            status: 200,
            success: true,
            message: 'Page created successfully',
            data: {
                ...pageData,
                _id: result.insertedId.toString()
            }
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to create page, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 