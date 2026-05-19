/**
 * Favorites sync API
 * POST: Sync local favorites to server
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
    validateClientId,
    syncClientFavorites
} from '@/lib/server/favorites';

/**
 * Handle POST request — sync local favorites to server
 */
export async function POST(request: NextRequest) {
    try {
        // Get and validate client ID
        const clientId = request.headers.get('x-client-id');

        if (!clientId || !validateClientId(clientId)) {
            return NextResponse.json(
                {
                    code: 401,
                    message: 'No valid client ID provided',
                    data: null
                },
                { status: 401 }
            );
        }

        // Get product ID array from request body
        const body = await request.json();
        const { productIds } = body;

        if (!Array.isArray(productIds)) {
            return NextResponse.json(
                {
                    code: 400,
                    message: 'Invalid product ID array',
                    data: null
                },
                { status: 400 }
            );
        }

        // Sync favorites list
        const _updatedIds = syncClientFavorites(clientId, productIds);

        return NextResponse.json(
            {
                code: 200,
                message: 'Favorites synced successfully',
                data: null
            },
            { status: 200 }
        );
    } catch {

        return NextResponse.json(
            {
                code: 500,
                message: 'Internal server error',
                data: null
            },
            { status: 500 }
        );
    }
}
