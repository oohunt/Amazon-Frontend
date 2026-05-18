import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
    const uri = process.env.MONGODB_URI || '';
    const db_name = process.env.MONGODB_DB || 'oohunt';
    const uriPrefix = uri.substring(0, 50);
    
    try {
        const client = await clientPromise;
        const db = client.db(db_name);
        const collections = await db.listCollections().toArray();
        const productsCount = await db.collection('products').countDocuments();
        
        return NextResponse.json({
            uri_prefix: uriPrefix,
            db_name,
            collections: collections.map(c => c.name),
            products_count: productsCount,
        });
    } catch (e) {
        return NextResponse.json({ 
            uri_prefix: uriPrefix, 
            db_name,
            error: e instanceof Error ? e.message : String(e) 
        }, { status: 500 });
    }
}
