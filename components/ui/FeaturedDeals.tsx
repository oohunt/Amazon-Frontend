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

type FeaturedDealsProps = {
    pageSize?: number;
    className?: string;
    hideTitle?: boolean;
    productGroups?: string;
    useListApi?: boolean;
};

// Utility function: Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
};

export function FeaturedDeals({
    pageSize = 4,
    className = '',
    hideTitle = false,
    productGroups,
    useListApi = false
}: FeaturedDealsProps) {
    const [deals, setDeals] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    // Adda static variable to store displayed product IDs to avoid duplicates
    const [shownProductIds] = useState(new Set<string>());

    // Dynamically set product count based on screen width
    const [dynamicPageSize, setDynamicPageSize] = useState(pageSize);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            const defaultPageSize = pageSize || 4; // Use passed pageSize or default value 4

            if (width >= 1280) { // xl
                setDynamicPageSize(defaultPageSize); // Use passed pageSize or default
                setIsMobile(false);
            } else if (width >= 768) { // md
                setDynamicPageSize(3); // Fixed 3 products on tablet
                setIsMobile(false);
            } else { // Use carousel on sm and below
                setDynamicPageSize(Math.min(defaultPageSize, 9)); // Show at most 9 on mobile
                setIsMobile(true);
            }
        };

        // Initialize
        handleResize();

        // Listen for window size changes
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [pageSize]); // Add pageSize to dependency array

    // Use dynamic pageSize to fetch product data
    useEffect(() => {
        const fetchDeals = async () => {
            try {
                setLoading(true);

                if (useListApi) {
                    // Step 1: Use new count API to get total product count
                    const countParams = new URLSearchParams();

                    if (productGroups) {
                        countParams.append('product_groups', productGroups);
                    }

                    const countResponse = await fetch(`/api/products/count?${countParams.toString()}`);

                    if (!countResponse.ok) {
                        throw new Error(`API error: ${countResponse.status}`);
                    }

                    const countResult = await countResponse.json();

                    if (!countResult.success) {
                        throw new Error('Failed to get total count');
                    }

                    const total = countResult.data.total;
                    const pageSize = 20; // Use moderate page size
                    const maxPage = Math.ceil(total / pageSize);

                    // Generate random page number between 1 and maxPage
                    const randomPage = Math.max(1, Math.floor(Math.random() * maxPage));

                    // Step 2: Use random page number to fetch products
                    const params = new URLSearchParams({
                        page: randomPage.toString(),
                        page_size: dynamicPageSize.toString()
                    });

                    if (productGroups) {
                        params.append('product_groups', productGroups);
                    }

                    const response = await fetch(`/api/products/list?${params.toString()}`);

                    if (!response.ok) {
                        throw new Error(`API error: ${response.status}`);
                    }

                    const result = await response.json();

                    if (result.success) {
                        let products = result.data.items;

                        if (Array.isArray(products) && products.length > 0) {
                            // Randomly shuffle product array
                            products = shuffleArray(products);

                            // Implement deduplication logic
                            if (!hideTitle) { // Today's Best Deals
                                // Store current product ID in static set
                                products.forEach((product: Product) => {
                                    const productId = product.asin || product.id || '';

                                    if (productId) shownProductIds.add(productId);
                                });
                            } else { // Similar Products
                                // Filter out already-shown products
                                products = products.filter((product: Product) => {
                                    const productId = product.asin || product.id || '';

                                    return productId && !shownProductIds.has(productId);
                                });

                                // If no products after filtering, use fallback logic
                                if (products.length === 0 && productGroups) {
                                    // Fall through to fallback logic
                                } else {
                                    // Take only the required count
                                    products = products.slice(0, dynamicPageSize);
                                    setDeals(products);

                                    return; // Return early, skip fallback logic
                                }
                            }

                            // Take only the required count
                            products = products.slice(0, dynamicPageSize);
                            setDeals(products);
                        } else if (productGroups) {
                            // Fallback: when specified category has no data, remove category restriction and re-request

                            // Re-fetch total count without specifying category
                            const fallbackCountResponse = await fetch('/api/products/count');

                            if (fallbackCountResponse.ok) {
                                const fallbackCountResult = await fallbackCountResponse.json();

                                if (fallbackCountResult.success) {
                                    const fallbackTotal = fallbackCountResult.data.total;
                                    const fallbackMaxPage = Math.ceil(fallbackTotal / pageSize);
                                    const fallbackRandomPage = Math.max(1, Math.floor(Math.random() * fallbackMaxPage));

                                    // Request parameters without category
                                    const fallbackParams = new URLSearchParams({
                                        page: fallbackRandomPage.toString(),
                                        page_size: dynamicPageSize.toString()
                                    });

                                    // Get fallback product data
                                    const fallbackResponse = await fetch(`/api/products/list?${fallbackParams.toString()}`);

                                    if (fallbackResponse.ok) {
                                        const fallbackResult = await fallbackResponse.json();

                                        if (fallbackResult.success && fallbackResult.data.items.length > 0) {
                                            let fallbackProducts = shuffleArray(fallbackResult.data.items) as Product[];

                                            // Filter out products already shown in Today's Best Deals
                                            if (!hideTitle) { // hideTitle=false indicates Today's Best Deals
                                                // Store current product ID in static set
                                                fallbackProducts.forEach((product: Product) => {
                                                    const productId = product.asin || product.id || '';

                                                    if (productId) shownProductIds.add(productId);
                                                });
                                            } else { // hideTitle=true indicates Similar Products
                                                // Filter out already-shown products
                                                fallbackProducts = fallbackProducts.filter((product: Product) => {
                                                    const productId = product.asin || product.id || '';

                                                    return productId && !shownProductIds.has(productId);
                                                });
                                            }

                                            // Fixed fallback data showing 4 products regardless of parent's pageSize
                                            setDeals(fallbackProducts.slice(0, 4));
                                        } else {
                                            setDeals([]);
                                            setError('No product data found');
                                        }
                                    } else {
                                        setDeals([]);
                                        setError('Failed to get fallback product data');
                                    }
                                } else {
                                    setDeals([]);
                                    setError('Failed to get fallback product count');
                                }
                            } else {
                                setDeals([]);
                                setError('Fallback request failed');
                            }
                        } else {
                            setDeals([]);
                            setError(result.error || 'No products currently available');
                        }
                    } else {
                        setDeals([]);
                        setError(result.error || 'No deals available at the moment');
                    }
                } else {
                    // Original featured API logic
                    const params = new URLSearchParams({
                        page_size: dynamicPageSize.toString()
                    });

                    if (productGroups) {
                        params.append('product_groups', productGroups);
                    }

                    const response = await fetch(`/api/products/featured?${params.toString()}`);

                    if (!response.ok) {
                        throw new Error(`API error: ${response.status}`);
                    }

                    const result = await response.json();

                    if (result.success) {
                        setDeals(Array.isArray(result.data) ? result.data : []);
                    } else {
                        setDeals([]);
                        setError(result.error || 'No deals available at the moment');
                    }
                }
            } catch {
                setError('Unable to load deals. Please try again later.');
                setDeals([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDeals();
    }, [dynamicPageSize, productGroups, useListApi, hideTitle, shownProductIds]);

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
    const renderProductCard = (deal: Product, index: number) => {
        try {
            // Get main offer information
            const mainOffer = deal.offers && deal.offers.length > 0 ? deal.offers[0] : null;

            // Get price and discount information with enhanced error handling
            const price = mainOffer?.price || deal.price || 0;
            const savingsPercentage = mainOffer?.savings_percentage ||
                deal.discount_rate ||
                (deal.original_price && price ? calculateDiscount(deal.original_price, price) : 0);

            const originalPrice = mainOffer && mainOffer.savings
                ? price + mainOffer.savings
                : deal.original_price || price;

            // Get coupon information
            const _hasCoupon = mainOffer && mainOffer.coupon_type && mainOffer.coupon_value;
            const _couponType = mainOffer?.coupon_type;
            const _couponTypecouponValue = mainOffer?.coupon_value;

            const productId = deal.asin || deal.id || `product-${index}`;
            const productImage = deal.main_image || deal.image_url || '';
            const isPrime = mainOffer?.is_prime || false;
            const title = deal.title || 'Product title not available';

            // Get product linkURL
            const productUrl = deal.url || deal.cj_url || '';

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
                            className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden h-full flex flex-col w-full max-w-[280px] sm:max-w-[320px] mx-auto"
                            whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 10px 10px -5px rgba(0, 0, 0, 0.03)' }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Prime badge */}
                            {isPrime && (
                                <div className="absolute top-3 left-3 z-10">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="bg-[#0574F7] text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center"
                                    >
                                        PRIME
                                    </motion.div>
                                </div>
                            )}
                            {/* Coupon label - displayed in top right 
                               <div className="absolute top-3 right-12 z-10">
                                {hasCoupon && (
                                    <motion.div
                                        initial={{ scale: 0.9 }}
                                        animate={{ scale: 1.05 }}
                                        transition={{ duration: 0.7, repeat: Infinity, repeatType: 'reverse' }}
                                        className="bg-warning text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm"
                                    >
                                        {couponType === 'percentage' ? `${couponValue}% off` : `$${couponValue} coupon`}
                                    </motion.div>
                                )}
                            </div>
                            */}

                            {/* Product image */}
                            <div className="relative w-full aspect-[1/1] bg-white dark:bg-gray-800 pt-0.5">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="h-full w-full relative"
                                >
                                    {productImage ? (
                                        <Image
                                            src={productImage}
                                            alt={title}
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                            className="object-cover p-2"
                                            priority={index < 2}
                                            loading={index < 2 ? "eager" : "lazy"}
                                            unoptimized={productImage.startsWith('data:')}
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-400 bg-white dark:bg-gray-800">
                                            No image available
                                        </div>
                                    )}
                                </motion.div>
                            </div>

                            {/* Product information */}
                            <div className="p-3 flex-grow flex flex-col">
                                {/* Brand info and StoreIdentifier on same line */}
                                <div className="flex items-center justify-between mb-1.5">
                                    {deal.brand ? (
                                        <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded inline-block">
                                            {deal.brand.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                        </span>
                                    ) : (
                                        <div /> /* Placeholder empty element to ensure right alignment */
                                    )}
                                    <StoreIdentifier
                                        url={productUrl}
                                        align="right"
                                        apiProvider={deal.api_provider}
                                    />
                                </div>

                                <h3 className="text-base font-medium line-clamp-2 mb-2 flex-grow text-primary-dark dark:text-white">
                                    {title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                </h3>

                                {/* Price and discount */}
                                <div className="flex items-center justify-between mt-1 mb-2">
                                    <div className="flex items-baseline min-w-0 overflow-hidden mr-2">
                                        <span className="text-lg font-semibold text-primary dark:text-primary-light whitespace-nowrap">
                                            {formatPrice(price)}
                                        </span>
                                        {originalPrice > price && (
                                            <span className="text-xs text-secondary dark:text-gray-400 line-through whitespace-nowrap ml-1.5">
                                                {formatPrice(originalPrice)}
                                            </span>
                                        )}
                                    </div>
                                    {savingsPercentage > 0 && (
                                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 bg-primary-badge">
                                            -{Math.round(savingsPercentage)}%
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action button */}
                            <div className="px-3 pb-3">
                                <motion.div
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full py-2 bg-primary-button hover:bg-primary-button-hover dark:bg-primary-button-light dark:hover:bg-primary-button text-white text-center rounded-full font-medium shadow-sm transition-colors"
                                >
                                    View Details
                                </motion.div>
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
            <div className={`bg-gray-100 dark:bg-gray-800 rounded-xl p-4 sm:p-6 ${className}`}>
                <div className="h-8 w-48 bg-gray-300 dark:bg-gray-700 rounded mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: isMobile ? 1 : dynamicPageSize }).map(() => {
                        const uniqueId = `placeholder-${Math.random().toString(36).substring(2, 9)}`;

                        return <div key={uniqueId} className="h-[360px] bg-gray-300 dark:bg-gray-700 rounded-lg" />;
                    })}
                </div>
            </div>
        );
    }

    if (error || deals.length === 0) {
        return (
            <div className={`bg-gray-100 dark:bg-gray-800 rounded-xl p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-primary-dark dark:text-white">Today&apos;s Best Deals</h2>
                </div>
                <div className="flex justify-center items-center h-64">
                    <p className="text-secondary dark:text-gray-400">{error || 'No deals available at the moment'}</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            className={className}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Title area: title left-aligned, 'See All' link on the right */}
            {!hideTitle && (
                <div className="flex items-center justify-between mb-3">
                    <motion.h2
                        className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white"
                        variants={itemVariants}
                    >
                        Today&apos;s Best Deals
                    </motion.h2>

                    <motion.div variants={itemVariants}>
                        <Link
                            href="/product"
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
            )}

            {/* Use Swiper carousel on mobile */}
            {isMobile ? (
                <div className="-mx-2 sm:-mx-3">
                    <ProductSwiper products={deals} />
                </div>
            ) : (
                // Use grid layout on large screens
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {deals.slice(0, dynamicPageSize).map((deal, index) => renderProductCard(deal, index)).filter(Boolean)}
                </div>
            )}
        </motion.div>
    );
}