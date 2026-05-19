'use client';

import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';

import { ProductCategoryNav } from '@/components/product/ProductCategoryNav';
import { useCategoryStats } from '@/lib/hooks';

// Group categories by first letter
const groupCategoriesByAlphabet = (categories: Array<{ name: string, count: number }>) => {
    const groups: Record<string, Array<{ name: string, count: number }>> = {};

    // Group categories by their first letter
    categories.forEach(category => {
        // Get the first letter and convert to uppercase
        const firstLetter = category.name.charAt(0).toUpperCase();

        // Create the group if it doesn't exist
        if (!groups[firstLetter]) {
            groups[firstLetter] = [];
        }
        // Add the category to the corresponding letter group
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

// Alphabet index component
const AlphabetIndex = ({
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

// Category groups component
const CategoryGroups = ({
    groups,
    selectedCategory,
    onCategorySelect
}: {
    groups: Array<{ letter: string, categories: Array<{ name: string, count: number }> }>,
    selectedCategory: string,
    onCategorySelect: (category: string) => void
}) => {
    return (
        <div className="pb-8">
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

// Main content component
function CategoriesContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeLetter, setActiveLetter] = useState<string | null>(null);
    const selectedCategory = searchParams.get('category') || searchParams.get('product_groups') || '';
    const [isNavigating, setIsNavigating] = useState(false);

    const { data, isLoading } = useCategoryStats({
        sort_by: 'count',
        sort_order: 'desc',
        page_size: 100 // Fetch more categories
    });

    // Handle category selection
    const handleCategorySelect = useCallback((category: string) => {
        // Set navigation state
        setIsNavigating(true);

        // Get the stored previous path (use try-catch to prevent server-side errors)
        let prevPath = '/product'; // Default navigation target

        try {
            const storedPath = sessionStorage.getItem('prevPath');

            if (storedPath) {
                prevPath = storedPath;
            }
        } catch {
            // Handle sessionStorage read errors
        }

        // Check if the path is a product page path
        const _isProductPage = prevPath.startsWith('/product');

        // Navigate to the category page using the new URL format, keeping the categoryId parameter name consistent
        const finalUrl = `/product/category/${encodeURIComponent(category)}`;

        // Add timestamp to URL to prevent caching issues
        const urlWithTimestamp = `${finalUrl}?_ts=${Date.now()}`;

        // Delay navigation by 50ms to ensure the page state update is complete
        setTimeout(() => {
            // Navigate immediately
            router.push(urlWithTimestamp);

            // Clear navigation state
            setTimeout(() => {
                setIsNavigating(false);
            }, 500);
        }, 50);
    }, [router]);

    // Handle letter selection
    const handleLetterSelect = useCallback((letter: string) => {
        const element = document.getElementById(`group-${letter}`);

        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveLetter(letter);
        }
    }, []);

    // Store the previous path
    useEffect(() => {
        // Get the current full URL
        const currentFullUrl = window.location.href;
        const currentPath = window.location.pathname;

        // Check if a path is already stored
        const existingPath = sessionStorage.getItem('prevPath');

        // Store the current path if not on the categories page, or if no path has been stored
        if (currentPath !== '/categories' || !existingPath) {
            sessionStorage.setItem('prevPath', currentFullUrl);
        }

        // If directly visiting the categories page with no stored path, set default to products page
        if (currentPath === '/categories' && !existingPath) {
            sessionStorage.setItem('prevPath', '/product');
        }
    }, []);

    // Handle scroll to detect the active letter group
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                        const groupId = entry.target.id;

                        if (groupId.startsWith('group-')) {
                            setActiveLetter(groupId.replace('group-', ''));
                        }
                    }
                });
            },
            { threshold: 0.5 }
        );

        // Observe all letter groups
        const letterGroups = document.querySelectorAll('[id^="group-"]');

        letterGroups.forEach(group => observer.observe(group));

        return () => observer.disconnect();
    }, [data]);

    // Extract category list from API data
    const categories = data
        ? Object.entries(data.product_groups || {})
            .map(([name, count]) => ({
                name,
                count: Number(count)
            }))
            .sort((a, b) => b.count - a.count)
        : [];

    // Group by letter
    const groupedCategories = groupCategoriesByAlphabet(categories);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Navigation loading overlay */}
            {isNavigating && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center justify-center">
                        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-3" />
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">Redirecting to the product page...</p>
                    </div>
                </div>
            )}

            {/* Page header */}
            <header className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center">
                    <button
                        className="p-2 mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        onClick={() => router.back()}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold">Categories</h1>
                </div>

                {/* Add category navigation */}
                <div className="hidden sm:block container mx-auto">
                    <ProductCategoryNav
                        selectedCategory={selectedCategory}
                        onCategorySelect={handleCategorySelect}
                    />
                </div>

                {/* Alphabet index */}
                {!isLoading && groupedCategories.length > 0 && (
                    <AlphabetIndex
                        groups={groupedCategories}
                        onSelectLetter={handleLetterSelect}
                        activeLetter={activeLetter}
                    />
                )}
            </header>

            {/* Page content */}
            <main className="container mx-auto px-4 pb-20">
                {isLoading ? (
                    <div className="py-8 flex justify-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <CategoryGroups
                        groups={groupedCategories}
                        selectedCategory={selectedCategory}
                        onCategorySelect={handleCategorySelect}
                    />
                )}
            </main>
        </div>
    );
}

// Export component wrapped in Suspense
export default function CategoriesClientContent() {
    return (
        <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">
            <div className="animate-pulse text-xl font-semibold">Loading categories...</div>
        </div>}>
            <CategoriesContent />
        </Suspense>
    );
} 