'use client';

import React from 'react';

interface ProductCardsContainerProps {
    children: React.ReactNode;
    gap?: number; // Spacing between cards
    wrap?: boolean; // Whether to allow line wrapping
}

/**
 * Product card container component — displays multiple product cards horizontally on frontend pages
 * 
 * This container uses flex layout to ensure product cards are arranged horizontally
 * 
 * @param {ProductCardsContainerProps} props - Component props
 * @returns {JSX.Element} Product card container
 */
const ProductCardsContainer: React.FC<ProductCardsContainerProps> = ({
    children,
    gap = 4, // Default spacing
    wrap = true // Default: allow line wrapping
}) => {
    return (
        <div
            className={`
                flex 
                ${wrap ? 'flex-wrap' : 'flex-nowrap overflow-x-auto'} 
                items-start 
                gap-${gap}
                py-2
                w-full
            `}
            style={{
                // Ensure child elements are not compressed by flex layout
                minWidth: 0
            }}
        >
            {children}
        </div>
    );
};

export default ProductCardsContainer; 