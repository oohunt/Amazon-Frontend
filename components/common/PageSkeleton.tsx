import React from 'react';

import ProductCardSkeleton from './ProductCardSkeleton';

interface PageSkeletonProps {
    title?: boolean;
    action?: boolean;
    productCount?: number;
}

/**
 * Page skeleton screen component
 * Display loading state for the entire page
 */
const PageSkeleton: React.FC<PageSkeletonProps> = ({
    title = true,
    action = true,
    productCount = 8,
}) => {
    return (
        <div className="animate-fade-in">
            {/* Title and action buttons area */}
            {title && (
                <div className="mb-8 flex items-center justify-between">
                    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    {action && (
                        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    )}
                </div>
            )}

            {/* Statistics area */}
            <div className="mb-6 h-5 w-60 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />

            {/* Product card grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <ProductCardSkeleton count={productCount} />
            </div>
        </div>
    );
};

export default PageSkeleton; 