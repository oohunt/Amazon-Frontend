import { NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

/**
 * 健康检查API端点
 * GET /api/health
 */
export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'oohunt');
        // Lightweight ping
        await db.command({ ping: 1 });

        return NextResponse.json({
            success: true,
            data: {
                status: 'ok',
                database: 'connected',
                timestamp: new Date().toISOString(),
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Database connection failed'
        }, { status: 500 });
    }
}
