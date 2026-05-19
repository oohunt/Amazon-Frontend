"use client";

import { motion, useAnimation, useMotionValue, useTransform, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';

import { useCategoryStats } from '@/lib/hooks';

// Custom Category interface
interface Category {
    id: string;
    name: string;
    slug: string;
    count: number;
    icon?: React.ReactNode | string;
    emoji?: string; // Add emoji attribute
    color?: string;
}

// Addcomponent props interface, including useAnchorLinks option
interface CategoryNavigationProps {
    useAnchorLinks?: boolean; // Whether to use anchor links
}

// Product group to category mapping — includes PartnerBoost/MongoDB category names
const productGroupToCategoryMapping: Record<string, { slug: string, name: string }> = {
    // PartnerBoost categories (what we store in MongoDB)
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
    // Legacy Amazon PA-API categories (kept for backward compat)
    'Home': { slug: 'Home', name: 'Home & Kitchen' },
    'Kitchen': { slug: 'Kitchen', name: 'Kitchen' },
    'Apparel': { slug: 'Apparel', name: 'Apparel' },
    'Sports': { slug: 'Sports', name: 'Sports & Outdoors' },
    'Beauty': { slug: 'Beauty', name: 'Beauty & Care' },
    'Furniture': { slug: 'Furniture', name: 'Furniture' },
    'Shoes': { slug: 'Shoes', name: 'Shoes' },
    'Personal Computer': { slug: 'Personal Computer', name: 'Computers' },
    'Lawn & Patio': { slug: 'Lawn & Patio', name: 'Garden & Patio' },
    'Wireless': { slug: 'Wireless', name: 'Wireless Devices' },
    'Drugstore': { slug: 'Drugstore', name: 'Health & Household' },
    'Automotive Parts and Accessories': { slug: 'Automotive Parts and Accessories', name: 'Automotive' },
};

// Category icon mapping — using emoji instead of Lucide icons
const categoryIcons: Record<string, { emoji: string, color: string }> = {
    electronics: {
        emoji: '📱',
        color: 'from-[#5a8a9f] to-[#3d5a80]'
    },
    home: {
        emoji: '🏠',
        color: 'from-[#81a4c4] to-[#5a8a9f]'
    },
    kitchen: {
        emoji: '☕',
        color: 'from-[#6b8ea1] to-[#4d6d85]'
    },
    apparel: {
        emoji: '👕',
        color: 'from-[#5a8a9f] to-[#3d5a80]'
    },
    sports: {
        emoji: '🏋️',
        color: 'from-[#4d6d85] to-[#3d5a80]'
    },
    beauty: {
        emoji: '✨',
        color: 'from-[#81a4c4] to-[#5a8a9f]'
    },
    furniture: {
        emoji: '🛋️',
        color: 'from-[#6b8ea1] to-[#4d6d85]'
    },
    shoes: {
        emoji: '👟',
        color: 'from-[#5a8a9f] to-[#3d5a80]'
    },
    computers: {
        emoji: '💻',
        color: 'from-[#4d6d85] to-[#3d5a80]'
    },
    'personal computer': {
        emoji: '💻',
        color: 'from-[#4d6d85] to-[#3d5a80]'
    },
    'lawn & patio': {
        emoji: '🌿',
        color: 'from-[#6b8ea1] to-[#4d6d85]'
    },
    garden: {
        emoji: '🌿',
        color: 'from-[#6b8ea1] to-[#4d6d85]'
    },
    wireless: {
        emoji: '📶',
        color: 'from-[#5a8a9f] to-[#3d5a80]'
    },
    drugstore: {
        emoji: '💊',
        color: 'from-[#81a4c4] to-[#5a8a9f]'
    },
    health: {
        emoji: '💊',
        color: 'from-[#81a4c4] to-[#5a8a9f]'
    },
    automotive: {
        emoji: '🚗',
        color: 'from-[#7f8c8d] to-[#2c3e50]'
    },
    'automotive parts and accessories': {
        emoji: '🚗',
        color: 'from-[#7f8c8d] to-[#2c3e50]'
    },
    grocery: {
        emoji: '🛒',
        color: 'from-[#5a8a9f] to-[#3d5a80]'
    },
    'sports & fitness': {
        emoji: '🏀',
        color: 'from-[#4d6d85] to-[#3d5a80]'
    },
    gaming: {
        emoji: '🎮',
        color: 'from-[#5a8a9f] to-[#3d5a80]'
    },
    'baby & kids': {
        emoji: '👶',
        color: 'from-[#81a4c4] to-[#5a8a9f]'
    },
    fashion: {
        emoji: '👗',
        color: 'from-[#5a8a9f] to-[#3d5a80]'
    },
    travel: {
        emoji: '✈️',
        color: 'from-[#6b8ea1] to-[#4d6d85]'
    },
    gifts: {
        emoji: '🎁',
        color: 'from-[#5a8a9f] to-[#3d5a80]'
    },
    // PartnerBoost / MongoDB category names (lowercase)
    'clothing, shoes & jewelry': { emoji: '👗', color: 'from-[#c06c84] to-[#6c5b7b]' },
    'home & kitchen': { emoji: '🏠', color: 'from-[#81a4c4] to-[#5a8a9f]' },
    'sports & outdoors': { emoji: '⚽', color: 'from-[#4d6d85] to-[#3d5a80]' },
    'beauty & personal care': { emoji: '✨', color: 'from-[#f8a5c2] to-[#c06c84]' },
    'toys & games': { emoji: '🧸', color: 'from-[#f9ca24] to-[#f0932b]' },
    books: { emoji: '📚', color: 'from-[#6a89cc] to-[#4a69bd]' },
    'health & household': { emoji: '💊', color: 'from-[#81a4c4] to-[#5a8a9f]' },
    'tools & home improvement': { emoji: '🔧', color: 'from-[#7f8c8d] to-[#2c3e50]' },
    'pet supplies': { emoji: '🐾', color: 'from-[#f9ca24] to-[#f0932b]' },
    'patio, lawn & garden': { emoji: '🌿', color: 'from-[#6b8ea1] to-[#4d6d85]' },
    'baby products': { emoji: '👶', color: 'from-[#81a4c4] to-[#5a8a9f]' },
    baby: { emoji: '👶', color: 'from-[#81a4c4] to-[#5a8a9f]' },
    'office products': { emoji: '💼', color: 'from-[#6b8ea1] to-[#4d6d85]' },
};

export function CategoryNavigation({ useAnchorLinks = false }: CategoryNavigationProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [_activeTab, _setActiveTab] = useState<string | null>(null);
    const pathname = usePathname();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const _controls = useAnimation();
    const _x = useMotionValue(0);
    const _dragStart = useRef(0);
    const _dragEnd = useRef(0);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [needNavigation, setNeedNavigation] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [activeCardIndex, setActiveCardIndex] = useState(0);
    const [_scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);
    const lastScrollPosition = useRef(0);
    const [activePointIndex, setActivePointIndex] = useState<number>(0);
    const router = useRouter();

    // Use ref to track processed data, avoid reprocessing
    const processedDataRef = useRef<boolean>(false);

    // Addref for storing card position
    const cardPositions = useRef<number[]>([]);

    // update currently active card index — optimize performance and accuracy
    const updateActiveCardIndex = useCallback(() => {
        if (!scrollContainerRef.current || categories.length === 0) return;

        const container = scrollContainerRef.current;
        const { scrollLeft, clientWidth } = container;
        const scrollCenter = scrollLeft + clientWidth / 2;

        // Get all card elements
        const cards = Array.from(container.querySelectorAll('.snap-center'));

        // Find card closest to center point
        let closestCardIndex = 0;
        let minDistance = Infinity;

        cards.forEach((card, index) => {
            const cardElement = card as HTMLElement;
            const cardCenter = cardElement.offsetLeft + cardElement.offsetWidth / 2;
            const distance = Math.abs(scrollCenter - cardCenter);

            if (distance < minDistance) {
                minDistance = distance;
                closestCardIndex = index;
            }
        });

        // Update status only when index changes to reduce unnecessary renders
        if (closestCardIndex !== activeCardIndex) {
            setActiveCardIndex(closestCardIndex);
        }
    }, [categories.length, activeCardIndex]);

    // Check if navigation controls needed (when content width exceeds container width)
    const checkIfNavigationNeeded = useCallback(() => {
        if (!scrollContainerRef.current) return;

        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        const needsNav = scrollWidth > clientWidth + 10; // Add a small margin

        setNeedNavigation(needsNav);

        // Check if mobile device
        const newIsMobile = window.innerWidth < 768;

        setIsMobile(newIsMobile);

        // If navigation needed, also check arrow status
        if (needsNav) {
            const { scrollLeft } = scrollContainerRef.current;

            setShowLeftArrow(scrollLeft > 20);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
        }
    }, []);

    // Detect scroll container position, update arrow show status
    const handleScroll = useCallback(() => {
        if (!scrollContainerRef.current || !needNavigation) return;

        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

        setShowLeftArrow(scrollLeft > 20);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }, [needNavigation]);

    // Use useCategoryStats hook to fetch category data
    const { data: categoryStats, isLoading, isError } = useCategoryStats({
        page: 1,
        page_size: 50,
        sort_by: 'count',
        sort_order: 'desc'
    });

    // Use useScroll hook to listen for scroll container position
    const { scrollXProgress } = useScroll({
        container: scrollContainerRef,
        layoutEffect: false
    });

    // Add scrollXProgress event listener for real-time direction and active index updates
    useMotionValueEvent(scrollXProgress, "change", (_latest) => {
        if (!scrollContainerRef.current) return;

        // update scroll direction
        const currentScrollPosition = scrollContainerRef.current.scrollLeft;

        if (currentScrollPosition > lastScrollPosition.current) {
            setScrollDirection('right');
        } else if (currentScrollPosition < lastScrollPosition.current) {
            setScrollDirection('left');
        }
        lastScrollPosition.current = currentScrollPosition;

        // Real-time update active index
        updateActiveCardIndex();
    });

    // Map scroll progress to dot indicator active progress, optimize mapping function
    const indicatorProgress = useTransform(
        scrollXProgress,
        (progress) => {
            if (!scrollContainerRef.current || categories.length <= 1) return 0;

            const scrollWidth = scrollContainerRef.current.scrollWidth;
            const clientWidth = scrollContainerRef.current.clientWidth;
            const maxScroll = scrollWidth - clientWidth;

            // Convert progress value (0-1) to actual scrollLeft value
            const actualScrollLeft = progress * maxScroll;

            // Calculate current active card index and progress
            let activeIndex = 0;
            let progressInCard = 0;

            for (let i = 0; i < cardPositions.current.length - 1; i++) {
                const start = cardPositions.current[i];
                const end = cardPositions.current[i + 1];

                // Expand judgment range for smoother transitions
                const cardWidth = end - start;
                const thresholdStart = start - cardWidth * 0.1;
                const thresholdEnd = end + cardWidth * 0.1;

                if (actualScrollLeft >= thresholdStart && actualScrollLeft < thresholdEnd) {
                    activeIndex = i;
                    // Calculate precise progress within card, add boundary handling
                    progressInCard = Math.max(0, Math.min(1, (actualScrollLeft - start) / (end - start)));
                    break;
                }
            }

            // If already scrolled to the last card
            if (cardPositions.current.length > 0 &&
                actualScrollLeft >= cardPositions.current[cardPositions.current.length - 1]) {
                activeIndex = cardPositions.current.length - 1;
                progressInCard = 1;
            }

            return activeIndex + progressInCard;
        }
    );

    // Convert indicatorProgress to integer index for highlighting active dot
    const _currentActiveIndex = useTransform(indicatorProgress, (progress) => Math.round(progress));

    // Use useMotionValueEvent to listen for indicatorProgress changes and update activePointIndex
    useMotionValueEvent(indicatorProgress, "change", (latest) => {
        const roundedIndex = Math.round(latest);

        if (roundedIndex !== activePointIndex) {
            setActivePointIndex(roundedIndex);
        }
    });

    // Changed to use regular function instead of React Hooks inside loop
    const _calculateDotScale = (progress: number, index: number) => {
        const diff = Math.abs(progress - index);

        return diff <= 0.5 ? 1.3 - (0.3 * (diff * 2)) : 1;
    };

    const _calculateOpacity = (progress: number, index: number) => {
        const diff = Math.abs(progress - index);

        return diff < 0.8 ? Math.max(0, 1 - (diff / 0.8)) : 0;
    };

    const _calculateScaleX = (progress: number, index: number) => {
        const diff = Math.abs(progress - index);

        return diff < 0.8 ? Math.max(0, 1 - (diff / 0.8)) : 0;
    };

    const _calculateButtonScale = (progress: number, index: number) => {
        const diff = Math.abs(progress - index);

        return diff <= 0.5 ? 1 + (0.15 * (1 - diff * 2)) : 1;
    };

    const _getDotColor = (activeIndex: number, index: number) => {
        return activeIndex === index ? 'var(--color-primary)' : 'var(--color-gray-300)';
    };

    // Use useTransform to transform indicatorProgress value
    const _transformedIndicatorProgress = useTransform(indicatorProgress, value => value);

    // Listen for window size changes
    useEffect(() => {
        const handleResize = () => {
            checkIfNavigationNeeded();
        };

        // Initial check
        handleResize();

        // Addwindow resize listener
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [checkIfNavigationNeeded]); // Add checkIfNavigationNeeded as dependency

    // Handle API-returned category data — rewrite dependency handling logic
    useEffect(() => {
        // Skip reprocessing if data is loading or already processed and unchanged
        if (isLoading || (processedDataRef.current && !isError)) {
            return;
        }

        // If error, set error status
        if (isError) {
            setError('Unable to load categories. Please try again later.');
            processedDataRef.current = true;

            return;
        }

        // Data loaded and not yet processed
        if (categoryStats && categoryStats.product_groups && !processedDataRef.current) {
            try {
                // Convert product_groups data to category list
                const productGroups = categoryStats.product_groups;

                // Convert object to array, filter categories with count > 50, sort by count
                const sortedCategories = Object.entries(productGroups)
                    .filter(([_groupName, count]) => count > 50)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8) // Take top 8
                    .map(([groupName, count], index) => {
                        // Use the original groupName as slug to stay consistent with API params
                        const slug = groupName;

                        // Get display name from mapping, fall back to raw category name
                        const displayName = productGroupToCategoryMapping[groupName]?.name || groupName;

                        // Try to get icon and color from mapping
                        // Use lowercase original category name as key to match icons
                        const slugKey = groupName.toLowerCase();
                        const iconInfo = categoryIcons[slugKey] ||
                            // Try to use mapped name as key
                            categoryIcons[productGroupToCategoryMapping[groupName]?.slug.toLowerCase()] ||
                        // Default icon
                        {
                            emoji: '🛒',
                            color: 'from-gray-400 to-gray-600'
                        };

                        return {
                            id: index.toString(),
                            name: displayName,
                            slug: slug, // Use original category name as slug
                            count: count,
                            emoji: iconInfo.emoji,
                            color: iconInfo.color
                        };
                    });

                setCategories(sortedCategories);
                setError(null);
                processedDataRef.current = true;
            } catch {
                setError('Unable to load categories. Please try again later.');
                processedDataRef.current = true;
            }
        }
    }, [isLoading, isError, categoryStats]);

    // Add scroll event listener
    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;

        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
            scrollContainer.addEventListener('scroll', updateActiveCardIndex);

            // Add touch event listeners to optimize mobile experience
            scrollContainer.addEventListener('touchend', updateActiveCardIndex);
            // Add scroll end event listener
            let scrollTimeout: ReturnType<typeof setTimeout>;
            const handleScrollEnd = () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    updateActiveCardIndex();
                }, 150); // Update 150ms after scrolling stops
            };

            scrollContainer.addEventListener('scroll', handleScrollEnd);

            // initialize navigation check
            checkIfNavigationNeeded();

            // delay once after initialization to update indicator status
            setTimeout(updateActiveCardIndex, 300);
        }

        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
                scrollContainer.removeEventListener('scroll', updateActiveCardIndex);
                scrollContainer.removeEventListener('touchend', updateActiveCardIndex);
                scrollContainer.removeEventListener('scroll', function handleScrollEnd() { });
            }
        };
    }, [handleScroll, updateActiveCardIndex, checkIfNavigationNeeded]); // Add checkIfNavigationNeeded as dependency

    // Update active card index when category data changes
    useEffect(() => {
        if (categories.length > 0) {
            // Update indicator status once after category data loads
            setTimeout(updateActiveCardIndex, 300);
        }
    }, [categories, updateActiveCardIndex]); // Add updateActiveCardIndex dependency

    // Check if a category is activated
    const isActiveCategory = (slug: string) => {
        // Check current path
        if (pathname === '/') {
            // On home page, check if current scroll position is in corresponding category area
            const categoryElement = document.getElementById(`category-${slug}`);

            if (categoryElement) {
                const rect = categoryElement.getBoundingClientRect();
                // Account for top navbar height (120px) and some tolerance
                const topOffset = 120;
                const bottomOffset = window.innerHeight / 2;

                return rect.top >= -topOffset && rect.top <= bottomOffset;
            }

            return false;
        } else if (pathname.startsWith('/product')) {
            // On product page, check URL parameters
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const productGroups = urlParams.get('product_groups');

                return productGroups === slug;
            } catch {
                return false;
            }
        }

        return false;
    };

    // Addscroll listener
    useEffect(() => {
        if (useAnchorLinks) {
            const handleScroll = () => {
                // Force re-render to update active status
                setCategories([...categories]);
            };

            // Use throttle function to limit scroll event frequency
            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            const throttledHandleScroll = () => {
                if (!timeoutId) {
                    timeoutId = setTimeout(() => {
                        handleScroll();
                        timeoutId = null;
                    }, 100); // Trigger at most once every 100ms
                }
            };

            window.addEventListener('scroll', throttledHandleScroll);

            return () => {
                window.removeEventListener('scroll', throttledHandleScroll);
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
            };
        }
    }, [categories, useAnchorLinks]);

    // Handle category click
    const handleCategoryClick = (slug: string) => {
        setActiveCardIndex(categories.findIndex(c => c.slug === slug));

        // If not using anchor links, use router navigation
        if (!useAnchorLinks) {
            // Use new URL format
            const newPath = `/product/category/${encodeURIComponent(slug)}`;

            router.replace(newPath, { scroll: false });

            return;
        }

        // Use anchor links
        if (typeof window !== 'undefined') {
            // Find target element in current page
            const targetElement = document.getElementById(`category-${slug}`);

            if (targetElement) {
                // Smooth scroll to target element
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    };

    // Scroll to the left
    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            const containerWidth = scrollContainerRef.current.clientWidth;
            const scrollAmount = containerWidth * 0.8; // 80% of scroll container width
            const targetPosition = scrollContainerRef.current.scrollLeft - scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: Math.max(0, targetPosition),
                behavior: 'smooth'
            });
        }
    };

    // Scroll to the right
    const scrollRight = () => {
        if (scrollContainerRef.current) {
            const containerWidth = scrollContainerRef.current.clientWidth;
            const scrollAmount = containerWidth * 0.8; // 80% of scroll container width
            const maxScroll = scrollContainerRef.current.scrollWidth - containerWidth;
            const targetPosition = scrollContainerRef.current.scrollLeft + scrollAmount;

            scrollContainerRef.current.scrollTo({
                left: Math.min(maxScroll, targetPosition),
                behavior: 'smooth'
            });
        }
    };

    // Scroll to specified card
    const _scrollToCard = (index: number) => {
        if (!scrollContainerRef.current || !categories[index]) return;

        const container = scrollContainerRef.current;
        const cards = Array.from(container.querySelectorAll('.snap-center'));

        if (cards[index]) {
            const card = cards[index] as HTMLElement;
            // Calculate target scroll position to center card
            const cardWidth = card.offsetWidth;
            const containerWidth = container.clientWidth;
            const scrollPosition = card.offsetLeft - (containerWidth / 2 - cardWidth / 2);

            // Scroll to target position
            container.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });

            // update active index
            setActiveCardIndex(index);
        }
    };

    // Addtouch event handling, optimize mobile experience
    useEffect(() => {
        const container = scrollContainerRef.current;

        if (!container) return;

        const handleTouchStart = () => {
            // Record scroll start position
            lastScrollPosition.current = container.scrollLeft;
        };

        const handleTouchEnd = () => {
            // Update active index on touch end
            updateActiveCardIndex();
        };

        container.addEventListener('touchstart', handleTouchStart);
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [updateActiveCardIndex]); // Add dependency

    // Calculate position of each card
    useEffect(() => {
        if (!scrollContainerRef.current || categories.length === 0) return;

        const container = scrollContainerRef.current;
        const cards = Array.from(container.querySelectorAll('.snap-center'));
        const positions: number[] = [];

        cards.forEach((card) => {
            const cardElement = card as HTMLElement;

            positions.push(cardElement.offsetLeft);
        });

        cardPositions.current = positions;

        // Update active card index once on initialization
        updateActiveCardIndex();
    }, [categories, updateActiveCardIndex]); // Add updateActiveCardIndex dependency

    // Check if inside sidebar
    const _isSidebar = typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false;

    useEffect(() => {
        const checkIsSidebar = () => {
            if (typeof window !== 'undefined') {
                const newIsSidebar = window.matchMedia('(min-width: 1024px)').matches;

                setIsMobile(!newIsSidebar);
            }
        };

        // Initial check
        checkIsSidebar();

        // Addwindow resize listener
        window.addEventListener('resize', checkIsSidebar);

        return () => {
            window.removeEventListener('resize', checkIsSidebar);
        };
    }, []);

    if (isLoading) {
        return (
            <div className="relative my-6 lg:my-0 px-2 md:px-4 lg:px-0">
                <h2 className="text-2xl font-bold mb-4 text-center lg:hidden bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Popular Categories</h2>
                <div className="overflow-hidden">
                    <div className="flex lg:flex-col space-x-4 lg:space-x-0 lg:space-y-3 py-2">
                        {Array.from({ length: 8 }).map((_, i) => {
                            // Generate unique identifier, avoid using index as key
                            const uniqueId = `skeleton-${i}-${Math.random().toString(36).substring(2, 9)}`;

                            return (
                                <div key={uniqueId} className="flex-shrink-0 w-32 md:w-40 lg:w-full">
                                    <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl p-4 animate-pulse h-40 lg:h-16">
                                        <div className="w-16 h-16 mx-auto lg:hidden bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
                                        <div className="h-4 w-20 lg:w-full mx-auto bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="my-6 lg:my-0 text-center px-4 lg:px-0">
                <h2 className="text-2xl font-bold mb-4 lg:hidden text-primary">Popular Categories</h2>
                <div className="p-6 bg-red-50/80 dark:bg-red-900/20 backdrop-blur-md rounded-xl shadow-lg border border-red-100 dark:border-red-800/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-error mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-error dark:text-error mb-4 font-medium">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-error text-white rounded-full hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-error focus:ring-opacity-50"
                    >
                        Reload
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative my-6 lg:my-0">
            <div className="absolute left-0 right-0 h-48 lg:h-full bg-gray-100 dark:bg-gray-800/20 -z-10 opacity-50" />

            {/* Mobile and tablet title, hidden on large screens */}
            <h2 className="text-2xl font-bold mb-4 text-center lg:hidden text-primary-dark dark:text-white">Popular Categories</h2>

            <div className="relative px-3 md:px-4 lg:px-0">
                {/* Left scroll button - visible in non-desktop mode */}
                <AnimatePresence>
                    {needNavigation && showLeftArrow && !isMobile && (
                        <motion.button
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 p-1.5 md:p-2 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-primary-dark dark:text-white hover:text-primary dark:hover:text-primary-light focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-light/50 lg:hidden"
                            onClick={scrollLeft}
                            aria-label="Scroll left"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Right scroll button - visible in non-desktop mode */}
                <AnimatePresence>
                    {needNavigation && showRightArrow && !isMobile && (
                        <motion.button
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white dark:bg-gray-800 p-1.5 md:p-2 rounded-full shadow-md border border-gray-200 dark:border-gray-700 text-primary-dark dark:text-white hover:text-primary dark:hover:text-primary-light focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary-light/50 lg:hidden"
                            onClick={scrollRight}
                            aria-label="Scroll right"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </motion.button>
                    )}
                </AnimatePresence>

                {/* Add gradient edge masks to solve the cutoff feeling - visible in non-desktop mode */}
                {needNavigation && (
                    <div className="lg:hidden">
                        <div className="absolute left-0 top-2 bottom-2 w-8 sm:w-12 bg-gradient-to-r from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 dark:to-transparent pointer-events-none z-10" />
                        <div className="absolute right-0 top-2 bottom-2 w-8 sm:w-12 bg-gradient-to-l from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 dark:to-transparent pointer-events-none z-10" />
                    </div>
                )}

                {/* Category list - scrollable in non-desktop, vertical list in desktop */}
                <div id="categoriesContainer"
                    ref={scrollContainerRef}
                    className={`
                        overflow-x-auto lg:overflow-x-visible overflow-y-hidden lg:overflow-y-visible 
                        scrollbar-hide relative pb-4 lg:pb-0
                        flex lg:flex-col whitespace-nowrap space-x-4 lg:space-x-0 lg:space-y-2
                    `}
                    onScroll={handleScroll}
                >
                    {/* All Categories button */}
                    <motion.div
                        key="all-categories"
                        className="flex-shrink-0 w-32 sm:w-40 lg:w-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.5,
                            delay: 0.05,
                            ease: [0.4, 0.0, 0.2, 1]
                        }}
                        whileHover={{ y: isMobile ? -8 : 0, transition: { duration: 0.3, type: "spring", stiffness: 300 } }}
                        whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                    >
                        {useAnchorLinks ? (
                            <Link
                                href="/product"
                                className="block cursor-pointer w-full text-left"
                                aria-label="View all categories"
                            >
                                <motion.div
                                    className={`
                                        relative overflow-hidden rounded-xl lg:rounded-md
                                        ${!isMobile ? 'h-40 sm:h-44 md:h-48 lg:h-auto lg:py-2.5' : 'h-40 sm:h-44 md:h-48'}
                                        bg-gray-100 dark:bg-gray-800/60
                                        border border-gray-200 dark:border-gray-700
                                        p-3 sm:p-4 lg:py-2.5 lg:px-3 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row items-center lg:items-center lg:justify-start w-full
                                    `}
                                    whileHover={{
                                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                                        transition: { duration: 0.3 }
                                    }}
                                >
                                    {/* Icon */}
                                    <motion.div
                                        className="relative w-9 h-9 sm:w-10 sm:h-10 lg:w-9 lg:h-9 rounded-full mb-3 sm:mb-4 lg:mb-0 lg:mr-3 flex items-center justify-center bg-white dark:bg-gray-700 text-primary dark:text-primary-light shadow-sm group-hover:shadow-md transition-all duration-300"
                                        whileHover={{
                                            scale: isMobile ? 1.1 : 1.05,
                                            transition: { duration: 0.2 }
                                        }}
                                    >
                                        <span className="text-xl lg:text-lg">🔍</span>
                                    </motion.div>

                                    {/* Text */}
                                    <motion.h3
                                        className="text-center lg:text-left font-medium text-xs sm:text-sm md:text-base lg:text-sm text-primary-dark dark:text-white transition-colors lg:flex-1"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.2 }}
                                    >
                                        All Categories
                                    </motion.h3>
                                </motion.div>
                            </Link>
                        ) : (
                            <Link
                                href="/product"
                                className={`block ${isActiveCategory('all') ? 'pointer-events-none' : ''}`}
                            >
                                <motion.div
                                    className={`
                                        relative overflow-hidden rounded-xl lg:rounded-md
                                        ${!isMobile ? 'h-40 sm:h-44 md:h-48 lg:h-auto lg:py-2.5' : 'h-40 sm:h-44 md:h-48'}
                                        bg-gray-100 dark:bg-gray-800/60
                                        border border-gray-200 dark:border-gray-700
                                        p-3 sm:p-4 lg:py-2.5 lg:px-3 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row items-center lg:items-center lg:justify-start w-full
                                    `}
                                    whileHover={{
                                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                                        transition: { duration: 0.3 }
                                    }}
                                >
                                    {/* Icon */}
                                    <motion.div
                                        className="relative w-9 h-9 sm:w-10 sm:h-10 lg:w-9 lg:h-9 rounded-full mb-3 sm:mb-4 lg:mb-0 lg:mr-3 flex items-center justify-center bg-white dark:bg-gray-700 text-primary dark:text-primary-light shadow-sm group-hover:shadow-md transition-all duration-300"
                                        whileHover={{
                                            scale: isMobile ? 1.1 : 1.05,
                                            transition: { duration: 0.2 }
                                        }}
                                    >
                                        <span className="text-xl lg:text-lg">🔍</span>
                                    </motion.div>

                                    {/* Text */}
                                    <motion.h3
                                        className="text-center lg:text-left font-medium text-xs sm:text-sm md:text-base lg:text-sm text-primary-dark dark:text-white transition-colors lg:flex-1"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.2 }}
                                    >
                                        All Categories
                                    </motion.h3>
                                </motion.div>
                            </Link>
                        )}
                    </motion.div>

                    {/* Dynamic categories */}
                    {categories.map((category, index) => (
                        <motion.div
                            key={category.slug}
                            className="flex-shrink-0 w-32 sm:w-40 lg:w-full group"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.5,
                                delay: index * 0.08,
                                ease: [0.4, 0.0, 0.2, 1]
                            }}
                            whileHover={{ y: isMobile ? -8 : 0, transition: { duration: 0.3, type: "spring", stiffness: 300 } }}
                            whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
                        >
                            {useAnchorLinks ? (
                                <button
                                    className={`block cursor-pointer w-full text-left ${isActiveCategory(category.slug) ? 'pointer-events-none' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCategoryClick(category.slug);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleCategoryClick(category.slug);
                                        }
                                    }}
                                    aria-label={`View ${category.name} category`}
                                >
                                    <motion.div
                                        className={`
                                            relative overflow-hidden rounded-xl lg:rounded-md
                                            ${!isMobile ? 'h-40 sm:h-44 md:h-48 lg:h-auto lg:py-2' : 'h-40 sm:h-44 md:h-48'}
                                            ${isActiveCategory(category.slug)
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400'
                                                : 'bg-white dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-700/80 border border-gray-100 dark:border-gray-700/50'
                                            }
                                            p-3 sm:p-4 lg:py-2 lg:px-3 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row items-center lg:items-center lg:justify-start w-full mb-1.5
                                        `}
                                        whileHover={{
                                            boxShadow: "0 8px 20px -4px rgba(0, 0, 0, 0.1), 0 6px 8px -4px rgba(0, 0, 0, 0.03)",
                                            transition: { duration: 0.3 }
                                        }}
                                    >
                                        {/* Category icon */}
                                        <motion.div
                                            className={`
                                                relative w-9 h-9 sm:w-10 sm:h-10 lg:w-9 lg:h-9 rounded-full mb-3 sm:mb-4 lg:mb-0 lg:mr-3 flex items-center justify-center 
                                                ${isActiveCategory(category.slug)
                                                    ? 'bg-blue-500 dark:bg-blue-400 text-white'
                                                    : 'bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200'
                                                }
                                                shadow-sm transition-all duration-300
                                            `}
                                            whileHover={{
                                                scale: isMobile ? 1.1 : 1.05,
                                                transition: { duration: 0.2 }
                                            }}
                                        >
                                            {/* Show emoji icon */}
                                            <span className="text-xl lg:text-lg">
                                                {category.emoji || categoryIcons[category.slug.toLowerCase()]?.emoji || '🛒'}
                                            </span>
                                        </motion.div>

                                        {/* Category name and count */}
                                        <div className="lg:flex-1 text-center lg:text-left w-full">
                                            <motion.h3
                                                className={`
                                                    text-xs sm:text-sm md:text-base lg:text-sm font-medium mb-1 sm:mb-2 lg:mb-0 transition-colors truncate
                                                    ${isActiveCategory(category.slug)
                                                        ? 'text-blue-700 dark:text-blue-300'
                                                        : 'text-gray-700 dark:text-gray-200'
                                                    }
                                                `}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.1 }}
                                            >
                                                {category.name}
                                            </motion.h3>
                                            {category.count > 0 && (
                                                <motion.p
                                                    className={`
                                                        text-xs transition-colors
                                                        ${isActiveCategory(category.slug)
                                                            ? 'text-blue-500/70 dark:text-blue-400/70'
                                                            : 'text-gray-500 dark:text-gray-400'
                                                        }
                                                    `}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3, delay: 0.2 }}
                                                >
                                                    {category.count} items
                                                </motion.p>
                                            )}
                                        </div>
                                    </motion.div>
                                </button>
                            ) : (
                                <Link
                                    href={`/product/category/${encodeURIComponent(category.slug)}`}
                                    className={`block ${isActiveCategory(category.slug) ? 'pointer-events-none' : ''}`}
                                >
                                    <motion.div
                                        className={`
                                            relative overflow-hidden rounded-xl lg:rounded-md
                                            ${!isMobile ? 'h-40 sm:h-44 md:h-48 lg:h-auto lg:py-2' : 'h-40 sm:h-44 md:h-48'}
                                            ${isActiveCategory(category.slug)
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400'
                                                : 'bg-white dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-700/80 border border-gray-100 dark:border-gray-700/50'
                                            }
                                            p-3 sm:p-4 lg:py-2 lg:px-3 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col lg:flex-row items-center lg:items-center lg:justify-start w-full mb-1.5
                                        `}
                                        whileHover={{
                                            boxShadow: "0 8px 20px -4px rgba(0, 0, 0, 0.1), 0 6px 8px -4px rgba(0, 0, 0, 0.03)",
                                            transition: { duration: 0.3 }
                                        }}
                                    >
                                        {/* Category icon */}
                                        <motion.div
                                            className={`
                                                relative w-9 h-9 sm:w-10 sm:h-10 lg:w-9 lg:h-9 rounded-full mb-3 sm:mb-4 lg:mb-0 lg:mr-3 flex items-center justify-center 
                                                ${isActiveCategory(category.slug)
                                                    ? 'bg-blue-500 dark:bg-blue-400 text-white'
                                                    : 'bg-gray-50 dark:bg-gray-700/60 text-gray-700 dark:text-gray-200'
                                                }
                                                shadow-sm transition-all duration-300
                                            `}
                                            whileHover={{
                                                scale: isMobile ? 1.1 : 1.05,
                                                transition: { duration: 0.2 }
                                            }}
                                        >
                                            {/* Show emoji icon */}
                                            <span className="text-xl lg:text-lg">
                                                {category.emoji || categoryIcons[category.slug.toLowerCase()]?.emoji || '🛒'}
                                            </span>
                                        </motion.div>

                                        {/* Category name and count */}
                                        <div className="lg:flex-1 text-center lg:text-left w-full">
                                            <motion.h3
                                                className={`
                                                    text-xs sm:text-sm md:text-base lg:text-sm font-medium mb-1 sm:mb-2 lg:mb-0 transition-colors truncate
                                                    ${isActiveCategory(category.slug)
                                                        ? 'text-blue-700 dark:text-blue-300'
                                                        : 'text-gray-700 dark:text-gray-200'
                                                    }
                                                `}
                                                initial={{ opacity: 0, y: 5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.3, delay: 0.1 }}
                                            >
                                                {category.name}
                                            </motion.h3>
                                            {category.count > 0 && (
                                                <motion.p
                                                    className={`
                                                        text-xs transition-colors
                                                        ${isActiveCategory(category.slug)
                                                            ? 'text-blue-500/70 dark:text-blue-400/70'
                                                            : 'text-gray-500 dark:text-gray-400'
                                                        }
                                                    `}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.3, delay: 0.2 }}
                                                >
                                                    {category.count} items
                                                </motion.p>
                                            )}
                                        </div>
                                    </motion.div>
                                </Link>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}