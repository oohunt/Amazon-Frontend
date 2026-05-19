'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { StoreIdentifier } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import type { ComponentProduct } from '@/types';

// Mini style product component
const MiniProductElement = ({ product }: { product: ComponentProduct }) => {
    const { id, title, price, image, url, cj_url } = product;
    const effectiveUrl = cj_url || url || '';
    const productUrl = `/product/${id}`;

    return (
        <Link href={productUrl} className="inline-block no-underline max-w-full align-middle" target="_blank" rel="noopener noreferrer">
            <motion.span
                className="inline-flex items-center my-2 p-2 border rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm max-w-full w-64 overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
            >
                <span className="relative w-10 h-10 mr-2 rounded overflow-hidden flex-shrink-0">
                    <Image
                        src={image || '/placeholder-product.jpg'}
                        alt={title}
                        fill
                        sizes="40px"
                        className="object-cover"
                        onError={(e) => { e.currentTarget.src = '/placeholder-product.jpg'; }}
                    />
                </span>
                <span className="flex-grow min-w-0 max-w-[calc(100%-60px)]">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate" title={title}>{title}</span>
                    <span className="text-xs text-primary dark:text-primary-light">{formatPrice(price)}</span>
                </span>
                <StoreIdentifier url={effectiveUrl} showName={false} className="mb-0 ml-2 flex-shrink-0" apiProvider={product.apiProvider} />
            </motion.span>
        </Link>
    );
};

export default MiniProductElement; 