import { ObjectId } from 'mongodb';
import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';
import type { ContentCategoryUpdateRequest } from '@/types/cms';

// Get a single category
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
                    message: 'Invalid category ID'
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
        const category = await collection.findOne({ _id: new ObjectId(id) });

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

// Update category
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body: ContentCategoryUpdateRequest = await request.json();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Invalid category ID'
                },
                { status: 400 }
            );
        }

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_categories');

        // Check if the category exists
        const existingCategory = await collection.findOne({ _id: new ObjectId(id) });

        if (!existingCategory) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Category not found'
                },
                { status: 404 }
            );
        }

        // If the slug was updated, check for conflicts with other categories
        if (body.slug && body.slug !== existingCategory.slug) {
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
                    message: 'Category not found'
                },
                { status: 404 }
            );
        }

        // Get the updated category
        const updatedCategory = await collection.findOne({ _id: new ObjectId(id) });

        // Format data
        const formattedCategory = {
            ...updatedCategory,
            _id: updatedCategory?._id.toString(),
            createdAt: updatedCategory?.createdAt instanceof Date ? updatedCategory.createdAt.toISOString() : updatedCategory?.createdAt,
            updatedAt: updatedCategory?.updatedAt instanceof Date ? updatedCategory.updatedAt.toISOString() : updatedCategory?.updatedAt
        };

        return NextResponse.json({
            status: true,
            message: 'Category updated successfully',
            data: formattedCategory
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to update category, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Delete category
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
                    message: 'Invalid category ID'
                },
                { status: 400 }
            );
        }

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_categories');
        const pagesCollection = db.collection('cms_pages');

        // Check if any pages are using this category
        const pagesUsingCategory = await pagesCollection.countDocuments({
            categories: id
        });

        if (pagesUsingCategory > 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: `Cannot delete category, ${pagesUsingCategory} page(s) are currently using it`
                },
                { status: 400 }
            );
        }

        // Check if there are any child categories
        const childCategories = await collection.countDocuments({
            parentId: id
        });

        if (childCategories > 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: `Cannot delete category, ${childCategories} child category(ies) depend on it`
                },
                { status: 400 }
            );
        }

        // Delete the category
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Category not found or deletion failed'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to delete category, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 