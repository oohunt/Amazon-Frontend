"use client";

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import { useCategoryStats } from '@/lib/hooks';


interface CategoryItem {
    id: string;
    name: string;
    count: number;
}

interface ProductFilterProps {
    onFilter: (category: string | null, sort: string) => void;
    selectedCategory: string | null;
    selectedSort: string;
}

// Addcategory skeleton component
const CategorySkeleton = () => (
    <div className="flex flex-wrap gap-2">
        <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="w-28 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="w-24 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="w-32 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="w-18 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
    </div>
);

export function ProductFilter({
    onFilter,
    selectedCategory,
    selectedSort
}: ProductFilterProps) {
    const [localCategory, setLocalCategory] = useState<string | null>(selectedCategory);
    const [localSort, setLocalSort] = useState<string>(selectedSort);
    const [categoryItems, setCategoryItems] = useState<CategoryItem[]>([]);

    const { data: categoryStats, isLoading: categoriesLoading } = useCategoryStats({
        page: 1,
        page_size: 100, // Fetch enough categories
        sort_by: 'count',
        sort_order: 'desc'
    });

    // Handle category data, convert product_groups to simple array
    useEffect(() => {
        if (categoryStats && categoryStats.product_groups) {
            const items: CategoryItem[] = [];

            Object.entries(categoryStats.product_groups).forEach(([name, count]) => {
                if (count > 0) {
                    items.push({
                        id: name,
                        name: name,
                        count: count
                    });
                }
            });
            // Backend already sorted, no need to sort again
            setCategoryItems(items);
        }
    }, [categoryStats]);

    useEffect(() => {
        setLocalCategory(selectedCategory);
        setLocalSort(selectedSort);
    }, [selectedCategory, selectedSort]);

    const handleCategoryChange = (category: string | null) => {
        setLocalCategory(category);
        onFilter(category, localSort);
    };

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSort = e.target.value;

        setLocalSort(newSort);
        onFilter(localCategory, newSort);
    };

    return (
        <div className="mb-8 flex flex-col md:flex-row justify-between gap-6 bg-gray-50 p-4 rounded-xl">
            {/* Category selector */}
            <div className="space-y-2">
                <h2 className="text-lg font-medium">Product Categories</h2>
                <div className="flex flex-wrap gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCategoryChange(null)}
                        className={`px-4 py-2 rounded-full text-sm transition-all ${!localCategory
                            ? 'bg-primary text-white shadow-md'
                            : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </motion.button>

                    {categoriesLoading ? (
                        <CategorySkeleton />
                    ) : (
                        categoryItems.slice(0, 8).map((cat) => (
                            <motion.button
                                key={cat.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleCategoryChange(cat.id)}
                                className={`px-4 py-2 rounded-full text-sm transition-all ${localCategory === cat.id
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                {cat.name} ({cat.count})
                            </motion.button>
                        ))
                    )}
                </div>
            </div>

            {/* Sort selector */}
            <div className="space-y-2">
                <h2 className="text-lg font-medium">Sort By</h2>
                <select
                    value={localSort}
                    onChange={handleSortChange}
                    className="px-4 py-2 border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                    <option value="created_desc">Newest Arrivals</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="discount_desc">Highest Discount</option>
                </select>
            </div>
        </div>
    );
} 