import React, { useMemo } from 'react';

interface ProductCardSkeletonProps {
    count?: number;
}

/**
 * Product card skeleton component
 * Used to display loading state for product cards
 */
const ProductCardSkeleton: React.FC<ProductCardSkeletonProps> = ({
    count = 1,
}) => {
    // Generate a set of stable unique IDs, created only on initial render
    const skeletonIds = useMemo(() =>
        Array.from({ length: count }, (_, i) => `product-skeleton-${i}-${Math.random().toString(36).substr(2, 9)}`),
        [count]);

    return (
        <>
            {skeletonIds.map((id) => (
                <div
                    key={id}
                    className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden h-full animate-pulse"
                >
                    {/* Image area skeleton */}
                    <div className="w-full h-48 bg-gray-200 dark:bg-gray-800" />

                    {/* Content area skeleton */}
                    <div className="p-4">
                        {/* Store badge skeleton */}
                        <div className="flex justify-end mb-2">
                            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>

                        {/* Brand tag skeleton */}
                        <div className="mb-2">
                            <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded inline-block" />
                        </div>

                        {/* Title skeleton */}
                        <div className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                        <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />

                        {/* Price skeleton */}
                        <div className="flex items-center justify-between mt-auto mb-4">
                            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="h-5 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>

                        {/* Button skeleton */}
                        <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-full mt-4" />
                    </div>
                </div>
            ))}
        </>
    );
};

export default ProductCardSkeleton; 