/**
 * Single favorite operation API
 * POST: Add product to favorites
 * DELETE: Remove product from favorites
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
    validateClientId,
    addToClientFavorites,
    removeFromClientFavorites
} from '@/lib/server/favorites';

/**
 * Handle POST request — add product to favorites
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
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

        // Get product ID
        const { productId } = await params;

        if (!productId || typeof productId !== 'string') {
            return NextResponse.json(
                {
                    code: 400,
                    message: 'Invalid product ID',
                    data: null
                },
                { status: 400 }
            );
        }

        // Add to favorites
        const _updatedIds = addToClientFavorites(clientId, productId);

        return NextResponse.json(
            {
                code: 200,
                message: 'Added to favorites successfully',
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

/**
 * Handle DELETE request — remove product from favorites
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
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

        // Get product ID
        const { productId } = await params;

        if (!productId || typeof productId !== 'string') {
            return NextResponse.json(
                {
                    code: 400,
                    message: 'Invalid product ID',
                    data: null
                },
                { status: 400 }
            );
        }

        // remove from favorites
        const _updatedIds = removeFromClientFavorites(clientId, productId);

        return NextResponse.json(
            {
                code: 200,
                message: 'Removed from favorites successfully',
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