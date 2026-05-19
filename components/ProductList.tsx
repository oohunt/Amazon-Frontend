"use client";

import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

import Pagination from '@/components/ui/Pagination';
import type { ComponentProduct } from '@/types';

interface ProductListProps {
    products: ComponentProduct[];
    renderProduct: (product: ComponentProduct) => React.ReactNode;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

// Animation variables
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function ProductList({
    products,
    renderProduct,
    currentPage,
    totalPages,
    onPageChange
}: ProductListProps) {
    if (!products || products.length === 0) {
        return null; // Empty status handled by parent ApiStateWrapper
    }

    return (
        <div className="space-y-6 md:space-y-8">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6"
            >
                <AnimatePresence mode="wait">
                    {products.map((product) => (
                        <motion.div
                            key={product.id}
                            variants={itemVariants}
                            layout
                            className="h-full grid-item"
                        >
                            {renderProduct(product)}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {/* Pagination control - Mobile optimization */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                    className="mt-8"
                />
            )}
        </div>
    );
}
