'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { StoreIdentifier } from '@/lib/store';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import type { ComponentProduct } from '@/types';

// Featured item styles
const FeaturedItemElement = ({ product }: { product: ComponentProduct }) => {
    const { id, title, price, image, url, cj_url, originalPrice, discount, brand, isPrime } = product;
    const effectiveUrl = cj_url || url || '';
    const productUrl = `/product/${id}`; // Use ID for internal link

    const displayOriginalPrice = (typeof originalPrice === 'number' && originalPrice > price) ? originalPrice : null;
    const savingsPercentage = displayOriginalPrice ? calculateDiscount(displayOriginalPrice, price) : (discount ?? 0);
    let savingsLabel = '';

    if (savingsPercentage > 0) {
        savingsLabel = `Save ${Math.round(savingsPercentage)}%`;
    }

    const formattedBrand = brand
        ? brand.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
        : null;

    return (
        // Use span as root element to avoid nesting issues
        <span className="inline-block align-middle w-full max-w-3xl relative my-4">
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row border border-gray-200 dark:border-gray-700"
                whileHover={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                transition={{ duration: 0.3 }}
            >
                {/* Image area - responsive */}
                <span className="relative w-full md:w-1/3 aspect-square md:aspect-[4/3] flex-shrink-0 bg-white inline-block">
                    {isPrime && (
                        <span className="absolute top-3 left-3 z-10">
                            <span className="bg-[#0574F7] text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm">
                                Prime
                            </span>
                        </span>
                    )}
                    <Link href={productUrl} className="block h-full w-full no-underline" target="_blank" rel="noopener noreferrer">
                        <Image
                            src={image || '/placeholder-product.jpg'}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
                        />
                    </Link>
                </span>

                {/* Info area */}
                <span className="p-4 md:p-6  flex-col flex-grow inline-block ">
                    {formattedBrand && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 mb-1 bg-blue-50  px-2 py-0.5 rounded inline-block">
                            {formattedBrand}
                        </span>
                    )}
                    {/* Replace h3 with span, keeping styles unchanged */}
                    <span className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2 flex-grow">
                        <Link href={productUrl} className="hover:text-primary-button dark:hover:text-primary transition-colors no-underline" target="_blank" rel="noopener noreferrer">
                            {title}
                        </Link>
                    </span>

                    {/* Price and discount */}
                    <span className="flex items-baseline mb-3">
                        <span className="text-2xl font-bold text-primary dark:text-primary-light mr-3">
                            {formatPrice(price)}
                        </span>
                        {displayOriginalPrice && (
                            <span className="text-base text-gray-500 dark:text-gray-400 line-through mr-3">
                                {formatPrice(displayOriginalPrice)}
                            </span>
                        )}
                        {savingsLabel && (
                            <span className="text-sm font-medium text-white bg-red-500 px-2 py-0.5 rounded">
                                {savingsLabel}
                            </span>
                        )}
                    </span>

                    {/* Source and button */}
                    <span className="flex flex-col sm:flex-row items-center sm:items-center sm:justify-between mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
                        <StoreIdentifier url={effectiveUrl} showName={true} className="mb-3 sm:mb-0" apiProvider={product.apiProvider} />
                        <Link href={productUrl} className="no-underline text-center sm:text-right w-full sm:w-auto" target="_blank" rel="noopener noreferrer">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="w-full sm:w-auto px-6 py-2 bg-primary-button hover:bg-primary-button-hover dark:bg-primary-dark dark:hover:bg-primary text-white rounded-full font-medium shadow-sm transition-colors whitespace-nowrap"
                            >
                                View Details
                            </motion.button>
                        </Link>
                    </span>
                </span>
            </motion.div>
        </span>
    );
};

export default FeaturedItemElement; 