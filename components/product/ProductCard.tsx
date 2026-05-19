"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { formatPrice, calculateDiscount } from '@/lib/utils';

interface ProductCardProps {
    product: {
        id: string;
        title: string;
        image_url: string;
        current_price: number;
        original_price: number;
        discount_rate?: number;
        prime_eligible?: boolean;
        product_url?: string;
    };
    showActions?: boolean;
    isNew?: boolean;
}

export default function ProductCard({ product, showActions = false, isNew = false }: ProductCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const discount = product.discount_rate || calculateDiscount(product.original_price, product.current_price);

    return (
        <motion.div
            whileHover={{ y: -8 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="group relative bg-background rounded-lg sm:rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300"
        >
            <Link href={`/product/${product.id}`} className="block">
                {/* New badge */}
                {isNew && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10"
                    >
                        <div className="bg-green-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">
                            New
                        </div>
                    </motion.div>
                )}

                {/* Discount badge */}
                {discount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10"
                    >
                        <div className="bg-accent text-text font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">
                            -{Math.round(discount)}%
                        </div>
                    </motion.div>
                )}

                {/* Prime label */}
                {product.prime_eligible && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute ${isNew ? 'top-10 sm:top-16' : 'top-2 sm:top-4'} left-2 sm:left-4 z-10`}
                    >
                        <div className="bg-[#0574F7] text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm">
                            PRIME
                        </div>
                    </motion.div>
                )}

                {/* Product images */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <motion.div
                        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                    >
                        <Image
                            src={product.image_url}
                            alt={product.title}
                            fill
                            className="object-contain"
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            priority
                        />
                    </motion.div>
                </div>

                {/* Product information */}
                <div className="p-3 sm:p-4">
                    <h3 className="text-sm sm:text-lg font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {product.title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                    </h3>

                    <div className="flex items-baseline gap-2 mt-1 sm:mt-2">
                        <span className="text-base sm:text-xl font-bold text-primary">
                            {formatPrice(product.current_price)}
                        </span>
                        {product.original_price > product.current_price && (
                            <span className="text-xs sm:text-sm text-text-light line-through">
                                {formatPrice(product.original_price)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Hover effect */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    className="absolute inset-0 bg-gradient-primary opacity-10 pointer-events-none"
                />
            </Link>

            {/* Quick action buttons */}
            {showActions && (
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-linear-to-t from-background to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-center space-x-2">
                        <motion.a
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            href={product.product_url || `https://amazon.com/dp/${product.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-primary text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            View Details
                        </motion.a>
                    </div>
                </div>
            )}
        </motion.div>
    );
} 