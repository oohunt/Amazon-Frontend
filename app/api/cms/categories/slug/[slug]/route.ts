import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

// Get category by slug
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {

        // First await params resolution
        const resolvedParams = await params;
        const slug = resolvedParams.slug;

        if (!slug) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Slug is required'
                },
                { status: 400 }
            );
        }

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_categories');

        // Query the category
        const category = await collection.findOne({ slug });


        if (!category) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Category not found'
                },
                { status: 404 }
            );
        }

        // Format data
        const formattedCategory = {
            ...category,
            _id: category._id.toString(),
            createdAt: category.createdAt instanceof Date ? category.createdAt.toISOString() : category.createdAt,
            updatedAt: category.updatedAt instanceof Date ? category.updatedAt.toISOString() : category.updatedAt
        };

        return NextResponse.json({
            status: true,
            data: formattedCategory
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to get category, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 