import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname, searchParams } = new URL(request.url);

    // Check if using old category URL format
    if (pathname === '/product' && (searchParams.has('product_groups') || searchParams.has('category'))) {
        const category = searchParams.get('product_groups') || searchParams.get('category');

        if (category) {
            // Build new URL path — use categoryId as parameter name
            const newPath = `/product/category/${encodeURIComponent(category)}`;

            // Preserve other query parameters
            const newSearchParams = new URLSearchParams();

            searchParams.forEach((value, key) => {
                if (key !== 'product_groups' && key !== 'category') {
                    newSearchParams.append(key, value);
                }
            });

            // Build complete URL
            const queryString = newSearchParams.toString();
            const redirectUrl = queryString
                ? `${newPath}?${queryString}`
                : newPath;

            // Return 301 permanent redirect
            return NextResponse.redirect(new URL(redirectUrl, request.url), {
                status: 301
            });
        }
    }

    // For other requests, continue processing
    return NextResponse.next();
}

// Apply middleware to specific paths only
export const config = {
    matcher: ['/product'],
}; 