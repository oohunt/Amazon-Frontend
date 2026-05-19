import { ObjectId } from 'mongodb';
import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

// Define update data interface
interface UpdateData {
    isProcessed: boolean;
    processedAt?: Date; // Optional property
    notes?: string; // Optional property
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Get ID from params
        const { id } = await params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Message ID is required' },
                { status: 400 }
            );
        }

        const { isProcessed, notes } = await request.json();

        // Use database name from environment variable configuration
        const dbName = process.env.MONGODB_DB || 'oohunt';

        // Validate ID format
        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid message ID' },
                { status: 400 }
            );
        }

        // Validate if isProcessed is boolean
        if (typeof isProcessed !== 'boolean') {
            return NextResponse.json(
                { success: false, message: 'Status must be a boolean value' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('contact_messages');

        // Prepare update data
        const updateData: UpdateData = {
            isProcessed,
            ...(isProcessed ? { processedAt: new Date() } : {})
        };

        // If notes provided, update notes
        if (notes !== undefined) {
            updateData.notes = notes;
        }

        // update message status
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Message not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Message has been ${isProcessed ? 'processed' : 'marked as pending'}`
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update message status, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 