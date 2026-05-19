'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback, Suspense } from 'react';

import FavoriteButton from '@/components/common/FavoriteButton';
import Pagination from '@/components/ui/Pagination';
import { productsApi } from '@/lib/api';
import { StoreIdentifier } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types/api';

// Define API parameter interface
interface GetDealsParams {
    active?: boolean;
    page?: number;
    page_size?: number;
    min_discount?: number;
    is_prime_only?: boolean;
}

// Define filter options interface
interface FilterOptions {
    minPrice?: number;
    maxPrice?: number;
    minDiscount?: number;
    isPrimeOnly?: boolean;
}

// Define pagination interface
interface PaginationState {
    page: number;
    page_size: number;
    total?: number;
}

// Predefined skeleton ID array
const SKELETON_IDS = [
    'sk1', 'sk2', 'sk3', 'sk4', 'sk5', 'sk6', 'sk7', 'sk8',
    'sk9', 'sk10', 'sk11', 'sk12', 'sk13', 'sk14', 'sk15', 'sk16',
    'sk17', 'sk18', 'sk19', 'sk20', 'sk21', 'sk22', 'sk23', 'sk24', 'sk25'
];

const DealsPage = () => {
    // State management
    const [deals, setDeals] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterOptions>({
        minDiscount: 50, // Default minimum discount 50%
    });
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        page_size: 25,
    });

    // Get discounted product data
    const fetchDeals = useCallback(async () => {
        try {
            setLoading(true);

            // Get product data
            const response = await productsApi.getDeals({
                active: true,
                page: pagination.page,
                page_size: pagination.page_size,
                min_discount: filters.minDiscount,
                is_prime_only: filters.isPrimeOnly,
            } as GetDealsParams);

            // Adapt response structure
            let itemsData: Product[] = [];

            if (response.data?.data) {
                const listData = response.data.data as unknown as {
                    items: Product[];
                    total: number;
                    page: number;
                    page_size: number;
                };

                if (listData.items && Array.isArray(listData.items)) {
                    // Randomly sort products on each page
                    itemsData = [...listData.items].sort(() => Math.random() - 0.5);
                }

                // Use pagination info returned by API
                setPagination(prev => ({
                    ...prev,
                    page: listData.page,
                    page_size: listData.page_size,
                    total: listData.total
                }));
            }

            setDeals(itemsData);
        } catch {
            setError("Failed to fetch deals, please try again later.");
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.page_size, filters.minDiscount, filters.isPrimeOnly]);

    // Listen for pagination and filter changes
    useEffect(() => {
        fetchDeals();
    }, [fetchDeals]);

    // Handle pagination change
    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    // Render product card
    const renderDealCard = (product: Product) => {
        // Get main offer info
        const mainOffer = product.offers && product.offers.length > 0 ? product.offers[0] : null;

        // If no offers data, use other available price data
        const currentPrice = mainOffer?.price || product.price || 0;
        const originalPrice = mainOffer && mainOffer.savings
            ? currentPrice + mainOffer.savings
            : product.original_price || currentPrice;

        // Calculate discount percentage
        const discountPercentage = mainOffer?.savings_percentage ||
            product.discount_rate ||
            (originalPrice > 0 ? Math.round((1 - currentPrice / originalPrice) * 100) : 0);

        const productId = product.asin || product.id;
        const productUrl = product.url || product.cj_url || '';
        const isPrime = mainOffer?.is_prime || false;

        if (!productId || currentPrice <= 0) {
            return null;
        }

        return (
            <motion.div
                key={productId}
                className="relative w-full"
                whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 10px 10px -5px rgba(0, 0, 0, 0.03)' }}
                transition={{ duration: 0.3 }}
            >
                {/* Favorite button */}
                <div
                    className="absolute top-5 right-5 sm:top-4 sm:right-4 md:top-3 md:right-3 z-20 m-0 p-0"
                    style={{ margin: 0, padding: 0 }}
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

                {/* Prime badge - moved to same level as Favorite button */}
                {isPrime && (
                    <div
                        className="absolute top-5 left-6 sm:top-4 sm:left-5 md:top-3 md:left-4 z-20 m-0 p-0"
                        style={{ margin: 0, padding: 0 }}
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-[#0574F7] text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center"
                        >
                            PRIME
                        </motion.div>
                    </div>
                )}

                <Link href={`/product/${productId}`} className="block">
                    <motion.div
                        className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden h-full flex flex-col max-w-[320px] mx-auto w-full"
                    >
                        {/* Product images */}
                        <div className="relative w-full aspect-[4/3] bg-white dark:bg-gray-800">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="h-full w-full relative p-2"
                            >
                                <Image
                                    src={product.main_image || product.image_url || "/placeholder.png"}
                                    alt={product.title}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                    className="object-contain"
                                    loading="lazy"
                                    unoptimized={product.main_image?.startsWith('data:')}
                                />
                            </motion.div>
                        </div>

                        {/* Product information */}
                        <div className="p-3 flex-grow flex flex-col">
                            {/* Brand info and StoreIdentifier */}
                            <div className="flex items-center justify-between mb-1.5">
                                {product.brand ? (
                                    <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded inline-block">
                                        {product.brand.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                    </span>
                                ) : (
                                    <div /> /* Placeholder empty element */
                                )}
                                <StoreIdentifier
                                    url={productUrl}
                                    align="right"
                                    apiProvider={product.api_provider}
                                />
                            </div>

                            {/* Product title */}
                            <h3 className="text-base font-medium line-clamp-2 mb-2 flex-grow text-primary-dark dark:text-white">
                                {product.title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                            </h3>

                            {/* Price and discount */}
                            <div className="flex items-center justify-between mt-1 mb-2">
                                <div className="flex items-baseline min-w-0 overflow-hidden mr-2">
                                    <span className="text-lg font-semibold text-primary dark:text-primary-light whitespace-nowrap">
                                        {formatPrice(currentPrice)}
                                    </span>
                                    {originalPrice > currentPrice && (
                                        <span className="text-xs text-secondary dark:text-gray-400 line-through whitespace-nowrap ml-1.5">
                                            {formatPrice(originalPrice)}
                                        </span>
                                    )}
                                </div>
                                {discountPercentage > 0 && (
                                    <span className={`text-xs font-bold text-white px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${discountPercentage > 30 ? 'bg-primary-badge' :
                                        discountPercentage > 10 ? 'bg-accent' :
                                            'bg-secondary'
                                        }`}>
                                        -{Math.round(discountPercentage)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* View details button */}
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
    };

    return (
        <div className="w-full max-w-[2000px] mx-auto px-6 py-8 relative">
            {/* Page top loading indicator */}
            {loading && (
                <div className="absolute top-0 left-0 w-full h-1">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
                </div>
            )}

            {/* Page title */}
            <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Limited Time Deals
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Discover amazing discounts on top products. Hurry before they&apos;re gone!
                </p>
            </div>

            {/* Filter area */}
            <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm mb-6 border border-gray-100">
                <div className="flex items-start gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[180px] max-w-[250px]">
                        <label htmlFor="discount-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Discount Filter
                        </label>
                        <div className="relative">
                            <select
                                id="discount-filter"
                                className="w-full h-8 pl-2.5 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-md focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none cursor-pointer hover:bg-gray-100"
                                value={filters.minDiscount}
                                onChange={(e) => {
                                    const newValue = Number(e.target.value);

                                    setFilters(prev => ({ ...prev, minDiscount: newValue }));
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                            >
                                <option value="50">50% Off or More</option>
                                <option value="60">60% Off or More</option>
                                <option value="70">70% Off or More</option>
                                <option value="80">80% Off or More</option>
                            </select>
                            <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="relative flex-1 min-w-[180px] max-w-[250px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prime Filter
                        </label>
                        <div className="flex items-center h-8 space-x-2.5 bg-gray-50 px-2.5 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors duration-200">
                            <input
                                id="prime-only"
                                type="checkbox"
                                className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary/30 transition-all duration-200"
                                checked={filters.isPrimeOnly || false}
                                onChange={(e) => {
                                    setFilters(prev => ({ ...prev, isPrimeOnly: e.target.checked }));
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                            />
                            <div className="flex flex-col justify-center">
                                <label htmlFor="prime-only" className="text-sm font-medium text-gray-700 cursor-pointer leading-none" />

                                <p className="text-[10px] text-gray-500 mt-0.5">Show only Amazon Prime products</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Error hint */}
            {error && (
                <div className="text-red-500 text-center mb-4">
                    {error}
                </div>
            )}

            {/* Product grid */}
            <Suspense fallback={<div>Loading deals...</div>}>
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {[...Array(pagination.page_size)].map((_, i) => (
                            <div key={SKELETON_IDS[i]} className="relative group h-full">
                                <div className="relative h-full flex flex-col overflow-hidden rounded-lg shadow-md bg-white animate-pulse">
                                    {/* Image skeleton */}
                                    <div className="relative w-full pt-[100%] bg-gray-200" />

                                    {/* Content area skeleton */}
                                    <div className="p-3 sm:p-4 flex-grow flex flex-col">
                                        {/* Brand and offer info */}
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="h-4 bg-gray-200 rounded w-1/4" />
                                            <div className="h-4 bg-gray-200 rounded w-1/5" />
                                        </div>

                                        {/* Title */}
                                        <div className="h-5 bg-gray-200 rounded w-full mb-2" />
                                        <div className="h-5 bg-gray-200 rounded w-4/5 mb-4" />

                                        {/* Price area */}
                                        <div className="mt-auto flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <div className="h-6 bg-gray-200 rounded w-16" />
                                                <div className="h-4 bg-gray-200 rounded w-10" />
                                            </div>
                                            <div className="h-5 bg-gray-200 rounded w-20" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {deals && deals.length > 0 ? (
                            deals.map(renderDealCard)
                        ) : (
                            <div className="col-span-full text-center text-gray-500">
                                No deals available at the moment
                            </div>
                        )}
                    </div>
                )}
            </Suspense>

            {/* Pagination control - modify condition */}
            {!loading && deals.length > 0 && pagination.total && (
                <Pagination
                    currentPage={pagination.page}
                    totalPages={Math.ceil((pagination.total || 0) / pagination.page_size)}
                    onPageChange={handlePageChange}
                    className="mt-8"
                />
            )}
        </div>
    );
};

export default DealsPage; 