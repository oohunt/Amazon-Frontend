import { NextResponse, type NextRequest } from 'next/server';

// Handle redirect for old URL format
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('product_groups') || searchParams.get('category');

    // If no category parameter, redirect to product home page
    if (!category) {
        return NextResponse.redirect(new URL('/product', request.url));
    }

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
        status: 301,
        headers: {
            'Cache-Control': 'public, max-age=31536000, immutable'
        }
    });
} 