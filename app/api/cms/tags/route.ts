// import { ObjectId } from 'mongodb'; // Restore import
// Correct import statement
import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';
import type { ContentTagCreateRequest } from '@/types/cms';

// Get tag list
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const _page = parseInt(searchParams.get('page') || '1');
        // Note: to calculate postCount, pagination limit is temporarily removed to fetch all tags
        // If there are a very large number of tags, this may need to be optimized with aggregation pagination
        const limit = parseInt(searchParams.get('limit') || '500'); // Fetch all tags
        const search = searchParams.get('search') || '';

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const tagsCollection = db.collection('cms_tags');
        const _pagesCollection = db.collection('cms_pages');

        // Build query conditions
        const query: Record<string, unknown> = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } }
            ];
        }

        // Use aggregation pipeline to fetch tags along with their associated post counts
        const aggregationPipeline = [
            // Match query conditions
            { $match: query },
            // Sort by name
            { $sort: { name: 1 } },
            // Limit results (temporarily fetch all)
            { $limit: limit },
            // Join with cms_pages collection
            {
                $lookup: {
                    from: 'cms_pages',
                    // Note: tags in cms_pages are stored as ObjectId strings, so conversion is needed
                    // Assumes the tags field stores the string form of tag._id
                    let: { tagId: { $toString: '$_id' } },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ['$$tagId', '$tags'] },
                                status: 'published' // Only count published posts
                            }
                        },
                        { $count: 'count' } // Count matching posts
                    ],
                    as: 'relatedPages'
                }
            },
            // Add postCount field
            {
                $addFields: {
                    postCount: { $ifNull: [{ $first: '$relatedPages.count' }, 0] }
                }
            },
            // Remove the relatedPages field that is no longer needed
            {
                $project: {
                    relatedPages: 0
                }
            }
        ];

        // Fetch data
        const tags = await tagsCollection.aggregate(aggregationPipeline).toArray();

        // Calculate total count (total from aggregation result)
        // Note: this total reflects tags matched by the aggregation query, not all tags
        const total = tags.length;
        // Calculate pagination based on the original limit parameter (if pagination is restored)
        // const originalLimit = parseInt(searchParams.get('limit') || '50');
        // const totalPages = Math.ceil(total / originalLimit);

        // Format data (aggregation result already includes _id)
        const formattedTags = tags.map(tag => ({
            ...tag,
            _id: tag._id.toString(), // Ensure _id is a string
            postCount: tag.postCount, // Ensure postCount exists
            createdAt: tag.createdAt instanceof Date ? tag.createdAt.toISOString() : tag.createdAt,
            updatedAt: tag.updatedAt instanceof Date ? tag.updatedAt.toISOString() : tag.updatedAt
        }));

        // If pagination logic needs to be restored, slice formattedTags here
        // const startIndex = (page - 1) * originalLimit;
        // const paginatedTags = formattedTags.slice(startIndex, startIndex + originalLimit);

        return NextResponse.json({
            status: true,
            data: {
                tags: formattedTags, // Return all tags with counts
                // totalPages, // Uncomment if pagination is restored
                // currentPage: page, // Uncomment if pagination is restored
                totalItems: total
            }
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to get tag list, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Create new tag
export async function POST(request: NextRequest) {
    try {
        const body: ContentTagCreateRequest = await request.json();

        // Validate required fields
        if (!body.name || !body.slug) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Tag name and URL path are required'
                },
                { status: 400 }
            );
        }

        // Get database connection
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_tags');

        // Check if the slug already exists
        const existingTag = await collection.findOne({ slug: body.slug });

        if (existingTag) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'This URL path is already in use, please choose a different one'
                },
                { status: 400 }
            );
        }

        // Build tag data
        const now = new Date();
        const tagData = {
            name: body.name,
            slug: body.slug,
            createdAt: now,
            updatedAt: now
        };

        // Insert data
        const result = await collection.insertOne(tagData);

        if (!result.acknowledged) {
            throw new Error('Database insertion failed');
        }

        // Return the created tag data
        return NextResponse.json({
            status: true,
            message: 'Tag created successfully',
            data: {
                ...tagData,
                _id: result.insertedId.toString()
            }
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to create tag, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 