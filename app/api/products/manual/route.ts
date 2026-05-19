import { NextResponse, type NextRequest } from 'next/server';

import clientPromise from '@/lib/mongodb';

/**
 * Handle manual product addition POST request — stores directly in MongoDB
 */
export async function POST(request: NextRequest) {
    try {
        const productData = await request.json();

        if (!productData.product_id && !productData.asin) {
            return NextResponse.json(
                { success: false, error: 'product_id or asin is required' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'oohunt');
        const collection = db.collection('products');

        // Check for duplicate
        const existing = await collection.findOne({
            $or: [
                { product_id: productData.product_id },
                { asin: productData.asin },
            ].filter(Boolean)
        });

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Product already exists', product_id: existing.product_id },
                { status: 409 }
            );
        }

        const doc = {
            ...productData,
            source: productData.source || 'manual',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await collection.insertOne(doc);

        return NextResponse.json({
            success: true,
            message: 'Product added successfully',
            id: result.insertedId.toString(),
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Server error processing request' },
            { status: 500 }
        );
    }
}
