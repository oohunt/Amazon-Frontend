import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

// Possible types for MongoDB query values
type MongoQueryValue = string | number | boolean | { $regex: string, $options: string } | Date | RegExp;

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const sort_by = searchParams.get('sort_by') || 'subscribedAt';
        const sort_order = searchParams.get('sort_order') || 'desc';
        const search = searchParams.get('search') || '';
        const is_active = searchParams.get('is_active');
        const collection = searchParams.get('collection') || 'users';

        // Log the database name being used
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        // Select different collection based on collection parameter
        const dbCollection = db.collection(collection === 'email_subscription' ? 'email_subscription' : 'users');

        // Build query conditions
        const query: Record<string, MongoQueryValue> = {};

        if (search) {
            query.email = { $regex: search, $options: 'i' };
        }

        if (is_active !== null) {
            query.isActive = is_active === 'true';
        }

        // Calculate total count
        const total = await dbCollection.countDocuments(query);

        // Get data
        const items = await dbCollection.find(query)
            .sort({ [sort_by]: sort_order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .toArray();

        // Convert to format needed by frontend
        const formattedItems = items.map(item => ({
            id: item._id.toString(),
            email: item.email,
            subscribedAt: item.subscribedAt instanceof Date ? item.subscribedAt.toISOString() : item.subscribedAt,
            isActive: item.isActive
        }));

        // Set response headers to allow cross-origin and avoid caching
        const headers = new Headers();

        headers.append('Content-Type', 'application/json');
        headers.append('Cache-Control', 'no-cache, no-store, must-revalidate');
        headers.append('Pragma', 'no-cache');
        headers.append('Expires', '0');

        // Allow all origins, not recommended for production
        if (process.env.NODE_ENV === 'development') {
            headers.append('Access-Control-Allow-Origin', '*');
            headers.append('Access-Control-Allow-Methods', 'GET, OPTIONS');
            headers.append('Access-Control-Allow-Headers', 'Content-Type');
        }

        return NextResponse.json({
            data: {
                items: formattedItems,
                total,
                page,
                page_size: limit
            },
            success: true
        }, {
            headers: headers
        });
    } catch (error) {
        // Set response headers to allow cross-origin and avoid caching
        const headers = new Headers();

        headers.append('Content-Type', 'application/json');
        headers.append('Cache-Control', 'no-cache, no-store, must-revalidate');

        if (process.env.NODE_ENV === 'development') {
            headers.append('Access-Control-Allow-Origin', '*');
            headers.append('Access-Control-Allow-Methods', 'GET, OPTIONS');
            headers.append('Access-Control-Allow-Headers', 'Content-Type');
        }

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to load email list, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            {
                status: 500,
                headers: headers
            }
        );
    }
} 