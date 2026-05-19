'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { StoreIdentifier } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import type { ComponentProduct } from '@/types';

// Compact grid item styles
const CompactGridItemElement = ({ product }: { product: ComponentProduct }) => {
    const { id, title, price, image, url, cj_url } = product;
    const effectiveUrl = cj_url || url || '';
    const productUrl = `/product/${id}`; // Use ID for internal link

    return (
        // Use span as root element for Tiptap inline node compatibility
        <span className="inline-block align-middle w-full max-w-[200px] relative">
            <Link href={productUrl} className="no-underline group" target="_blank" rel="noopener noreferrer">
                <motion.span
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden h-full flex flex-col border border-transparent hover:border-primary-button dark:hover:border-primary transition-colors"
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Image area */}
                    <span className="relative w-full aspect-square bg-white block">
                        <Image
                            src={image || '/placeholder-product.jpg'}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 200px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
                        />
                    </span>

                    {/* Info area */}
                    <span className="p-2 flex flex-col flex-grow">
                        <span
                            className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2 mb-1 flex-grow min-h-[40px] group-hover:text-primary-button dark:group-hover:text-primary transition-colors"
                            title={title} // Tooltip for full title
                        >
                            {title}
                        </span>
                        <span className="flex items-center justify-between mt-auto">
                            <span className="text-base font-semibold text-primary dark:text-primary-light">
                                {formatPrice(price)}
                            </span>
                            <StoreIdentifier url={effectiveUrl} showName={false} className="mb-0 flex-shrink-0" apiProvider={product.apiProvider} />
                        </span>
                    </span>
                </motion.span>
            </Link>
        </span>
    );
};

export default CompactGridItemElement; 