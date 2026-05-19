"use client";

import { useState, useEffect, useRef } from "react";

import { NewsletterSubscribe } from "@/components/email/NewsletterSubscribe";
import { CategoryNavigation } from "@/components/ui/CategoryNavigation";
import { CategoryProducts } from "@/components/ui/CategoryProducts";
import { FeaturedDeals } from "@/components/ui/FeaturedDeals";
import { HeroSection } from "@/components/ui/HeroSection";
import { useCategoryStats } from "@/lib/hooks";

// Define category interface
interface Category {
    name: string;
    slug: string;
}

// Categories to never show on the homepage (clothing removed per user decision)
const HIDDEN_CATEGORIES = new Set([
    'Clothing, Shoes & Jewelry',
    'Clothing',
    'Shoes',
    'Jewelry',
]);

// Product group to category mapping — kept in sync with CategoryNavigation
const productGroupToCategoryMapping: Record<string, { slug: string, name: string }> = {
    'Electronics': { slug: 'Electronics', name: 'Electronics' },
    'Clothing, Shoes & Jewelry': { slug: 'Clothing, Shoes & Jewelry', name: 'Clothing & Jewelry' },
    'Home & Kitchen': { slug: 'Home & Kitchen', name: 'Home & Kitchen' },
    'Sports & Outdoors': { slug: 'Sports & Outdoors', name: 'Sports & Outdoors' },
    'Beauty & Personal Care': { slug: 'Beauty & Personal Care', name: 'Beauty' },
    'Toys & Games': { slug: 'Toys & Games', name: 'Toys & Games' },
    'Books': { slug: 'Books', name: 'Books' },
    'Automotive': { slug: 'Automotive', name: 'Automotive' },
    'Health & Household': { slug: 'Health & Household', name: 'Health' },
    'Tools & Home Improvement': { slug: 'Tools & Home Improvement', name: 'Tools' },
    'Pet Supplies': { slug: 'Pet Supplies', name: 'Pet Supplies' },
    'Patio, Lawn & Garden': { slug: 'Patio, Lawn & Garden', name: 'Garden & Patio' },
    'Baby': { slug: 'Baby', name: 'Baby' },
    'Baby Products': { slug: 'Baby Products', name: 'Baby' },
    'Office Products': { slug: 'Office Products', name: 'Office' },
};

// Add helper to get navbar height
const getNavbarHeight = () => {
    return parseInt(
        getComputedStyle(document.documentElement)
            .getPropertyValue('--navbar-height')
            .slice(0, -2)
    );
};

export default function Home() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [processed, setProcessed] = useState(false);
    const catalogRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const newsletterRef = useRef<HTMLDivElement>(null);
    const paginationRef = useRef<HTMLDivElement>(null);

    // Use useCategoryStats hook to fetch category data
    const { data: categoryStats, isLoading } = useCategoryStats({
        page: 1,
        page_size: 50,
        sort_by: 'count',
        sort_order: 'desc'
    });

    // Process after category data has loaded — only when data first loads or explicitly changes
    useEffect(() => {
        // Skip if currently loading or data has already been processed
        if (isLoading || processed || !categoryStats || !categoryStats.product_groups) {
            return;
        }

        try {
            // Convert product_groups data to category list
            const productGroups = categoryStats.product_groups;

            // Convert object to array, filter categories with count > 50, sort by count
            const sortedCategories = Object.entries(productGroups)
                .filter(([groupName, count]) => count > 50 && !HIDDEN_CATEGORIES.has(groupName))
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8) // Take top 8
                .map(([groupName]) => {
                    // Use the original groupName as slug to stay consistent with API params
                    const slug = groupName;

                    // Get display name from mapping, fall back to raw category name
                    const displayName = productGroupToCategoryMapping[groupName]?.name || groupName;

                    return {
                        name: displayName,
                        slug: slug
                    };
                });

            setCategories(sortedCategories);
            // Mark as processed
            setProcessed(true);
        }
        catch {
            // Mark as processed on error to avoid retrying
            setProcessed(true);
        }
    }, [isLoading, categoryStats, processed]);

    // Add scroll handling effect
    useEffect(() => {
        const handleScroll = () => {
            if (!sidebarRef.current || !mainContentRef.current || !catalogRef.current || !newsletterRef.current || !paginationRef.current) return;

            const sidebarElem = sidebarRef.current;
            const catalogRect = catalogRef.current.getBoundingClientRect();
            const mainContentRect = mainContentRef.current.getBoundingClientRect();
            const sidebarRect = sidebarElem.getBoundingClientRect();
            const newsletterRect = newsletterRef.current?.getBoundingClientRect();
            const paginationRect = paginationRef.current?.getBoundingClientRect();

            // Get navbar height from CSS variable
            const topOffset = getNavbarHeight();

            // Calculate parent container position
            const containerTop = catalogRect.top + window.scrollY;
            const _newsletterTop = newsletterRect ? newsletterRect.top + window.scrollY : Infinity;
            const paginationTop = paginationRect ? paginationRect.top + window.scrollY : Infinity;

            // Calculate sidebar height and current scroll position
            const sidebarHeight = sidebarRect.height;
            const scrollY = window.scrollY;

            // Calculate actual height of main content area
            const mainContentHeight = mainContentRect.height;

            // Ensure sidebar does not overflow the bottom of the main content area or the top of the pagination area
            const BUFFER = 20; // Increase buffer to 20px
            const maxTop = Math.min(
                mainContentHeight - sidebarHeight,
                paginationTop + window.scrollY - containerTop - topOffset - BUFFER
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

    return (
        <div className="relative min-h-screen w-full overflow-x-clip">
            <div className="flex max-w-[1800px] mx-auto w-full">
                {/* Left sidebar navigation */}
                <div className="hidden lg:block w-[240px] relative" ref={catalogRef}>
                    <div
                        ref={sidebarRef}
                        className="w-[240px] bg-white shadow-sm border-r border-gray-100 z-40"
                        style={{
                            minHeight: 'calc(100vh - 64px)',
                            willChange: 'transform'
                        }}
                    >
                        <div className="p-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
                            <CategoryNavigation useAnchorLinks={true} />
                        </div>
                    </div>
                </div>

                {/* Right main content area */}
                <main ref={mainContentRef} className="flex-1 min-h-screen w-full">
                    <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
                        {/* Top hero section */}
                        <HeroSection />

                        {/* Flash deals section */}
                        <FeaturedDeals />

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-4 text-sm text-gray-500 bg-white">
                                    Recommended for you
                                </span>
                            </div>
                        </div>

                        {/* Category sections — populated with API data */}
                        {categories.map((category) => (
                            <CategoryProducts
                                key={category.slug}
                                id={`category-${category.slug}`}
                                title={category.name}
                                slug={category.slug}
                                className="mb-8"
                            />
                        ))}

                        {/* Pagination area */}
                        <div ref={paginationRef} className="mb-8">
                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-4 text-sm text-gray-500 bg-white">
                                        End of products
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Email subscription component */}
                        <div ref={newsletterRef}>
                            <NewsletterSubscribe />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
} 