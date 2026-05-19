import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useCategoryStats } from '@/lib/hooks';


type ProductCategoryNavProps = {
    selectedCategory: string;
    onCategorySelect: (category: string) => void;
    displayMode?: 'scroll' | 'expand'; // Display mode: scroll-scroll mode, expand-expand/collapse mode
};

// Define API response type
interface BrowseNode {
    name?: string;
    count?: number;
}

interface CategoryStatsResponse {
    data: {
        product_groups: Record<string, number>;
        browse_nodes?: Record<string, BrowseNode>;
    };
}

// Animation variant configuration
const variants = {
    container: {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    },
    item: {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
        hover: { scale: 1.05, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }
    }
};

// Group categories alphabetically
const groupCategoriesByAlphabet = (categories: Array<{ name: string, count: number }>) => {
    const groups: Record<string, Array<{ name: string, count: number }>> = {};

    // Group categories by first letter
    categories.forEach(category => {
        // Get first letter and convert to uppercase
        const firstLetter = category.name.charAt(0).toUpperCase();

        // If letter group doesn't exist, create it
        if (!groups[firstLetter]) {
            groups[firstLetter] = [];
        }
        // Add category to corresponding letter group
        groups[firstLetter].push(category);
    });

    // Sort alphabetically
    return Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([letter, categories]) => ({
            letter,
            categories
        }));
};

