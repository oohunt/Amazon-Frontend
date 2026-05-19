// import { ObjectId } from 'mongodb'; // Restore import
// Correct import statement
import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';
import type { ContentCategoryCreateRequest } from '@/types/cms';

// Get category list
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const _page = parseInt(searchParams.get('page') || '1');
        // Note: to calculate postCount, pagination limit is temporarily removed to fetch all categories
        const limit = parseInt(searchParams.get('limit') || '500'); // Fetch all categories
        const search = searchParams.get('search') || '';
        const parentId = searchParams.get('parentId') || null;

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const categoriesCollection = db.collection('cms_categories');
        const _pagesCollection = db.collection('cms_pages');

        // Build query conditions
        const query: Record<string, unknown> = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (parentId) {
            query.parentId = parentId;
        } else if (parentId === 'null') {
            query.parentId = { $exists: false };
        }

        // Use aggregation pipeline to fetch categories along with their associated post counts
        const aggregationPipeline = [
            { $match: query },
            { $sort: { name: 1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'cms_pages',
                    let: { categoryId: { $toString: '$_id' } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ['$$categoryId', '$categories'] },
                                status: 'published'
                            }
                        },
                        { $count: 'count' }
                    ],
                    as: 'relatedPages'
                }
            },
            {
                $addFields: {
                    postCount: { $ifNull: [{ $first: '$relatedPages.count' }, 0] }
                }
            },
            {
                $project: {
                    relatedPages: 0
                }
            }
        ];

        // Fetch data
        const categories = await categoriesCollection.aggregate(aggregationPipeline).toArray();

        // Calculate total count
        const total = categories.length;
        // const originalLimit = parseInt(searchParams.get('limit') || '50');
        // const totalPages = Math.ceil(total / originalLimit);

        // Format data
        const formattedCategories = categories.map(category => ({
            ...category,
            _id: category._id.toString(),
            postCount: category.postCount,
            createdAt: category.createdAt instanceof Date ? category.createdAt.toISOString() : category.createdAt,
            updatedAt: category.updatedAt instanceof Date ? category.updatedAt.toISOString() : category.updatedAt
        }));

        // const startIndex = (page - 1) * originalLimit;
        // const paginatedCategories = formattedCategories.slice(startIndex, startIndex + originalLimit);

        return NextResponse.json({
            status: true,
            data: {
                categories: formattedCategories, // Return all categories with counts
                // totalPages, // Uncomment if pagination is restored
                // currentPage: page, // Uncomment if pagination is restored
                totalItems: total
            }
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to get category list, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Create new category
export async function POST(request: NextRequest) {
    try {
        const body: ContentCategoryCreateRequest = await request.json();

        // Validate required fields
        if (!body.name || !body.slug) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Category name and URL path are required'
                },
                { status: 400 }
            );
        }

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_categories');

        // Check if the slug already exists
        const existingCategory = await collection.findOne({ slug: body.slug });

        if (existingCategory) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'This URL path is already in use, please choose a different one'
                },
                { status: 400 }
            );
        }

        // Build category data
        const now = new Date();
        const categoryData = {
            name: body.name,
            slug: body.slug,
            description: body.description || '',
            parentId: body.parentId || null,
            createdAt: now,
            updatedAt: now
        };

        // Insert data
        const result = await collection.insertOne(categoryData);

        if (!result.acknowledged) {
            throw new Error('Database insertion failed');
        }

        // Return the created category data
        return NextResponse.json({
            status: true,
            message: 'Category created successfully',
            data: {
                ...categoryData,
                _id: result.insertedId.toString()
            }
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to create category, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 