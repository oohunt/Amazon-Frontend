"use client";

import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';

import FavoriteButton from '@/components/common/FavoriteButton';
import { ProductCategoryNav } from '@/components/product/ProductCategoryNav';
import ProductList from '@/components/ProductList';
import { ProductFilter } from '@/components/products/ProductFilter';
import ApiStateWrapper from '@/components/ui/ApiStateWrapper';
import { useProducts } from '@/lib/hooks';
import { StoreIdentifier } from '@/lib/store';
import { adaptProducts } from '@/lib/utils';
import type { ComponentProduct } from '@/types';
import type { AmazonProduct } from '@/types/amazonApi';
import type { Product } from '@/types/api';

// Define DrawerFilters interface
interface DrawerFilters {
    min_price?: number;
    max_price?: number;
    min_discount?: number;
    brands?: string | string[];
    is_prime_only?: boolean;
}

// Filter parameter interface
interface FilterParams extends DrawerFilters {
    api_provider?: string;
    min_commission?: number;
    min_rating?: number;
}

// Addtype definition
interface ProductsApiResponse {
    items?: Product[];
    total?: number;
    page?: number;
    page_size?: number;
    // Support nested structure
    success?: boolean;
    data?: {
        items: Product[];
        total: number;
        page: number;
        page_size: number;
    };
}

// API parameter types
interface ApiParams {
    product_groups?: string;
    brands?: string;
    page?: number;
    page_size?: number;
    min_price?: number;
    max_price?: number;
    min_discount?: number;
    sort_by?: string;
    sort_order?: string;
    product_type?: string;
    is_prime_only?: boolean;
    limit?: number;
}

// Interactive animated SVG component replacing original 3D model
const CategoryIllustration = ({ category }: { category: string }) => {
    const illustrations: Record<string, React.ReactNode> = {
        electronics: (
            <motion.div className="w-full h-full flex items-center justify-center">
                <motion.div
                    className="relative w-64 h-64"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-30"
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M3 7h18v10H3V7z" stroke="white" strokeWidth="2" />
                            <path d="M7 18v2M17 18v2M9 7V5M15 7V5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </motion.div>
                </motion.div>
            </motion.div>
        ),
        clothing: (
            <motion.div className="w-full h-full flex items-center justify-center">
                <motion.div
                    className="relative w-64 h-64"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full opacity-30"
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M6 3h12l2 4-5 2V21h-6V9L4 7l2-4z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </motion.div>
                </motion.div>
            </motion.div>
        ),
        home: (
            <motion.div className="w-full h-full flex items-center justify-center">
                <motion.div
                    className="relative w-64 h-64"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full opacity-30"
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 21v-8h6v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </motion.div>
                </motion.div>
            </motion.div>
        ),
        default: (
            <motion.div className="w-full h-full flex items-center justify-center">
                <motion.div
                    className="relative w-64 h-64"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-30"
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32"
                        animate={{
                            rotate: 360,
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" />
                            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </motion.div>
                </motion.div>
            </motion.div>
        )
    };

    return illustrations[category] || illustrations.default;
};

// SVG filter for liquid button effect
const LiquidFilter = () => (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="liquid" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
            <feGaussianBlur in="SourceGraphic" stdDeviation={10} result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="liquid" />
            <feComposite in="SourceGraphic" in2="liquid" operator="atop" />
        </filter>
    </svg>
);

// Type predicate function to distinguish product types
const _isAmazonProduct = (product: AmazonProduct | Product): product is AmazonProduct => {
    return 'asin' in product;
};

const _isProduct = (product: AmazonProduct | Product): product is Product => {
    return 'id' in product;
};

// Addproduct skeleton component
const ProductSkeleton = () => (
    <div className="relative group h-full">
        <div className="relative h-full flex flex-col overflow-hidden rounded-lg shadow-lg bg-white dark:bg-gray-800 animate-pulse">
            {/* Image skeleton */}
            <div className="relative w-full pt-[100%] bg-gray-200 dark:bg-gray-700" />

            {/* Content area */}
            <div className="p-2 sm:p-3 md:p-4 flex-grow flex flex-col">
                {/* Title skeleton */}
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />

                {/* Price area skeleton */}
                <div className="mt-auto pt-1 sm:pt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-0.5 sm:gap-1">
                    <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            </div>
        </div>
    </div>
);

// add back-to-top button component
const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Detect scroll position to control button visibility
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 500) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    // Scroll to top function
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </motion.button>
            )}
        </AnimatePresence>
    );
};

