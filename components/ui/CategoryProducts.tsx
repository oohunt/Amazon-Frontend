"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

import FavoriteButton from '@/components/common/FavoriteButton';
import { ProductSwiper } from '@/components/mobile/ProductSwiper';
import { StoreIdentifier } from '@/lib/store';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import type { Product } from '@/types/api';

interface CategoryProductsProps {
    title: string;          // Category title
    slug: string;           // Category slug, used to build See All link
    page_size?: number;     // Limit on number of products to show
    className?: string;     // Custom CSS class
    id?: string;            // HTML ID for anchor links
}

export function CategoryProducts({ title, slug, page_size = 4, className = '', id }: CategoryProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Dynamically set product count based on screen width, using page_size as initial value
    const [dynamicLimit, setDynamicLimit] = useState(page_size);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;

            if (width >= 1280) { // xl
                setDynamicLimit(4); // Show 4 products on desktop
                setIsMobile(false);
            } else if (width >= 768) { // md
                setDynamicLimit(3);
                setIsMobile(false);
            } else { // Use carousel on sm and below, showing 9 products
                setDynamicLimit(9);
                setIsMobile(true);
            }
        };

        // Initialize
        handleResize();

        // Listen for window size changes
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Use dynamic limit to fetch product data
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                // Use page_size parameter instead of limit
                const response = await fetch(`/api/products/list?product_groups=${encodeURIComponent(slug)}&page_size=${dynamicLimit}`, { cache: 'no-store' });

                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }

                const result = await response.json();

                if (result.success && Array.isArray(result.data.items)) {
                    setProducts(result.data.items);
                } else {
                    setProducts([]);
                    if (result.error) {
                        setError(result.error);
                    } else {
                        setError(`No ${title} products available at the moment`);
                    }
                }
            } catch {
                setError(`Unable to load ${title} products. Please try again later.`);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [dynamicLimit, slug, title]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    // Function to render individual product card
    const renderProductCard = (product: Product, index: number) => {
        try {
            // Get main offer information
            const mainOffer = product.offers && product.offers.length > 0 ? product.offers[0] : null;

            // Get price and discount information with enhanced error handling
            const price = mainOffer?.price || product.price || 0;
            const savingsPercentage = mainOffer?.savings_percentage ||
                product.discount_rate ||
                (product.original_price && price ? calculateDiscount(product.original_price, price) : 0);

            const originalPrice = mainOffer && mainOffer.savings
                ? price + mainOffer.savings
                : product.original_price || price;

            // Get coupon information
            const _hasCoupon = mainOffer && mainOffer.coupon_type && mainOffer.coupon_value;
            const _couponType = mainOffer?.coupon_type;
            const _couponTypecouponValue = mainOffer?.coupon_value;

            const productId = product.asin || product.id || `product-${index}`;
            const productImage = product.main_image || product.image_url || '';
            const isPrime = mainOffer?.is_prime || false;
            const title = product.title || 'Product title not available';

            // Get product linkURL
            const productUrl = product.url || product.cj_url || '';

            return (
                <motion.div
                    key={productId}
                    variants={isMobile ? undefined : itemVariants}
                    custom={index}
                    className="relative w-full"
                >
                    {/* Favorite button — added outside the product card to receive independent click events */}
                    <div
                        className="absolute top-3 right-3 z-20"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        role="button"
                        tabIndex={0}
                    >
                        <FavoriteButton
                            productId={productId}
                            size="md"
                            withAnimation={true}
                            className="bg-white/80 dark:bg-gray-800/80 shadow-sm hover:bg-white dark:hover:bg-gray-800"
                        />
                    </div>

                    <Link href={`/product/${productId}`} className="block">
                        <motion.div
                            className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden h-full flex flex-col w-full max-w-[280px] sm:max-w-[320px] mx-auto"
                            transition={{ duration: 0.3 }}
                        >
                            {/* Prime badge */}
                            {isPrime && (
                                <div className="absolute top-3 left-3 z-10">
                                    <div className="bg-[#0574F7] text-white px-3 py-1 rounded-full text-sm font-medium">
                                        Prime
                                    </div>
                                </div>
                            )}

                            {/* Product image */}
                            <div className="relative w-full aspect-square bg-white dark:bg-gray-800">
                                <div className="h-full w-full relative">
                                    {productImage ? (
                                        <Image
                                            src={productImage}
                                            alt={title}
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                            className="object-cover w-full h-full p-2"
                                            priority={index < 2}
                                            loading={index < 2 ? "eager" : "lazy"}
                                            unoptimized={productImage.startsWith('data:')}
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-400 bg-white dark:bg-gray-800">
                                            No image available
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Product information */}
                            <div className="p-2 sm:p-3 flex-grow flex flex-col">
                                {/* Brand info and StoreIdentifier on same line */}
                                <div className="flex items-center justify-between mb-1.5">
                                    {product.brand ? (
                                        <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded inline-block">
                                            {product.brand.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                        </span>
                                    ) : (
                                        <div /> /* Placeholder empty element to ensure right alignment */
                                    )}
                                    <StoreIdentifier
                                        url={productUrl}
                                        align="right"
                                    />
                                </div>

                                <h3 className="text-sm sm:text-base font-medium line-clamp-2 mb-1 flex-grow text-primary-dark dark:text-white">
                                    {title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                </h3>

                                {/* Price and discount */}
                                <div className="flex items-center justify-between mt-0.5 mb-1.5 flex-wrap gap-1">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-base sm:text-lg font-semibold text-primary dark:text-primary-light">
                                            {formatPrice(price)}
                                        </span>
                                        {originalPrice > price && (
                                            <span className="text-xs text-secondary dark:text-gray-400 line-through">
                                                {formatPrice(originalPrice)}
                                            </span>
                                        )}
                                    </div>
                                    {savingsPercentage > 0 && (
                                        <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded bg-primary-badge">
                                            -{Math.round(savingsPercentage)}%
                                        </span>
                                    )}
                                </div>

                                {/* Action button */}
                                <button className="w-full py-1.5 bg-primary-button hover:bg-primary-button-hover dark:bg-primary-button-light dark:hover:bg-primary-button text-white text-center rounded-full text-sm font-medium transition-colors">
                                    View Details
                                </button>
                            </div>
                        </motion.div>
                    </Link>
                </motion.div>
            );
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Error rendering product at index ${index}:`, error);

            return null; // Skip rendering this product if there's an error
        }
    };

    if (loading) {
        return (
            <div id={id} className={`bg-gray-100 dark:bg-gray-800 rounded-xl p-4 sm:p-6 ${className}`}>
                <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: isMobile ? 1 : dynamicLimit }).map(() => {
                        const uniqueId = `placeholder-${Math.random().toString(36).substring(2, 9)}`;

                        return <div key={uniqueId} className="h-[360px] bg-gray-300 dark:bg-gray-700 rounded-lg" />;
                    })}
                </div>
            </div>
        );
    }

    if (error || products.length === 0) {
        return (
            <div id={id} className={`bg-gray-100 dark:bg-gray-800 rounded-xl p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-primary-dark dark:text-white">{title}</h2>

                    <Link
                        href={`/product/category/${encodeURIComponent(slug)}`}
                        className="flex items-center text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 font-medium transition-colors"
                    >
                        <span>See All</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 ml-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                        </svg>
                    </Link>
                </div>
                <div className="flex justify-center items-center h-64">
                    <p className="text-secondary dark:text-gray-400">{error || `No ${title} products available at the moment`}</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            id={id}
            className={className}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Title area: title left-aligned, 'See All' link on the right */}
            <div className="flex items-center justify-between mb-3">
                <motion.h2
                    className="text-lg sm:text-xl font-bold text-primary-dark dark:text-white"
                    variants={itemVariants}
                >
                    {title}
                </motion.h2>

                <motion.div variants={itemVariants}>
                    <Link
                        href={`/product/category/${encodeURIComponent(slug)}`}
                        className="flex items-center text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 font-medium transition-colors text-sm"
                    >
                        <span>See All</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 ml-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                        </svg>
                    </Link>
                </motion.div>
            </div>

            {/* Use Swiper carousel on mobile */}
            {isMobile ? (
                <div className="-mx-2 sm:-mx-3">
                    <ProductSwiper products={products} />
                </div>
            ) : (
                // Modify grid layout column count
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {products.map((product, index) => renderProductCard(product, index)).filter(Boolean)}
                </div>
            )}
        </motion.div>
    );
} 