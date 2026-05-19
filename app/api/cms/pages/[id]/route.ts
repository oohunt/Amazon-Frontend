import { ObjectId } from 'mongodb';
import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';
import type { ContentPageUpdateRequest } from '@/types/cms';

// Get a single content page
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
                    message: 'Invalid page ID'
                },
                { status: 400 }
            );
        }

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_pages');

        // Query the page
        const page = await collection.findOne({ _id: new ObjectId(id) });

        if (!page) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Page not found'
                },
                { status: 404 }
            );
        }

        // Format data
        const formattedPage = {
            ...page,
            _id: page._id.toString(),
            createdAt: page.createdAt instanceof Date ? page.createdAt.toISOString() : page.createdAt,
            updatedAt: page.updatedAt instanceof Date ? page.updatedAt.toISOString() : page.updatedAt,
            publishedAt: page.publishedAt instanceof Date ? page.publishedAt.toISOString() : page.publishedAt
        };

        return NextResponse.json({
            status: 200,
            success: true,
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

// Update content page
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body: ContentPageUpdateRequest = await request.json();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Invalid page ID'
                },
                { status: 400 }
            );
        }

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_pages');

        // Check if the page exists
        const existingPage = await collection.findOne({ _id: new ObjectId(id) });

        if (!existingPage) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Page not found'
                },
                { status: 404 }
            );
        }

        // If the slug was updated, check for conflicts with other pages
        if (body.slug && body.slug !== existingPage.slug) {
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

        // If status changes to published and no publish date is specified, add the current time as the publish date
        if (body.status === 'published' && body.publishedAt === undefined && existingPage.status !== 'published') {
            updateData.publishedAt = new Date();
        }

        // Update data
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Page not found'
                },
                { status: 404 }
            );
        }

        // Get the updated page
        const updatedPage = await collection.findOne({ _id: new ObjectId(id) });

        // Format data
        const formattedPage = {
            ...updatedPage,
            _id: updatedPage?._id.toString(),
            createdAt: updatedPage?.createdAt instanceof Date ? updatedPage.createdAt.toISOString() : updatedPage?.createdAt,
            updatedAt: updatedPage?.updatedAt instanceof Date ? updatedPage.updatedAt.toISOString() : updatedPage?.updatedAt,
            publishedAt: updatedPage?.publishedAt instanceof Date ? updatedPage.publishedAt.toISOString() : updatedPage?.publishedAt
        };

        return NextResponse.json({
            status: 200,
            success: true,
            message: 'Page updated successfully',
            data: formattedPage
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to update page, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Delete content page
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
                    message: 'Invalid page ID'
                },
                { status: 400 }
            );
        }

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_pages');

        // Delete the page
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Page not found or deletion failed'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: 200,
            success: true,
            message: 'Page deleted successfully'
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to delete page, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 