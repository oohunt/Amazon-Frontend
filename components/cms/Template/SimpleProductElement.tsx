'use client';

import Image from 'next/image';
import Link from 'next/link';

import { StoreIdentifier } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import type { ComponentProduct } from '@/types';

// Basic product component — simple row layout
const SimpleProductElement = ({ product }: { product: ComponentProduct }) => {
    const { id, title, price, image, url, cj_url, asin } = product;
    const effectiveUrl = cj_url || url || '';
    const productUrl = `/product/${id}`; // Use ID for internal link

    return (
        <span className="inline-flex items-center my-4 p-3 border rounded-md bg-white shadow-sm gap-3 max-w-lg align-middle">
            <span className="flex items-center flex-grow min-w-0 gap-3">
                {image && (
                    <Link href={productUrl} className="relative w-16 h-16 border rounded-md overflow-hidden flex-shrink-0" target="_blank" rel="noopener noreferrer">
                        <Image
                            src={image}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 10vw, 64px"
                            className="object-cover"
                            onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
                        />
                    </Link>
                )}
                <span className="min-w-0">
                    <Link href={productUrl} className="font-medium text-gray-900 truncate hover:text-primary transition-colors no-underline block" target="_blank" rel="noopener noreferrer">
                        {title}
                    </Link>
                    <span className="flex gap-2 text-sm text-gray-500 mt-1">
                        <span>{formatPrice(price)}</span>
                        {/* Only display ASIN if it exists and has a value */}
                        {asin && <span>ASIN: {asin}</span>}
                    </span>
                </span>
            </span>
            <StoreIdentifier url={effectiveUrl} align="right" showName={false} className="mb-0 flex-shrink-0" apiProvider={product.apiProvider} />
            {/* Optionally keep the 'Product' tag if needed for CMS context */}
            {/* <div className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full ml-2">Product</div> */}
        </span>
    );
};

export default SimpleProductElement; 