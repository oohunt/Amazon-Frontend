import { ObjectId } from 'mongodb';
import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';
import type { ContentTagUpdateRequest } from '@/types/cms';

// Get a single tag
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Invalid tag ID'
                },
                { status: 400 }
            );
        }

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_tags');

        // Query the tag
        const tag = await collection.findOne({ _id: new ObjectId(id) });

        if (!tag) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Tag not found'
                },
                { status: 404 }
            );
        }

        // Format data
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

// Update tag
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body: ContentTagUpdateRequest = await request.json();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Invalid tag ID'
                },
                { status: 400 }
            );
        }

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_tags');

        // Check if the tag exists
        const existingTag = await collection.findOne({ _id: new ObjectId(id) });

        if (!existingTag) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Tag not found'
                },
                { status: 404 }
            );
        }

        // If the slug was updated, check for conflicts with other tags
        if (body.slug && body.slug !== existingTag.slug) {
            const slugExists = await collection.findOne({
                slug: body.slug,
                _id: { $ne: new ObjectId(id) }
            });

            if (slugExists) {
                return NextResponse.json(
                    {
                        status: false,
                        message: 'This URL path is already in use, please choose a different one'
                    },
                    { status: 400 }
                );
            }
        }

        // Build update data
        const updateData = {
            ...body,
            updatedAt: new Date()
        };

        // Update data
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Tag not found'
                },
                { status: 404 }
            );
        }

        // Get the updated tag
        const updatedTag = await collection.findOne({ _id: new ObjectId(id) });

        // Format data
        const formattedTag = {
            ...updatedTag,
            _id: updatedTag?._id.toString(),
            createdAt: updatedTag?.createdAt instanceof Date ? updatedTag.createdAt.toISOString() : updatedTag?.createdAt,
            updatedAt: updatedTag?.updatedAt instanceof Date ? updatedTag.updatedAt.toISOString() : updatedTag?.updatedAt
        };

        return NextResponse.json({
            status: true,
            message: 'Tag updated successfully',
            data: formattedTag
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: false,
                message: 'Failed to update tag, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Delete tag
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Invalid tag ID'
                },
                { status: 400 }
            );
        }

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_tags');
        const pagesCollection = db.collection('cms_pages');

        // Check if any pages are using this tag
        const pagesUsingTag = await pagesCollection.countDocuments({
            tags: id
        });

        if (pagesUsingTag > 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: `Cannot delete tag, ${pagesUsingTag} page(s) are currently using it`
                },
                { status: 400 }
            );
        }

        // Delete the tag
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Tag not found or deletion failed'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: true,
            message: 'Tag deleted successfully'
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to delete tag, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 