// Modify main page component
export default function ProductsPage() {
    const categoryFromSlug = undefined;
    return (
        <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">
            <div className="animate-pulse text-xl font-semibold">Loading products...</div>
        </div>}>
            <ProductsContent categoryFromSlug={categoryFromSlug} />
        </Suspense>
    );
}

// Use Client Component to wrap search parameter logic
function ProductsContent({ categoryFromSlug }: { categoryFromSlug?: string } = {}) {
    const searchParamsFromUrl = useSearchParams();
    // Detect category from URL path (e.g. /product/category/Electronics)
    const pathname0 = usePathname();
    const categoryFromPath = useMemo(() => {
        if (pathname0) {
            const match = pathname0.match(/\/product\/category\/(.+)/);
            return match ? decodeURIComponent(match[1]) : undefined;
        }
        return undefined;
    }, [pathname0]);
    const [searchParams, setSearchParams] = useState({
        product_groups: '' as string,
        brands: '' as string,
        page: 1,
        limit: 50,
        sort_by: 'all' as 'price' | 'discount' | 'created' | 'all',
        sort_order: 'desc' as 'asc' | 'desc',
        min_price: undefined as number | undefined,
        max_price: undefined as number | undefined,
        min_discount: undefined as number | undefined,
        product_type: 'all' as 'discount' | 'coupon' | 'all',
        is_prime_only: false,
        api_provider: undefined as string | undefined,
    });

    const [drawerFilters, setDrawerFilters] = useState<DrawerFilters | null>(null);
    const [urlParamsLoaded, setUrlParamsLoaded] = useState(false);
    const catalogRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const paginationRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ layoutEffect: false });
    const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.97]);

    // Addcache status display
    const [_cacheStatus, setCacheStatus] = useState<{
        isCached: boolean;
        responseTime: number;
        expires: string;
    } | null>(null);

    // AddJS scroll logic for sidebar fixed positioning within parent container
    useEffect(() => {
        const handleScroll = () => {
            if (!sidebarRef.current || !mainContentRef.current || !catalogRef.current || !paginationRef.current) return;

            const sidebarElem = sidebarRef.current;
            const catalogRect = catalogRef.current.getBoundingClientRect();
            const mainContentRect = mainContentRef.current.getBoundingClientRect();
            const sidebarRect = sidebarElem.getBoundingClientRect();
            const paginationRect = paginationRef.current.getBoundingClientRect();

            // Fixed offset (navbar height)
            const topOffset = 72;

            // Calculate parent container position
            const containerTop = catalogRect.top + window.scrollY;
            const paginationTop = paginationRect.top + window.scrollY;

            // Calculate sidebar height and current scroll position
            const sidebarHeight = sidebarRect.height;
            const scrollY = window.scrollY;

            // Calculate actual height of main content area
            const mainContentHeight = mainContentRect.height;

            // Ensure sidebar doesn't exceed top of pagination area, accounting for sidebar height
            const BUFFER = 20; // Increase buffer to 20px
            const maxTop = Math.min(
                mainContentHeight - sidebarHeight,
                paginationTop - containerTop - sidebarHeight - BUFFER
            );

            // Calculate distance from current scroll position to the bottom
            const currentScrollTop = scrollY + topOffset - containerTop;
            const distanceToBottom = maxTop - currentScrollTop;

            // Check scroll position and update styles
            if (scrollY + topOffset >= containerTop) {
                if (distanceToBottom <= BUFFER) {
                    // When fully scrolled to the bottom
                    Object.assign(sidebarElem.style, {
                        position: 'absolute',
                        top: `${maxTop}px`,
                        transform: 'none'
                    });
                } else {
                    // Keep fixed during normal scrolling
                    Object.assign(sidebarElem.style, {
                        position: 'fixed',
                        top: `${topOffset}px`,
                        transform: 'none'
                    });
                }
            } else {
                // Return to top
                Object.assign(sidebarElem.style, {
                    position: 'absolute',
                    top: '0',
                    transform: 'none'
                });
            }
        };

        // Add debounce handling
        let ticking = false;
        const scrollHandler = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });
        window.addEventListener('resize', scrollHandler, { passive: true });

        // Call once on initialization
        handleScroll();

        return () => {
            window.removeEventListener('scroll', scrollHandler);
            window.removeEventListener('resize', scrollHandler);
        };
    }, []);

    // AdduseEffect to ensure correct loading from URL params
    useEffect(() => {
        // Get URL parameters (ignore timestamp parameter _ts)
        const brands = searchParamsFromUrl.get('brands') || '';
        const product_groups = searchParamsFromUrl.get('product_groups') || '';
        const category = searchParamsFromUrl.get('category') || ''; // Compatible with category parameter

        // Prefer categoryFromSlug from route path or URL path category over query params
        // If categoryFromSlug or categoryFromPath exists, ignore category/product_groups from query params
        const effective_category = categoryFromSlug || categoryFromPath || product_groups || category;

        const page = Number(searchParamsFromUrl.get('page')) || 1;
        const min_price = searchParamsFromUrl.get('min_price') ? Number(searchParamsFromUrl.get('min_price')) : undefined;
        const max_price = searchParamsFromUrl.get('max_price') ? Number(searchParamsFromUrl.get('max_price')) : undefined;
        const min_discount = searchParamsFromUrl.get('min_discount') ? Number(searchParamsFromUrl.get('min_discount')) : undefined;
        const is_prime_only = searchParamsFromUrl.get('is_prime_only') === 'true';
        const sort_by = (searchParamsFromUrl.get('sort_by') as typeof searchParams.sort_by) || 'all';
        const sort_order = (searchParamsFromUrl.get('sort_order') as typeof searchParams.sort_order) || 'desc';
        const api_provider = searchParamsFromUrl.get('api_provider') || undefined;

        // update searchParams status using merged category params
        setSearchParams(prev => {
            const newParams = {
                ...prev,
                brands,
                product_groups: effective_category, // Use merged category parameter
                page,
                min_price,
                max_price,
                min_discount,
                is_prime_only,
                sort_by,
                sort_order,
                api_provider
            };

            return newParams;
        });

        // Mark URL parameters as loaded
        setUrlParamsLoaded(true);

        // Updatetemporary filter status
        setDrawerFilters({
            min_price: min_price,
            max_price: max_price,
            min_discount: min_discount,
            brands: brands,
            is_prime_only: is_prime_only
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParamsFromUrl, categoryFromSlug, categoryFromPath]);

    // Import useRouter and usePathname
    const router = useRouter();
    const pathname = pathname0; // Use current page actual path

    // AdduseEffect to update URL when searchParams changes
    useEffect(() => {
        // create URL parameter object
        const params = new URLSearchParams();

        // Check if currently on category page (URL contains /category/)
        const isInCategoryPage = pathname.includes('/category/');

        // Add product_groups parameter only on non-category pages to avoid duplication
        if (searchParams.product_groups && !isInCategoryPage) {
            params.set('product_groups', searchParams.product_groups);
        }

        // Add other parameters normally
        if (searchParams.brands) params.set('brands', searchParams.brands);
        if (searchParams.page > 1) params.set('page', searchParams.page.toString());
        if (searchParams.min_price !== undefined) params.set('min_price', searchParams.min_price.toString());
        if (searchParams.max_price !== undefined) params.set('max_price', searchParams.max_price.toString());
        if (searchParams.min_discount !== undefined) params.set('min_discount', searchParams.min_discount.toString());
        if (searchParams.is_prime_only) params.set('is_prime_only', 'true');
        if (searchParams.sort_by !== 'all') params.set('sort_by', searchParams.sort_by);
        if (searchParams.sort_order !== 'desc') params.set('sort_order', searchParams.sort_order);
        if (searchParams.api_provider) params.set('api_provider', searchParams.api_provider);

        // Build query string
        const queryString = params.toString();
        const url = queryString ? `${pathname}?${queryString}` : pathname;

        // Use replace instead of push to update URL, avoid creating too many history entries
        router.replace(url, { scroll: false });
    }, [searchParams, router, pathname]);

    // Clean up timestamp parameter from URL
    useEffect(() => {
        if (typeof window !== 'undefined' && searchParamsFromUrl.has('_ts')) {
            // create a new URLSearchParams instance
            const cleanParams = new URLSearchParams();

            // copy all parameters except _ts
            searchParamsFromUrl.forEach((value, key) => {
                if (key !== '_ts') {
                    cleanParams.append(key, value);
                }
            });

            // Build clean URL
            const cleanUrl = cleanParams.toString()
                ? `${pathname}?${cleanParams.toString()}`
                : pathname;

            // Clean up URL after 200ms delay to avoid interfering with initial data load
            const timeoutId = setTimeout(() => {
                router.replace(cleanUrl, { scroll: false });
            }, 200);

            return () => clearTimeout(timeoutId);
        }
    }, [searchParamsFromUrl, router, pathname]);

    // Fetch product data only when urlParamsLoaded is true to ensure URL-loaded params are used
    const { data, isLoading, isError, mutate } = useProducts(urlParamsLoaded ? searchParams : undefined);
    const [isDirectLoading, setIsDirectLoading] = useState(false);
    const [directData, setDirectData] = useState<ProductsApiResponse | null>(null);

    // Explicitly trigger data refresh after searchParams change
    useEffect(() => {
        if (urlParamsLoaded && mutate) {
            // Addbrief delay to ensure URL update is complete
            setTimeout(() => {
                mutate();
            }, 50);
        }
    }, [searchParams, urlParamsLoaded, mutate]);

    // If SWR fetch fails, try fetching directly
    useEffect(() => {
        const fetchDirectlyIfNeeded = async () => {
            if ((isError || (!data && !isLoading)) && !isDirectLoading) {
                try {
                    setIsDirectLoading(true);

                    // create parameter object, converting parameter names
                    const apiParams: ApiParams = { ...searchParams };

                    if (searchParams.limit) apiParams.page_size = searchParams.limit;
                    delete apiParams.limit;

                    // remove empty parameters
                    if (apiParams.brands === '') delete apiParams.brands;
                    if (apiParams.product_groups === '') delete apiParams.product_groups;

                    // Use new cached route endpoint
                    const queryParams = new URLSearchParams();

                    // Addall valid parameters
                    Object.entries(apiParams)
                        .filter(([_, value]) => value !== undefined && value !== null)
                        .forEach(([key, value]) => {
                            queryParams.append(key, String(value));
                        });

                    const queryString = queryParams.toString();
                    const url = `/api/products/list${queryString ? `?${queryString}` : ''}`;

                    // Make request
                    const response = await fetch(url);

                    // Check cache status in response headers
                    if (response.ok) {
                        const responseData = await response.json();

                        // Handle possible different response formats
                        let processedData;

                        if (responseData.success && responseData.data && typeof responseData.data === 'object') {
                            // Nested structure { success: true, data: { items: [...], total: ... } }
                            processedData = responseData;
                        } else if (responseData.items) {
                            // Direct structure { items: [...], total: ... }
                            processedData = {
                                success: true,
                                data: responseData
                            };
                        } else if (responseData.data && responseData.data.items) {
                            // Nested structure { data: { items: [...], total: ... } }
                            processedData = {
                                success: true,
                                data: responseData.data
                            };
                        } else {
                            // Unknown structure, use empty result
                            processedData = {
                                success: true,
                                data: {
                                    items: [],
                                    total: 0,
                                    page: 1,
                                    page_size: 20
                                }
                            };
                        }

                        setDirectData(processedData);

                        // Get and update cache status
                        const isCached = response.headers.get('X-Cache-Source') === 'cache-hit';
                        const responseTime = parseInt(response.headers.get('X-Response-Time') || '0');
                        const expires = response.headers.get('X-Cache-Expires') || '';

                        setCacheStatus({
                            isCached,
                            responseTime,
                            expires
                        });
                    }
                } catch {
                    // Error handling
                    setCacheStatus(null);
                } finally {
                    setIsDirectLoading(false);
                }
            }
        };

        fetchDirectlyIfNeeded();

        // Reset directData whenever searchParams changes to ensure new data is fetched
        setDirectData(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isError, data, isLoading, searchParams]);

    // Add page load complete event
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleLoad = () => {
                // After page fully loads, perform an extra data refresh
                if (mutate) {
                    setTimeout(() => mutate(), 100);
                }
            };

            window.addEventListener('load', handleLoad);

            return () => window.removeEventListener('load', handleLoad);
        }
    }, [mutate]);

    // Adapt API product data to format needed by component
    const adaptedProducts = useMemo(() => {
        // Prefer SWR data, fall back to directly fetched data
        let sourceData;

        // Handle SWR data
        if (data) {
            const typedData = data as ProductsApiResponse;

            sourceData = typedData.items;
        }

        // If no SWR data, use directly fetched data
        if (!sourceData && directData) {
            const typedDirectData = directData as ProductsApiResponse;

            if (typedDirectData.data && typedDirectData.data.items) {
                sourceData = typedDirectData.data.items;
            } else if (typedDirectData.items) {
                sourceData = typedDirectData.items;
            }
        }

        if (!sourceData || !Array.isArray(sourceData)) {
            return [];
        }

        return adaptProducts(sourceData);
    }, [data, directData]);

    // Get total product count, support different data structures
    const getTotalProducts = () => {
        if (data) {
            const typedData = data as ProductsApiResponse;

            if (typedData.total) {
                return typedData.total;
            } else if (typedData.data && typedData.data.total) {
                return typedData.data.total;
            }
        }

        if (directData) {
            const typedDirectData = directData as ProductsApiResponse;

            if (typedDirectData.data && typedDirectData.data.total) {
                return typedDirectData.data.total;
            } else if (typedDirectData.total) {
                return typedDirectData.total;
            }
        }

        return 0;
    };

    // Handle category click
    const handleCategoryClick = useCallback((category: string) => {
        // Update internal status first
        setSearchParams(prev => ({
            ...prev,
            product_groups: category || '',
            page: 1
        }));

        // Build new URL path
        const newPath = category
            ? `/product/category/${encodeURIComponent(category)}`
            : '/product';

        // Manipulate URL directly using simplest method
        if (typeof window !== 'undefined') {
            try {
                // Method 1: Replace URL directly, force update
                window.history.replaceState(
                    { as: newPath, url: newPath },
                    '',
                    newPath
                );

                // Method 2: Delay router.replace to ensure it is the last navigation executed
                setTimeout(() => {
                    router.replace(newPath, { scroll: false });
                }, 50);
            } catch {
                // If error, use most direct approach
                window.location.href = newPath;
            }
        }

        if (catalogRef.current) {
            catalogRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [router, setSearchParams, catalogRef]);

    // Handle pagination
    const handlePageChange = useCallback((page: number) => {
        setSearchParams(prev => ({ ...prev, page }));

        if (catalogRef.current) {
            window.scrollTo({
                top: catalogRef.current.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    }, [setSearchParams, catalogRef]);

    // Handle filter condition change
    const handleFilterChange = useCallback((filters: FilterParams) => {
        // remove unsupported parameters but keep api_provider
        const { min_commission: _min_commission, min_rating: _min_rating, ...validFilters } = filters;

        // create new filter object, ensuring type compatibility
        const newFilters: Partial<typeof searchParams> = {};

        // Manually handle each attribute to ensure type compatibility
        if (validFilters.min_price !== undefined) newFilters.min_price = validFilters.min_price;
        if (validFilters.max_price !== undefined) newFilters.max_price = validFilters.max_price;
        if (validFilters.min_discount !== undefined) newFilters.min_discount = validFilters.min_discount;
        if (validFilters.is_prime_only !== undefined) newFilters.is_prime_only = validFilters.is_prime_only;
        if (validFilters.api_provider !== undefined) newFilters.api_provider = validFilters.api_provider;

        // Ensure brand parameter is string type
        if (validFilters.brands) {
            newFilters.brands = Array.isArray(validFilters.brands)
                ? validFilters.brands.join(',')
                : validFilters.brands;
        }

        setSearchParams(prev => ({
            ...prev,
            ...newFilters,
            page: 1
        }));
    }, []);

    // Close drawer function
    const closeDrawer = useCallback(() => {
        // Apply filter conditions in current drawer
        if (drawerFilters) {
            handleFilterChange(drawerFilters);
        }

        const drawerElem = document.getElementById('mobile-filter-drawer');
        const overlayElem = document.getElementById('drawer-overlay');

        if (drawerElem && overlayElem) {
            drawerElem.classList.add('translate-y-full');
            overlayElem.classList.remove('opacity-70');
            overlayElem.classList.add('opacity-0');
            overlayElem.classList.add('pointer-events-none');
            document.body.classList.remove('overflow-hidden');
        }
    }, [drawerFilters, handleFilterChange]);

    // Render individual product
    const renderProduct = (product: ComponentProduct) => {
        // Handle discount and coupon logic
        const hasCoupon = product.couponType && product.couponValue;
        const hasDiscount = product.discount > 0;
        const discountLabel = hasDiscount ? `-${Math.round(product.discount)}%` : '';
        let couponLabel = '';

        // Use API-adapted originalPrice directly, no complex calculation needed
        const calculatedOriginalPrice = product.originalPrice;

        // Handle coupon badge
        if (hasCoupon) {
            if (product.couponType === 'percentage') {
                couponLabel = `-${product.couponValue}%`;
            } else if (product.couponType === 'fixed') {
                couponLabel = `$${product.couponValue}`;
            }
        }

        // Check if there is any form of discount
        const hasAnyDiscount = hasDiscount || hasCoupon;

        // Calculate discount percentage for badge color styles
        let discountBadgeClass = 'bg-primary-badge';

        if (hasDiscount) {
            if (product.discount > 30) {
                discountBadgeClass = 'bg-primary-badge';
            } else if (product.discount > 10) {
                discountBadgeClass = 'bg-primary-badge';
            }
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative group h-full"
            >
                {/* Favorite button */}
                <div
                    className="absolute top-3 right-3 z-20"
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

                <Link href={`/product/${product.id}`} className="block">
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
                                <Image
                                    src={product.image}
                                    alt={product.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover p-2"
                                    loading="lazy"
                                    unoptimized={product.image.startsWith('data:')}
                                />
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
                                    url={product.cj_url || product.url || ''}
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
                                        ${product.price.toFixed(2)}
                                    </span>
                                    {hasAnyDiscount && calculatedOriginalPrice > product.price && (
                                        <span className="text-xs text-secondary dark:text-gray-400 line-through whitespace-nowrap ml-1.5">
                                            ${calculatedOriginalPrice.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                {hasCoupon && couponLabel ? (
                                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 bg-green-500">
                                        {couponLabel} Coupon
                                    </span>
                                ) : (hasDiscount && discountLabel && (
                                    <span className={`text-xs font-bold text-white px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${discountBadgeClass}`}>
                                        {discountLabel}
                                    </span>
                                ))}
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
    };

    // Render product list content
    const renderProductList = (products: ComponentProduct[]) => (
        <AnimatePresence mode="wait">
            <motion.div
                key={`products-${searchParams.product_groups || 'all'}-${searchParams.page}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                        Showing <span className="font-medium">{products.length}</span> of <span className="font-medium">{getTotalProducts()}</span> products

                    </p>
                    <div className="flex items-center gap-2">
                        <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-400">
                            Sort by:
                        </label>
                        <select
                            id="sort"
                            className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                            value={`${searchParams.sort_by}:${searchParams.sort_order}`}
                            onChange={(e) => {
                                const [sort_by, sort_order] = e.target.value.split(':');

                                setSearchParams(prev => ({
                                    ...prev,
                                    sort_by: sort_by as 'price' | 'discount' | 'created' | 'all',
                                    sort_order: sort_order as 'asc' | 'desc',
                                    page: 1
                                }));
                            }}
                        >
                            <option value="all:desc">Recommended</option>
                            <option value="price:asc">Price: Low to High</option>
                            <option value="price:desc">Price: High to Low</option>
                            <option value="discount:desc">Biggest Discount</option>
                            <option value="created:desc">Newest</option>
                        </select>
                    </div>
                </div>
                <ProductList
                    products={products}
                    renderProduct={renderProduct}
                    currentPage={searchParams.page}
                    totalPages={Math.ceil((getTotalProducts() / searchParams.limit))}
                    onPageChange={handlePageChange}
                />
            </motion.div>
        </AnimatePresence>
    );

    const skeletonIds = useMemo(() => Array.from({ length: 15 }, (_, index) => `skeleton-${index}`), []);

    // Render skeleton screen
    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {skeletonIds.map((id) => (
                <ProductSkeleton key={id} />
            ))}
        </div>
    );

    // Addevent listener to handle button clicks inside the filter
    useEffect(() => {
        const handleFilterButtonClick = (event: MouseEvent) => {
            // Check if clicked element is a button
            const target = event.target as HTMLElement;

            // Find nearest button element
            const button = target.closest('button');

            if (!button) return;

            // Check if the clicked element is the "Apply Filters" button
            const isApplyButton = button.textContent?.trim() === 'Apply Filters';

            // Check if button is inside mobile/tablet filter
            const isMobileFilter = !!button.closest('#mobile-filter');
            const isTabletFilter = !!button.closest('#tablet-filter');

            // If "Apply Filters" button clicked inside mobile/tablet filter, close drawer
            if (isApplyButton && (isMobileFilter || isTabletFilter)) {
                // Add a short delay to ensure filter conditions have been updated
                setTimeout(closeDrawer, 100);
            }
        };

        // Addevent listener
        document.addEventListener('click', handleFilterButtonClick);

        // Cleanup function
        return () => {
            document.removeEventListener('click', handleFilterButtonClick);
        };
    }, [closeDrawer]);// Add closeDrawer dependency

    return (
        <div className="min-h-screen pb-20">
            <LiquidFilter />

            {/* Back to top button */}
            <ScrollToTopButton />

            {/* Hero section with animated SVG illustration — optimized for mobile */}
            <section className="relative h-[30vh] md:h-[35vh] min-h-[300px] md:min-h-[400px] w-[100vw] left-[calc(-50vw+50%)] right-0 overflow-hidden bg-gradient-to-br from-[#1B5479] to-[#287EB7]">
                <motion.div
                    className="absolute inset-0 bg-[url('/images/dot-pattern.svg')] opacity-10"
                    animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                        duration: 50,
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />

                <div className="container mx-auto h-full px-4 sm:px-6 md:px-8 lg:px-12 relative z-10 flex flex-col md:flex-row items-center justify-between py-8 md:py-12">
                    <motion.div
                        className="max-w-full md:max-w-2xl text-center md:text-left mt-8 md:mt-0"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 md:mb-4">Discover Premium Products</h1>
                        <p className="text-base sm:text-lg md:text-xl text-white mb-4 md:mb-8">Curated global selections for an exceptional shopping experience</p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 sm:px-8 py-2 sm:py-3 bg-[#0574F7] text-white font-semibold rounded-full shadow-lg hover:bg-[#0574F7]/90 transition-all duration-300"
                            onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Explore Now
                        </motion.button>
                    </motion.div>

                    <div className="hidden md:block h-full w-1/3 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <CategoryIllustration category={searchParams.product_groups || 'default'} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Category navigation - responsive design */}
            <motion.header
                className="sticky top-0 z-[60] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm"
                style={{
                    opacity: headerOpacity,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="w-full relative bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                    <div className="container mx-auto relative">
                        {/* Mobile and tablet navigation — swipe left/right */}
                        <div className="md:hidden">
                            {/* Left/right swipe arrows */}
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 flex items-center h-full">
                                <button
                                    className="h-full px-2 flex items-center justify-center bg-gradient-to-r from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 dark:to-transparent"
                                    onClick={() => {
                                        const scrollContainer = document.querySelector('.categories-scroll-container');

                                        if (scrollContainer) {
                                            scrollContainer.scrollLeft -= 150;
                                        }
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            </div>

                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 flex items-center h-full">
                                <button
                                    className="h-full px-2 flex items-center justify-center bg-gradient-to-l from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 dark:to-transparent"
                                    onClick={() => {
                                        const scrollContainer = document.querySelector('.categories-scroll-container');

                                        if (scrollContainer) {
                                            scrollContainer.scrollLeft += 150;
                                        }
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Scroll area */}
                            <div className="overflow-x-auto scrollbar-hide px-8 py-2 categories-scroll-container">
                                <ProductCategoryNav
                                    selectedCategory={searchParams.product_groups || ''}
                                    onCategorySelect={handleCategoryClick}
                                    displayMode="scroll"
                                />
                            </div>

                            {/* Scroll indicator */}
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 flex items-center justify-center space-x-1 mb-1">
                                <div className="w-6 h-0.5 bg-green-500 rounded-full" />
                                <div className="w-2 h-0.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
                                <div className="w-2 h-0.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
                            </div>
                        </div>

                        {/* Desktop navigation — expand/collapse */}
                        <div className="hidden md:block px-4 py-2">
                            <ProductCategoryNav
                                selectedCategory={searchParams.product_groups || ''}
                                onCategorySelect={handleCategoryClick}
                                displayMode="expand"
                            />
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Product list area - responsive layout */}
            <section ref={catalogRef} className="max-w-[1800px] mx-auto overflow-visible">
                <div ref={mainContentRef} className="flex relative">
                    {/* Desktop left-side filter */}
                    <div className="hidden lg:block w-[280px] flex-shrink-0">
                        <div
                            ref={sidebarRef}
                            className="w-[280px] bg-white dark:bg-gray-900 pb-4 shadow-sm border-r border-gray-100 dark:border-gray-800 scrollbar-hide z-[100] overscroll-contain"
                            style={{
                                maxHeight: 'calc(100vh - 80px)',
                                willChange: 'transform',
                                backfaceVisibility: 'hidden',
                                position: 'relative',
                                overflowAnchor: 'none'
                            }}
                        >
                            <div className="p-4 w-full h-full overflow-y-auto overscroll-contain">
                                <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Filter</h2>
                                <ProductFilter
                                    onFilter={handleFilterChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right-side product list area */}
                    <main className="flex-1 min-h-screen w-full px-4 py-6 md:py-12" ref={mainContentRef}>
                        {/* Mobile filter button */}
                        <div className="lg:hidden mb-4">
                            <button
                                className="w-full py-3 px-4 sm:py-4 sm:rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-xl shadow-md flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                onClick={() => {
                                    setDrawerFilters({
                                        min_price: searchParams.min_price,
                                        max_price: searchParams.max_price,
                                        min_discount: searchParams.min_discount,
                                        brands: searchParams.brands,
                                        is_prime_only: searchParams.is_prime_only
                                    });

                                    const drawerElem = document.getElementById('mobile-filter-drawer');
                                    const overlayElem = document.getElementById('drawer-overlay');

                                    if (drawerElem && overlayElem) {
                                        drawerElem.classList.remove('translate-y-full');
                                        overlayElem.classList.remove('opacity-0');
                                        overlayElem.classList.add('opacity-70');
                                        overlayElem.classList.remove('pointer-events-none');
                                        document.body.classList.add('overflow-hidden');
                                    }
                                }}
                            >
                                <span className="font-medium">Filter Products</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <ApiStateWrapper
                            isLoading={isLoading || isDirectLoading}
                            isError={!!isError && !directData}
                            isEmpty={!adaptedProducts?.length}
                            emptyMessage="No matching products found"
                            data={adaptedProducts}
                            loadingFallback={renderSkeletons()}
                        >
                            {(products) => (
                                <>
                                    {renderProductList(products)}
                                    {/* Pagination area as scroll boundary */}
                                    <div ref={paginationRef} className="mt-8">
                                        {/* Pagination component */}
                                        <div className="flex justify-center space-x-2">
                                            {/* ... pagination buttons ... */}
                                        </div>
                                    </div>
                                </>
                            )}
                        </ApiStateWrapper>
                    </main>
                </div>
            </section>
            {/* Overlay */}
            <div
                id="drawer-overlay"
                className="fixed inset-0 bg-black opacity-0 pointer-events-none transition-opacity duration-300 z-[998]"
                onClick={() => {
                    const drawerElem = document.getElementById('mobile-filter-drawer');
                    const overlayElem = document.getElementById('drawer-overlay');

                    if (drawerElem && overlayElem) {
                        drawerElem.classList.add('translate-y-full');
                        overlayElem.classList.remove('opacity-70');
                        overlayElem.classList.add('opacity-0');
                        overlayElem.classList.add('pointer-events-none');
                        document.body.classList.remove('overflow-hidden');
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        const drawerElem = document.getElementById('mobile-filter-drawer');
                        const overlayElem = document.getElementById('drawer-overlay');

                        if (drawerElem && overlayElem) {
                            drawerElem.classList.add('translate-y-full');
                            overlayElem.classList.remove('opacity-70');
                            overlayElem.classList.add('opacity-0');
                            overlayElem.classList.add('pointer-events-none');
                            document.body.classList.remove('overflow-hidden');
                        }
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label="Close filter drawer"
            />
            {/* Mobile filter drawer */}
            <div
                id="mobile-filter-drawer"
                className="fixed bottom-0 inset-x-0 z-[999] bg-white dark:bg-gray-800 rounded-t-2xl shadow-lg transform translate-y-full transition-transform duration-300 max-h-[90vh] overflow-y-auto"
            >
                {/* Drawer header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                    <button
                        onClick={() => {
                            const drawerElem = document.getElementById('mobile-filter-drawer');
                            const overlayElem = document.getElementById('drawer-overlay');

                            if (drawerElem && overlayElem) {
                                drawerElem.classList.add('translate-y-full');
                                overlayElem.classList.remove('opacity-70');
                                overlayElem.classList.add('opacity-0');
                                overlayElem.classList.add('pointer-events-none');
                                document.body.classList.remove('overflow-hidden');
                            }
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {/* Drawer content */}
                <div className="p-4">
                    <ProductFilter
                        onFilter={(newFilters) => {
                            setDrawerFilters(newFilters as DrawerFilters);
                            handleFilterChange(newFilters as DrawerFilters);

                            // close drawer
                            const drawerElem = document.getElementById('mobile-filter-drawer');
                            const overlayElem = document.getElementById('drawer-overlay');

                            if (drawerElem && overlayElem) {
                                drawerElem.classList.add('translate-y-full');
                                overlayElem.classList.remove('opacity-70');
                                overlayElem.classList.add('opacity-0');
                                overlayElem.classList.add('pointer-events-none');
                                document.body.classList.remove('overflow-hidden');
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}