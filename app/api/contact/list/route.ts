import { NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

// Possible types for MongoDB query values
type _MongoQueryValue = string | number | boolean | { $regex: string, $options: string } | Date | RegExp | Record<string, unknown>;

// Define query conditions interface
interface Query {
    $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
    isProcessed?: boolean; // Optional property
    formSource?: string | { $exists: boolean, $ne?: null }; // Form source type
}

export async function GET(req: Request) {
    try {
        // Get query parameters from URL
        const { searchParams } = new URL(req.url);
        const page = searchParams.get("page") ? parseInt(searchParams.get("page") as string) : 1;
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string) : 10;
        const search = searchParams.get("search") as string;
        const isProcessed = searchParams.get("isProcessed");
        const formSource = searchParams.get("formSource") as string;
        const formSourceExists = searchParams.get("formSourceExists");

        // Validate pagination parameters
        const validPage = page > 0 ? page : 1;
        const validLimit = limit > 0 ? limit : 10;
        const skip = (validPage - 1) * validLimit;

        // Use database name from environment variables
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        // Use contact_messages as collection name
        const collection = db.collection('contact_messages');

        // Build query conditions
        const query: Query = {};

        // If there's a search term, search multiple fields
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        // If filtering by processing status
        if (isProcessed === "true") {
            query.isProcessed = true;
        } else if (isProcessed === "false") {
            query.isProcessed = false;
        }

        // If filtering by formSource
        if (formSource) {
            query.formSource = formSource;
        } else if (formSourceExists === "true") {
            query.formSource = { $exists: true, $ne: null };
        } else if (formSourceExists === "false") {
            query.formSource = { $exists: false };
        }

        // Calculate total
        const total = await collection.countDocuments(query);

        // Get data
        const items = await collection.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(validLimit)
            .toArray();

        // Convert to format needed by frontend
        const formattedItems = items.map(item => ({
            id: item._id.toString(),
            name: item.name,
            email: item.email,
            message: item.message,
            subject: item.subject,
            phone: item.phone,
            createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
            isProcessed: item.isProcessed,
            processedAt: item.processedAt instanceof Date ? item.processedAt.toISOString() : item.processedAt,
            notes: item.notes,
            formSource: item.formSource,
            formId: item.formId,
        }));

        // Calculate total pages
        const totalPages = Math.ceil(total / validLimit);

        // Build pagination object
        const pagination = {
            currentPage: validPage,
            totalPages,
            totalItems: total,
            itemsPerPage: validLimit,
        };

        // Set response headers to allow cross-domain and avoid caching
        const headers = new Headers();

        headers.append('Content-Type', 'application/json');
        headers.append('Cache-Control', 'no-cache, no-store, must-revalidate');
        headers.append('Pragma', 'no-cache');
        headers.append('Expires', '0');

        // Allow all sources, which is not recommended in production
        if (process.env.NODE_ENV === 'development') {
            headers.append('Access-Control-Allow-Origin', '*');
            headers.append('Access-Control-Allow-Methods', 'GET, OPTIONS');
            headers.append('Access-Control-Allow-Headers', 'Content-Type');
        }

        return NextResponse.json({
            success: true,
            data: {
                items: formattedItems,
                total,
                page: validPage,
                page_size: validLimit,
            },
            pagination,
        }, {
            headers: headers
        });
    } catch (error) {
        // Set response headers to allow cross-domain and avoid caching
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
                message: 'Failed to load contact messages, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            {
                status: 500,
                headers: headers
            }
        );
    }
} 