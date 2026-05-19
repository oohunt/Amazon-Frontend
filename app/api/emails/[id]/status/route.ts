import { ObjectId } from 'mongodb';
import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Get ID from Next.js params instead of parsing from path
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Email ID is required' },
                { status: 400 }
            );
        }

        const { isActive } = await request.json();
        const searchParams = request.nextUrl.searchParams;
        const collection = searchParams.get('collection') || 'users';

        // Log the database name being used
        const dbName = process.env.MONGODB_DB || 'oohunt';

        // Validate ID format
        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid email ID' },
                { status: 400 }
            );
        }

        // Validate isActive is boolean
        if (typeof isActive !== 'boolean') {
            return NextResponse.json(
                { success: false, message: 'Status must be a boolean value' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(dbName);
        // Select collection based on parameter
        const dbCollection = db.collection(collection === 'email_subscription' ? 'email_subscription' : 'users');

        // Update email status
        const result = await dbCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { isActive } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Email not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Email status has been ${isActive ? 'activated' : 'deactivated'}`
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update email status, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 