"use client";

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import ProductsPage from '@/app/product/page';

// Client wrapper component
export function CategoryPageWrapper({ categorySlug }: { categorySlug: string }) {
    const pathname = usePathname();

    // Force URL consistency to prevent overwriting
    useEffect(() => {
        // Prevent race condition: delay execution to ensure it is the last URL update
        const timer = setTimeout(() => {
            const expectedPath = `/product/category/${encodeURIComponent(categorySlug)}`;

            // Update only when actual path differs from expected path
            if (pathname !== expectedPath && categorySlug) {
                // Use browser API to update URL directly
                window.history.replaceState(
                    null,
                    '',
                    expectedPath
                );
            }
        }, 100); // 100ms delay to ensure it is the last operation executed

        return () => clearTimeout(timer);
    }, [pathname, categorySlug]);

    return <ProductsPage />;
} 