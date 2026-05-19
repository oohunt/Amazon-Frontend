'use server';

import { revalidateTag } from 'next/cache';

/**
 * Server Action to revalidate the cache for the product list.
 * This is typically called after a product is added, updated, or deleted.
 */
export async function revalidateProductsList() {
    try {
        revalidateTag('products');
        // Return a success response (not required for Server Actions, but can provide feedback)
        // return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch {
        // Throw error or return error response
        // throw new Error('Failed to revalidate product cache');
        // return NextResponse.json({ revalidated: false, error: 'Failed to revalidate' }, { status: 500 });
    }
} 