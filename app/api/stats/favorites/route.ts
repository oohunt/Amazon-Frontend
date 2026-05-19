import { NextResponse } from 'next/server';

import { getFavoriteStats } from '@/lib/services/stats';

/**
 * GET /api/stats/favorites - Fetch favorites statistics
 */
export async function GET() {
    try {
        const stats = await getFavoriteStats();

        return NextResponse.json({ data: stats }, { status: 200 });
    } catch {

        return NextResponse.json(
            { error: 'Failed to get favorites statistics' },
            { status: 500 }
        );
    }
} 