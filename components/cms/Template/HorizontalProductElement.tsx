'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { StoreIdentifier } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import type { ComponentProduct } from '@/types';

// Horizontal list style product component
const HorizontalProductElement = ({ product }: { product: ComponentProduct }) => {
    const { id, title, price, image, url, cj_url } = product;
    const effectiveUrl = cj_url || url || '';
    const productUrl = `/product/${id}`;

    return (
        <motion.span
            className="inline-flex items-center my-4 p-4 border rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow max-w-xl align-middle"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
        >
            <span className="flex flex-col sm:flex-row w-full">
                {/* Image container - resize and fix aspect ratio */}
                <span className="flex-shrink-0 flex justify-center sm:justify-start mb-3 sm:mb-0">
                    <Link href={productUrl} className="relative w-28 h-28 sm:w-24 sm:h-24 sm:mr-4 rounded-lg overflow-hidden no-underline" target="_blank" rel="noopener noreferrer">
                        <Image
                            src={image || '/placeholder-product.jpg'}
                            alt={title}
                            fill
                            sizes="(max-width: 640px) 112px, 96px"
                            className="object-cover"
                            onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
                        />
                    </Link>
                </span>

                {/* Content container - show title in all layouts */}
                <span className="flex flex-col flex-grow">
                    {/* Title — shown in all layouts with different styles for mobile and desktop */}
                    <span className="text-sm sm:text-base font-medium line-clamp-2 sm:line-clamp-1 mb-2">
                        <Link href={productUrl} className="text-black dark:text-white no-underline" target="_blank" rel="noopener noreferrer">
                            {title}
                        </Link>
                    </span>

                    {/* Price and action area - vertical on mobile, horizontal on desktop */}
                    <span className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mt-auto">
                        <span className="text-primary-button dark:text-primary-light font-bold text-xl">{formatPrice(price)}</span>

                        <span className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 mt-2 sm:mt-0">
                            <StoreIdentifier url={effectiveUrl} align="left" showName={false} className="mb-0" apiProvider={product.apiProvider} />
                            <Link href={productUrl} className="no-underline" target="_blank" rel="noopener noreferrer">
                                <button className="px-3 py-1.5 sm:px-4 bg-primary-button hover:bg-primary-button-hover dark:bg-primary-dark dark:hover:bg-primary text-white rounded-full text-sm transition-colors whitespace-nowrap">
                                    View Details
                                </button>
                            </Link>
                        </span>
                    </span>
                </span>
            </span>
        </motion.span>
    );
};

export default HorizontalProductElement; 