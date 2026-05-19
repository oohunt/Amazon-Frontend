'use client';

import React from 'react';
import useSWR from 'swr';

import { productsApi } from '@/lib/api';
import { adaptProducts } from '@/lib/utils';
import type { ComponentProduct, Product } from '@/types';

// Assuming product display components are moved or accessible from here
// You might need to adjust these import paths
import CardProductElement from './Template/CardProductElement';
import CompactGridItemElement from './Template/CompactGridItemElement';
import FeaturedItemElement from './Template/FeaturedItemElement';
import HorizontalProductElement from './Template/HorizontalProductElement';
import MiniProductElement from './Template/MiniProductElement';
import SimpleProductElement from './Template/SimpleProductElement';

// --- Product Display Components (Moved from ContentRenderer or separate files) ---
// Note: Ensure these components now accept `{ product: ComponentProduct }` props
// and remove any internal default value logic relying on old props.

// SimpleProductElement, CardProductElement, HorizontalProductElement, MiniProductElement
// should be defined here or imported correctly.

// --- Skeleton Placeholder ---
// Modify ProductSkeletonPlaceholder to return span
const ProductSkeletonPlaceholder = ({ style }: { style: string }) => {
    let className = "w-full h-24 my-2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md"; // Default (Simple)

    if (style === 'card') {
        className = "my-4 w-full max-w-[280px] h-96 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg shadow-md inline-block align-middle";
    } else if (style === 'horizontal') {
        className = " w-full max-w-xl h-32 my-4 border rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-sm animate-pulse p-4 items-center inline-block align-middle";
    } else if (style === 'mini') {
        className = "inline-flex items-center my-2 border rounded-lg p-2 bg-gray-200 dark:bg-gray-700 shadow-sm animate-pulse max-w-full w-64 h-14 overflow-hidden align-middle";
    } else if (style === 'compact-grid') {
        className = "inline-block align-middle w-full max-w-[200px] h-64 my-2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg shadow-sm";
    } else if (style === 'featured') {
        className = " flex-col md:flex-row w-full max-w-3xl h-auto md:h-64 my-4 border rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-lg animate-pulse inline-block align-middle";
    }
    // Simple style uses default class

    return <span className={className} />; // Use span as root element
};

// --- DynamicProductLoader ---

interface DynamicProductLoaderProps {
    productId: string;
    style?: string;
    alignment?: 'left' | 'center' | 'right';
    containerElement?: 'div' | 'span'; // Add container element attribute
}

// Fetcher function for SWR
const fetchProduct = async (productIdOrAsin: string): Promise<ComponentProduct | null> => {
    if (!productIdOrAsin) return null;
    try {
        // Prefer getProductById if it's not an ASIN, otherwise try queryProduct
        const isAsin = /^[A-Z0-9]{10,13}$/.test(productIdOrAsin.toUpperCase());
        let apiResponse;

        if (isAsin) {
            apiResponse = await productsApi.queryProduct({ asins: [productIdOrAsin.toUpperCase()], include_browse_nodes: null });
        } else {
            apiResponse = await productsApi.getProductById(productIdOrAsin);
        }

        if (apiResponse?.data) {
            // Handle both array (from query) and single object (from getById)
            const productData = Array.isArray(apiResponse.data) ? apiResponse.data[0] : apiResponse.data;

            if (!productData) {
                return null;
            }
            // Adapt the single product data
            // Ensure adaptProducts handles the structure correctly
            const adapted = adaptProducts([productData as Product]);

            return adapted[0] || null;
        }

        return null;
    } catch (error) {
        // Re-throw or return null to let SWR handle the error state
        throw error; // Let SWR handle the error state
    }
};

export default function DynamicProductLoader({
    productId,
    style = 'simple',
    alignment = 'left',
    containerElement = 'div' // Default is div, can specify span
}: DynamicProductLoaderProps) {
    const { data: product, error, isLoading } = useSWR<ComponentProduct | null>(
        productId ? ['product', productId] : null,
        () => fetchProduct(productId),
        {
            revalidateOnFocus: false,
            shouldRetryOnError: false,
            dedupingInterval: 60000,
        }
    );

    const alignmentClasses = {
        left: 'text-left', // Or mr-auto if using flex/grid container
        center: 'mx-auto', // For block-level elements in a container
        right: 'text-right', // Or ml-auto if using flex/grid container
    };

    // Modify wrapper class to ensure cards show in a single row
    // Special handling for card style to ensure correct display
    const wrapperClassName = `${style === 'card' ? 'inline-block align-middle' : 'inline-block'} ${alignmentClasses[alignment]}`;

    // create function to render content
    const renderContent = () => {
        // Loading state
        if (isLoading) {
            return <ProductSkeletonPlaceholder style={style} />;
        }

        // Error state
        if (error || !product) {
            return (
                <span className="inline-flex items-center text-red-500 text-xs p-2 border border-red-200 rounded align-middle bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    Error loading product (ID: {productId})
                </span>
            );
        }

        // Render product component
        let productElement: React.ReactNode | null = null;

        switch (style) {
            case 'card': productElement = <CardProductElement product={product} />; break;
            case 'horizontal': productElement = <HorizontalProductElement product={product} />; break;
            case 'mini': productElement = <MiniProductElement product={product} />; break;
            case 'compact-grid': productElement = <CompactGridItemElement product={product} />; break;
            case 'featured': productElement = <FeaturedItemElement product={product} />; break;
            case 'simple': default: productElement = <SimpleProductElement product={product} />; break;
        }

        return productElement;
    };

    // For card style, use span container to ensure inline display
    return (style === 'card') ? (
        <span className={wrapperClassName}>
            {renderContent()}
        </span>
    ) : (
        containerElement === 'span' ? (
            <span className={wrapperClassName}>
                {renderContent()}
            </span>
        ) : (
            <div className={wrapperClassName}>
                {renderContent()}
            </div>
        )
    );
} 
