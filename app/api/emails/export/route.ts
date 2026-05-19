import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const is_active = searchParams.get('is_active');
        const collection = searchParams.get('collection') || 'email_list';

        // Log the database name being used
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        // Select collection based on parameter
        const dbCollection = db.collection(collection === 'email_subscription' ? 'email_subscription' : 'email_list');

        // Build query
        const query: Record<string, string | { $regex: string, $options: string } | boolean> = {};

        if (search) {
            query.email = { $regex: search, $options: 'i' };
        }

        if (is_active !== null) {
            query.isActive = is_active === 'true';
        }

        // Get data
        const items = await dbCollection.find(query).toArray();

        // Convert to CSV format
        const csvHeader = 'Email,Subscription Date,Status\n';
        const csvRows = items.map(item => {
            const email = item.email;
            const subscribedAt = item.subscribedAt instanceof Date ?
                new Date(item.subscribedAt).toISOString().split('T')[0] :
                (typeof item.subscribedAt === 'string' ? item.subscribedAt.split('T')[0] : 'N/A');
            const status = item.isActive ? 'Active' : 'Inactive';

            return `"${email}","${subscribedAt}","${status}"`;
        });

        const csvContent = csvHeader + csvRows.join('\n');

        // Set response headers for CSV download
        const headers = new Headers();

        headers.set('Content-Type', 'text/csv; charset=utf-8');
        headers.set('Content-Disposition', `attachment; filename=email_${collection}_${new Date().toISOString().split('T')[0]}.csv`);

        return new NextResponse(csvContent, {
            status: 200,
            headers
        });
    } catch (error) {
        // Set response headers
        const headers = new Headers();

        headers.append('Content-Type', 'application/json');
        headers.append('Cache-Control', 'no-cache, no-store, must-revalidate');

        return NextResponse.json(
            {
                success: false,
                message: 'Failed to export email list, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            {
                status: 500,
                headers
            }
        );
    }
} 