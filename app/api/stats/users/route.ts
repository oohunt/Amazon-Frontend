import { NextResponse } from 'next/server';

import { getUserStats } from '@/lib/services/stats';

/**
 * GET /api/stats/users - Fetch user statistics
 */
export async function GET() {
    try {
        const stats = await getUserStats();

        return NextResponse.json({ data: stats }, { status: 200 });
    } catch {

        return NextResponse.json(
            { error: 'Failed to get user statistics' },
            { status: 500 }
        );
    }
} 