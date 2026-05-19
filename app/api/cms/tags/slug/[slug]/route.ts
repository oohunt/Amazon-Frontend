import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

// Get tag by slug
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {

        // First wait for params to resolve
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
        const collection = db.collection('cms_tags');

        // Query tag
        const tag = await collection.findOne({ slug });


        if (!tag) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Tag not found'
                },
                { status: 404 }
            );
        }

        // Convert format
        const formattedTag = {
            ...tag,
            _id: tag._id.toString(),
            createdAt: tag.createdAt instanceof Date ? tag.createdAt.toISOString() : tag.createdAt,
            updatedAt: tag.updatedAt instanceof Date ? tag.updatedAt.toISOString() : tag.updatedAt
        };

        return NextResponse.json({
            status: true,
            data: formattedTag
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to get tag, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 