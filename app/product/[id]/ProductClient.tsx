"use client";

import { useMemo } from 'react';

import type { ComponentProduct } from '@/types';

import ProductImageGallery from './ProductImageGallery';
import ProductInfo from './ProductInfo';

interface ProductClientProps {
    product: ComponentProduct;
    otherOffers?: ComponentProduct[];
}

export default function ProductClient({ product, otherOffers = [] }: ProductClientProps) {
    // Ensure no extra rendering
    const cleanedProduct = useMemo(() => {
        return { ...product };
    }, [product]);

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-0 sm:pt-2">
            {/* Product detail card */}
            <div className="product-container bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md mb-6 relative">
                {/* Adjust to vertical layout for tablet and mobile */}
                <div className="flex flex-col lg:flex-row">
                    {/* Product image gallery - adjust width ratio */}
                    <div className="w-full lg:w-1/2 p-2 sm:p-3 md:p-4 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700">
                        <ProductImageGallery product={cleanedProduct} />
                    </div>

                    {/* Product information - adjust width ratio */}
                    <div className="w-full lg:w-1/2 p-2 sm:p-3 md:p-4">
                        <ProductInfo product={cleanedProduct} otherOffers={otherOffers} />
                    </div>
                </div>
            </div>
        </div>
    );
} 