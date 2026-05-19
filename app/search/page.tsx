"use client";

import { motion } from 'framer-motion';
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

import FavoriteButton from '@/components/common/FavoriteButton';
import { useProductSearch } from "@/lib/hooks";
import { StoreIdentifier } from "@/lib/store";
import { adaptProducts, formatPrice } from "@/lib/utils";

// Loading fallback component
function SearchSkeleton() {
    // Pre-generate unique IDs for skeleton items
    const skeletonIds = Array.from({ length: 8 }, () =>
        Math.random().toString(36).substring(2, 15)
    );

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse mb-2" />
                <div className="h-5 w-40 bg-gray-200 rounded-md animate-pulse" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {skeletonIds.map((id) => (
                    <div key={`skeleton-${id}`} className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <div className="bg-gray-200 aspect-square w-full animate-pulse" />
                        <div className="p-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function SearchPageContent() {
    const searchParams = useSearchParams();
    const searchKeyword = searchParams.get("keyword") || "";

    // Search states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, _setPageSize] = useState(20);
    const [sortBy, setSortBy] = useState<"relevance" | "price" | "discount" | "created">("relevance");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [minPrice, _setMinPrice] = useState<number | undefined>(undefined);
    const [maxPrice, _setMaxPrice] = useState<number | undefined>(undefined);
    const [minDiscount, _setMinDiscount] = useState<number | undefined>(undefined);
    const [isPrimeOnly, _setIsPrimeOnly] = useState(false);
    const [productGroups, _setProductGroups] = useState<string | undefined>(undefined);
    const [brands, _setBrands] = useState<string | undefined>(undefined);

    // Reset page when search parameters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchKeyword, sortBy, sortOrder, minPrice, maxPrice, minDiscount, isPrimeOnly, productGroups, brands]);

    // Use hook to get search results
    const { data: searchResults, isLoading, isError } = useProductSearch({
        keyword: searchKeyword,
        page: currentPage,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
        min_price: minPrice,
        max_price: maxPrice,
        min_discount: minDiscount,
        is_prime_only: isPrimeOnly,
        product_groups: productGroups,
        brands: brands,
    });

    // Adapt product data
    const adaptedProducts = searchResults?.items ? adaptProducts(searchResults.items) : [];

    // Total pages
    const totalPages = searchResults ? Math.ceil(searchResults.total / searchResults.page_size) : 0;

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Handle sort change
    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(e.target.value as "relevance" | "price" | "discount" | "created");
    };

    // Handle sort order change
    const handleOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortOrder(e.target.value as "asc" | "desc");
    };

    // Handle product click
    const handleProductClick = (productId: string) => {
        window.open(`/product/${productId}`, '_blank');
    };

    // Add a keydown handler function
    const handleKeyDown = (e: React.KeyboardEvent, productId: string) => {
        // If Enter or Space key is pressed
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleProductClick(productId);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Search title and result count */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">
                    Search Results: {searchKeyword}
                </h1>
                {!isLoading && searchResults && (
                    <p className="text-gray-600">
                        Found {searchResults.total} matching products
                    </p>
                )}
            </div>

            {/* Filter and sort toolbar */}
            <div className="mb-6 flex flex-wrap gap-4 items-center">
                <div className="flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                    <select
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary cursor-pointer"
                        value={sortBy}
                        onChange={handleSortChange}
                    >
                        <option value="relevance">Relevance</option>
                        <option value="price">Price</option>
                        <option value="discount">Discount</option>
                        <option value="created">Newest</option>
                    </select>
                </div>

                <div className="flex-shrink-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <select
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary cursor-pointer"
                        value={sortOrder}
                        onChange={handleOrderChange}
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>

                {/* More filters can be added here */}
            </div>

            {/* Product grid */}
            {isLoading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
                </div>
            ) : isError ? (
                <div className="text-center py-12">
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Search Error</h3>
                    <p className="text-gray-500">Try using different search terms or refresh the page</p>
                </div>
            ) : adaptedProducts.length === 0 ? (
                <div className="text-center py-12">
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Products Found</h3>
                    <p className="text-gray-500">Try using different search terms or filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {adaptedProducts.map((product) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="relative group h-full"
                        >
                            {/* Favorite button */}
                            <div
                                className="absolute top-3 right-3 z-20 cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                                role="button"
                                tabIndex={0}
                            >
                                <FavoriteButton
                                    productId={product.id}
                                    size="md"
                                    withAnimation={true}
                                    className="bg-white/80 dark:bg-gray-800/80 shadow-sm hover:bg-white dark:hover:bg-gray-800"
                                />
                            </div>

                            <div
                                className="block cursor-pointer"
                                onClick={() => handleProductClick(product.id)}
                                onKeyDown={(e) => handleKeyDown(e, product.id)}
                                tabIndex={0}
                                role="button"
                                aria-label={`View details for ${product.title}`}
                            >
                                <motion.div
                                    className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden h-full flex flex-col mx-auto w-full"
                                    whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 10px 10px -5px rgba(0, 0, 0, 0.03)' }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Prime badge */}
                                    {product.isPrime && (
                                        <div className="absolute top-3 left-3 z-10">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="bg-[#0574F7] text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center"
                                            >
                                                Prime
                                            </motion.div>
                                        </div>
                                    )}

                                    {/* Image container fixed aspect ratio */}
                                    <div className="relative w-full aspect-[1/1] bg-white dark:bg-gray-800 pt-0.5 pb-0">
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            className="h-full w-full relative"
                                        >
                                            {product.image && (
                                                <Image
                                                    src={product.image}
                                                    alt={product.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    className="object-cover p-2"
                                                    loading="lazy"
                                                    unoptimized={product.image.startsWith('data:')}
                                                />
                                            )}
                                        </motion.div>
                                    </div>

                                    {/* Content area */}
                                    <div className="pl-3 pr-3 flex-grow flex flex-col">
                                        {/* Brand info and StoreIdentifier on same line */}
                                        <div className="flex items-center justify-between mb-1.5">
                                            {product.brand ? (
                                                <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded inline-block">
                                                    {product.brand.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                                </span>
                                            ) : (
                                                <div /> /* Placeholder empty element to ensure right alignment */
                                            )}
                                            <StoreIdentifier
                                                url={product.url || ''}
                                                align="right"
                                                apiProvider={product.apiProvider}
                                            />
                                        </div>

                                        <h3 className="text-base font-medium line-clamp-2 mb-2 flex-grow text-primary-dark dark:text-white">
                                            {product.title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                        </h3>

                                        {/* Price and discount */}
                                        <div className="flex items-center justify-between mt-1 mb-2">
                                            <div className="flex items-baseline min-w-0 overflow-hidden mr-2">
                                                <span className="text-lg font-semibold text-primary dark:text-primary-light whitespace-nowrap">
                                                    {formatPrice(product.price)}
                                                </span>
                                                {product.originalPrice > product.price && (
                                                    <span className="text-xs text-secondary dark:text-gray-400 line-through whitespace-nowrap ml-1.5">
                                                        {formatPrice(product.originalPrice)}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Discount badge — shown only when discount is non-null, greater than 0, and rounds to > 0 */}
                                            {product.discount ? (
                                                Math.round(product.discount) > 0 ? (
                                                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 bg-primary-badge">
                                                        -{Math.round(product.discount)}%
                                                    </span>
                                                ) : null
                                            ) : product.couponValue && product.couponType ? (
                                                <span className="text-xs font-bold text-white px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 bg-green-500">
                                                    {product.couponType === 'percentage'
                                                        ? `${product.couponValue}%`
                                                        : `$${product.couponValue}`} Coupon
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    {/* Action button */}
                                    <div className="px-3 pb-3">
                                        <motion.div
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            className="w-full py-2 bg-primary-button hover:bg-primary-button-hover dark:bg-primary-button-light dark:hover:bg-primary-button text-white text-center rounded-full font-medium shadow-sm transition-colors cursor-pointer"
                                        >
                                            View Details
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Simple pagination */}
            {!isLoading && totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-md ${currentPage === 1
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
                                }`}
                        >
                            Previous
                        </button>

                        <span className="text-gray-700">
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-md ${currentPage === totalPages
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
                                }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Export the wrapped component with Suspense
export default function SearchPage() {
    return (
        <Suspense fallback={<SearchSkeleton />}>
            <SearchPageContent />
        </Suspense>
    );
} 