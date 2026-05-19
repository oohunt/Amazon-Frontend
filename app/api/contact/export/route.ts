import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

// Define query conditions interface
interface Query {
    $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
    isProcessed?: boolean; // Optional property
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const is_processed = searchParams.get('is_processed');

        // Use database name from environment variable configuration
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        // Use contact_messages collection
        const collection = db.collection('contact_messages');

        // Build query conditions
        const query: Query = {};

        // If search term exists, search across multiple fields
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }

        // If filter processing status
        if (is_processed !== null) {
            query.isProcessed = is_processed === 'true';
        }

        // Get data
        const items = await collection.find(query).toArray();

        // Convert to CSV format
        const csvHeader = 'Name,Email,Subject,Message,Date,Status,Phone,Notes\n';
        const csvRows = items.map(item => {
            const name = item.name || '';
            const email = item.email || '';
            const subject = item.subject || '';
            // Sanitize message text, remove quotes and newlines
            const message = (item.message || '').replace(/"/g, '""').replace(/\n/g, ' ');
            const createdAt = item.createdAt instanceof Date ?
                new Date(item.createdAt).toISOString().split('T')[0] :
                (typeof item.createdAt === 'string' ? item.createdAt.split('T')[0] : 'N/A');
            const status = item.isProcessed ? 'Processed' : 'Pending';
            const phone = item.phone || '';
            const notes = (item.notes || '').replace(/"/g, '""').replace(/\n/g, ' ');

            return `"${name}","${email}","${subject}","${message}","${createdAt}","${status}","${phone}","${notes}"`;
        });

        const csvContent = csvHeader + csvRows.join('\n');

        // Set response headers for CSV download
        const headers = new Headers();

        headers.set('Content-Type', 'text/csv; charset=utf-8');
        headers.set('Content-Disposition', `attachment; filename=contact_messages_${new Date().toISOString().split('T')[0]}.csv`);

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
                message: 'Failed to export contact messages, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            {
                status: 500,
                headers
            }
        );
    }
} 