// Alphabetical index component
const _AlphabetIndex = ({
    groups,
    onSelectLetter,
    activeLetter
}: {
    groups: Array<{ letter: string, categories: Array<{ name: string, count: number }> }>,
    onSelectLetter: (letter: string) => void,
    activeLetter: string | null
}) => {
    return (
        <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-200 dark:border-gray-700">
            <div className="flex overflow-x-auto py-3 px-4 no-scrollbar">
                {groups.map(({ letter }) => (
                    <button
                        key={letter}
                        className={`
                            min-w-[36px] h-9 flex items-center justify-center text-sm font-medium 
                            rounded-md mx-1 transition-colors duration-200
                            ${activeLetter === letter
                                ? 'bg-indigo-100 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}
                        `}
                        onClick={() => onSelectLetter(letter)}
                    >
                        {letter}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Category group component
const _CategoryGroups = ({
    groups,
    selectedCategory,
    onCategorySelect
}: {
    groups: Array<{ letter: string, categories: Array<{ name: string, count: number }> }>,
    selectedCategory: string,
    onCategorySelect: (category: string) => void
}) => {
    return (
        <div className="px-4 pb-8 overflow-y-auto">
            {groups.map(({ letter, categories }) => (
                <div key={letter} id={`group-${letter}`} className="mb-6">
                    <h3 className="text-lg font-bold mb-3 sticky top-[60px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm py-2 z-[5]">
                        {letter}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map(category => (
                            <motion.button
                                key={category.name}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`
                                    px-3 py-2 rounded-lg text-sm font-medium 
                                    transition-all duration-200 flex items-center justify-between
                                    ${selectedCategory === category.name
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                                    }
                                `}
                                onClick={() => onCategorySelect(category.name)}
                            >
                                <span className="truncate flex-1 text-left">{category.name}</span>
                                <span className="ml-1 text-xs opacity-70 flex-shrink-0">({category.count})</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export function ProductCategoryNav({
    selectedCategory,
    onCategorySelect,
    displayMode = 'scroll' // Default to scroll mode
}: ProductCategoryNavProps) {
    const [showAll, setShowAll] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    // Use useRef to remember last category set via click
    const lastSelectedCategoryRef = useRef('');
    // Adda ref to mark whether the component is mounted
    const isMountedRef = useRef(false);

    // Read category parameter from URL
    const categoryFromUrl = searchParams.get('category') || searchParams.get('product_groups') || '';

    // Simplify logic: always use selectedCategory passed by parent as current selection
    // No longer differentiating category pages, unified handling
    const actualSelectedCategory = selectedCategory;

    // Update category from URL only on initial mount to avoid circular calls
    useEffect(() => {
        // If already mounted, skip
        if (isMountedRef.current) return;

        // Mark as mounted
        isMountedRef.current = true;

        // Update parent component status only when URL has category param different from currently selected
        if (categoryFromUrl && categoryFromUrl !== selectedCategory) {
            onCategorySelect(categoryFromUrl);
        }
    }, [categoryFromUrl, selectedCategory, onCategorySelect]);

    const { data, isLoading, isError } = useCategoryStats({
        sort_by: 'count',
        sort_order: 'desc',
        page_size: 50
    });

    const [directData, setDirectData] = useState<CategoryStatsResponse | null>(null);
    const [directLoading, setDirectLoading] = useState(false);

    // Detect device type
    useEffect(() => {
        const checkDeviceType = () => {
            setIsMobile(window.innerWidth < 640);
            setIsTablet(window.innerWidth >= 640 && window.innerWidth < 768);
        };

        // First-load detection
        checkDeviceType();

        // Listen for window size changes
        window.addEventListener('resize', checkDeviceType);

        // Cleanup function
        return () => window.removeEventListener('resize', checkDeviceType);
    }, []);

    // If SWR fetch fails, use axios directly
    useEffect(() => {
        const fetchDirectlyIfNeeded = async () => {
            if ((isError || (!data && !isLoading)) && !directData && !directLoading) {
                try {
                    setDirectLoading(true);

                    const response = await axios.get('/api/categories/stats', {
                        params: {
                            sort_by: 'count',
                            sort_order: 'desc',
                            page: 1,
                            page_size: 50
                        }
                    });

                    setDirectData(response.data);
                } catch {
                } finally {
                    setDirectLoading(false);
                }
            }
        };

        fetchDirectlyIfNeeded();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isError, data, isLoading, directData]);

    // Get category data, prioritize SWR data, if not available use directly fetched data
    const categoryData = data || (directData?.data);
    const productGroups = categoryData?.product_groups || {};

    // Get category list and sort by product count
    const categories = Object.entries(productGroups)
        .map(([name, count]) => ({
            name,
            count: Number(count)
        }))
        .sort((a, b) => b.count - a.count);

    // Group categories alphabetically
    const _groupedCategories = useMemo(() => {
        return groupCategoriesByAlphabet(categories);
    }, [categories]);

    // number of categories to show — determined by device type
    const mobileLimit = 9;
    const tabletLimit = 12;
    const desktopLimit = 8;

    // animation configuration in expand mode
    const expandAnimationVariants = {
        hidden: {
            opacity: 0,
            height: 0,
            overflow: "hidden"
        },
        visible: {
            opacity: 1,
            height: "auto",
            overflow: "visible",
            transition: {
                duration: 0.3,
                ease: "easeInOut",
                staggerChildren: 0.05,
                when: "beforeChildren"
            }
        }
    };

    // Get initial display category count and extended categories
    const getInitialAndExtendedCategories = useCallback(() => {
        if (displayMode === 'expand') {
            // Desktop expand mode
            const initialCategories = categories.slice(0, desktopLimit);
            const extendedCategories = categories.slice(desktopLimit);

            return { initialCategories, extendedCategories };
        } else {
            // In scroll mode, determine based on device type
            if (isMobile) {
                const initialCategories = categories.slice(0, mobileLimit);
                const extendedCategories = categories.slice(mobileLimit);

                return { initialCategories, extendedCategories };
            } else if (isTablet) {
                const initialCategories = categories.slice(0, tabletLimit);
                const extendedCategories = categories.slice(tabletLimit);

                return { initialCategories, extendedCategories };
            } else {
                return { initialCategories: categories, extendedCategories: [] };
            }
        }
    }, [categories, displayMode, isMobile, isTablet, mobileLimit, tabletLimit, desktopLimit]);

    const { initialCategories, extendedCategories } = useMemo(
        () => getInitialAndExtendedCategories(),
        [getInitialAndExtendedCategories]
    );

    // Determine whether to show expand button based on device type and display mode
    const shouldShowExpandButton = useCallback(() => {
        // Show "more" button only on mobile/tablet in scroll mode
        if (displayMode === 'scroll') {
            if (isMobile && categories.length > mobileLimit) return true;
            if (isTablet && categories.length > tabletLimit) return true;

            return false;
        }

        // In expand mode, show "Expand/Collapse" button on desktop
        if (displayMode === 'expand' && categories.length > desktopLimit) {
            return true;
        }

        return false;
    }, [categories.length, isMobile, isTablet, mobileLimit, tabletLimit, desktopLimit, displayMode]);

    // Check if current category is in the initial or extended list
    const isInInitialList = useCallback((categoryName: string) => {
        return initialCategories.some(cat => cat.name === categoryName);
    }, [initialCategories]);

    const _isInExtendedList = useCallback((categoryName: string) => {
        return extendedCategories.some(cat => cat.name === categoryName);
    }, [extendedCategories]);

    // Return different layout styles based on displayMode
    const getContainerClassName = () => {
        if (displayMode === 'expand') {
            return "flex flex-wrap items-center gap-1.5";
        }

        return "flex items-center space-x-1.5 min-w-max";
    };

    // Get button style classes
    const getButtonClassName = (isSelected: boolean) => {
        return `
            h-7 px-3 py-1 rounded-full text-sm font-medium 
            flex items-center justify-center whitespace-nowrap
            ${isSelected
                ? 'bg-[#10b981] text-[#ffffff]'
                : 'bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb] dark:bg-[#1f2937] dark:text-[#e5e7eb] dark:hover:bg-[#374151]'
            }
        `;
    };

    // Handle click on "All" button
    const handleAllClick = useCallback(() => {
        // Remember this category selection
        lastSelectedCategoryRef.current = '';

        // Update parent component status first to ensure status sync
        onCategorySelect('');

        // Manipulate URL directly using simplest method
        if (typeof window !== 'undefined') {
            try {
                // Method 1: Replace URL directly, force update
                window.history.replaceState(
                    { as: '/product', url: '/product' },
                    '',
                    '/product'
                );

                // Method 2: Delay router.replace to ensure it is the last navigation executed
                setTimeout(() => {
                    router.replace('/product', { scroll: false });
                }, 50);
            } catch {
                // If error, use most direct approach
                window.location.href = '/product';
            }
        }
    }, [onCategorySelect, router]);

    // Handle category clickevent
    const handleCategoryClick = useCallback((category: string) => {
        // Record last category selected via click
        lastSelectedCategoryRef.current = category;


        // Update parent component status first to ensure status sync
        onCategorySelect(category);

        // Build new URL path - using categoryId parameter
        const newPath = category
            ? `/product/category/${encodeURIComponent(category)}`
            : '/product';

        // Manipulate URL directly using simplest method
        if (typeof window !== 'undefined') {
            // Cancel all possible navigation events
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
    }, [onCategorySelect, router]);

    // Toggle show more/less or navigate to categories page
    const toggleShowAll = useCallback(() => {
        if (displayMode === 'expand') {
            // directly toggle show status in expand mode
            setShowAll(!showAll);

            return;
        }

        if (isMobile || isTablet) {
            // Navigate to category page on mobile/tablet in scroll mode
            // Store current path (full URL) before navigating
            const currentPath = window.location.pathname + window.location.search;

            sessionStorage.setItem('prevPath', currentPath);

            // Navigate to category page and pass currently selected category
            const newPath = `/categories${actualSelectedCategory ? `?category=${encodeURIComponent(actualSelectedCategory)}` : ''}`;

            // Use browser API to update URL directly
            if (typeof window !== 'undefined') {
                window.history.replaceState(
                    { url: newPath, as: newPath, options: { shallow: true, scroll: false } },
                    '',
                    newPath
                );

                // Also call router.replace to ensure Next.js status update
                router.replace(newPath, { scroll: false });
            }
        } else {
            setShowAll(!showAll);
        }
    }, [isMobile, isTablet, showAll, router, actualSelectedCategory, displayMode]);

    if (isLoading || directLoading) {
        return (
            <div className="py-2">
                <div className="animate-pulse flex items-center space-x-1 overflow-x-auto">
                    {["home", "electronics", "fashion", "books", "toys", "beauty", "sports", "kitchen"].map((category) => (
                        <div key={`skeleton-${category}`} className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-16 md:w-20 flex-shrink-0" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="py-1">
            {/* Initial category list (always show) */}
            <motion.div
                className={getContainerClassName()}
                variants={variants.container}
                initial="hidden"
                animate="show"
            >
                {/* All categories button */}
                <motion.button
                    variants={variants.item}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={getButtonClassName(actualSelectedCategory === '')}
                    onClick={handleAllClick}
                >
                    <span className="mr-1">🏠</span>
                    All
                </motion.button>

                {/* Initial category button */}
                <AnimatePresence mode="popLayout">
                    {initialCategories.map((category) => (
                        <motion.button
                            key={category.name}
                            variants={variants.item}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                            className={getButtonClassName(actualSelectedCategory === category.name)}
                            onClick={() => handleCategoryClick(category.name)}
                        >
                            <span>{category.name}</span>
                        </motion.button>
                    ))}
                </AnimatePresence>

                {/* Expand/collapse button */}
                {shouldShowExpandButton() && (
                    <motion.button
                        variants={variants.item}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`
                            h-7 px-3 py-1 rounded-full text-sm font-medium 
                            flex items-center justify-center whitespace-nowrap
                            bg-[#dcfce7] text-[#16a34a] dark:bg-[#064e3b] dark:text-[#86efac]
                            hover:bg-[#10b981] hover:text-[#ffffff] dark:hover:bg-[#059669]
                            transition-colors duration-200
                        `}
                        onClick={toggleShowAll}
                    >
                        {displayMode === 'expand'
                            ? (showAll ? "Collapse ↑" : "Expand ↓")
                            : ((isMobile || isTablet) ? "More Categories ↓" : (showAll ? "Collapse ↑" : "Expand ↓"))}
                    </motion.button>
                )}
            </motion.div>

            {/* Extended category list (shown when expanded and showAll is true) */}
            {displayMode === 'expand' && extendedCategories.length > 0 && (
                <motion.div
                    className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-[#e5e7eb] dark:border-[#374151]"
                    initial="hidden"
                    animate={showAll ? "visible" : "hidden"}
                    variants={expandAnimationVariants}
                >
                    {extendedCategories.map((category, index) => (
                        <motion.button
                            key={category.name}
                            variants={{
                                hidden: { opacity: 0, y: 10 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                        delay: index * 0.03,
                                        type: "spring",
                                        stiffness: 300,
                                        damping: 24
                                    }
                                }
                            }}
                            whileHover={{ scale: 1.05, boxShadow: "0px 2px 4px rgba(0,0,0,0.1)" }}
                            whileTap={{ scale: 0.95 }}
                            className={getButtonClassName(actualSelectedCategory === category.name)}
                            onClick={() => handleCategoryClick(category.name)}
                        >
                            <span>{category.name}</span>
                        </motion.button>
                    ))}
                </motion.div>
            )}

            {/* Hint when currently selected category is out of visible range */}
            {displayMode === 'expand' &&
                actualSelectedCategory &&
                !isInInitialList(actualSelectedCategory) &&
                !showAll && (
                    <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Current Selection: </span>
                        <span className="ml-1 px-2 py-0.5 bg-[#dcfce7] text-[#16a34a] dark:bg-[#064e3b] dark:text-[#86efac] rounded-full">
                            {actualSelectedCategory}
                        </span>
                        <button
                            className="ml-2 text-[#10b981] hover:text-[#059669] dark:text-[#4ade80] dark:hover:text-[#86efac]"
                            onClick={toggleShowAll}
                        >
                            Expand to View ↓
                        </button>
                    </div>
                )}
        </div>
    );
} 