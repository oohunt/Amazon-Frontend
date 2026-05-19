/**
 * Favorites list API
 * GET: Fetch user favorites list
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
    validateClientId,
    getClientFavoriteIds
} from '@/lib/server/favorites';

/**
 * Handle GET request — fetch user favorites list
 */
export async function GET(request: NextRequest) {
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

        // Get list of favorited product IDs
        const favoriteIds = getClientFavoriteIds(clientId);

        // Map IDs to minimal product objects
        const favoriteProducts = favoriteIds.map(id => ({
            id,
            asin: id,
            title: `Product ${id}`,
        }));

        // Return favorites list
        return NextResponse.json(
            {
                code: 200,
                message: 'Favorites retrieved successfully',
                data: favoriteProducts
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
