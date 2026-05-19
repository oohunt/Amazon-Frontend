'use client';

/**
 * Favorites Page
 * Displays all products favorited by the user
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import React, { useState } from 'react';

import EmptyState from '@/components/common/EmptyState';
import ErrorState from '@/components/common/ErrorState';
import FeedbackAnimation from '@/components/common/FeedbackAnimation';
import PageSkeleton from '@/components/common/PageSkeleton';
import PageTransition from '@/components/common/PageTransition';
import ProductCard from '@/components/common/ProductCard';
import { useEnrichedFavorites } from '@/lib/favorites/hooks';
import { adaptProducts } from '@/lib/utils';

/**
 * Favorites Page Component
 */
export default function FavoritesPage() {
    // Use custom hook to get favorites with complete information
    const { favorites, isLoading, error, refreshFavorites } = useEnrichedFavorites();

    // State management
    const [refreshing, setRefreshing] = useState(false);
    const [feedback, setFeedback] = useState<{
        show: boolean;
        type: 'success' | 'error' | 'loading';
        message: string;
    }>({
        show: false,
        type: 'loading',
        message: '',
    });

    // Handle manual refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        setFeedback({
            show: true,
            type: 'loading',
            message: 'Refreshing favorites...',
        });

        try {
            await refreshFavorites();
            setFeedback({
                show: true,
                type: 'success',
                message: 'Favorites refreshed successfully',
            });
        } catch {
            setFeedback({
                show: true,
                type: 'error',
                message: 'Failed to refresh favorites',
            });
        } finally {
            setRefreshing(false);
            // Hide feedback message after 3 seconds
            setTimeout(() => {
                setFeedback(prev => ({ ...prev, show: false }));
            }, 3000);
        }
    };

    // Adapt product data to frontend component format
    const adaptedProducts = adaptProducts(favorites || []);

    // Page title
    const pageTitle = 'My Favorites';

    // Render product card
    const renderProductCards = () => {
        if (!Array.isArray(adaptedProducts) || adaptedProducts.length === 0) {
            return (
                <PageTransition show={true}>
                    <EmptyState
                        title="No Favorites"
                        description="You haven't added any products to your favorites yet. Browse some products and add them to your favorites!"
                        actionText="Browse Products"
                        actionLink="/"
                    />
                </PageTransition>
            );
        }

        return (
            <motion.div
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.05 }}
            >
                {adaptedProducts.map((product, index) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: index * 0.05,
                            duration: 0.3,
                            ease: "easeOut"
                        }}
                    >
                        <ProductCard
                            product={product}
                            showFavoriteButton
                        />
                    </motion.div>
                ))}
            </motion.div>
        );
    };

    // Render content area
    const renderContent = () => {
        if (isLoading) {
            return <PageSkeleton productCount={8} />;
        }

        if (error) {
            return (
                <PageTransition show={true}>
                    <ErrorState
                        message="Failed to load favorites"
                        error={error as Error}
                        retry={refreshFavorites}
                    />
                </PageTransition>
            );
        }

        return renderProductCards();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Title and action buttons */}
            <motion.div
                className="mb-8 flex items-center justify-between"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-2xl font-bold">{pageTitle}</h1>

                <motion.button
                    onClick={handleRefresh}
                    disabled={isLoading || refreshing}
                    className={`rounded px-4 py-2 text-white transition-all flex items-center space-x-2
                        ${refreshing || isLoading
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                    whileTap={{ scale: 0.95 }}
                >
                    {refreshing ? (
                        <>
                            <motion.svg
                                className="h-4 w-4 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                                initial={{ rotate: 0 }}
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                            </motion.svg>
                            <span>Refreshing...</span>
                        </>
                    ) : (
                        <span>Refresh List</span>
                    )}
                </motion.button>
            </motion.div>

            {/* Action feedback display */}
            {feedback.show && (
                <motion.div
                    className="mb-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <FeedbackAnimation
                        type={feedback.type}
                        message={feedback.message}
                    />
                </motion.div>
            )}

            {/* Favorite count info */}
            {!isLoading && !error && Array.isArray(adaptedProducts) && (
                <motion.p
                    className="mb-6 text-gray-600"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    You have favorited <span className="font-medium">{adaptedProducts.length}</span> products
                </motion.p>
            )}

            {/* Content area */}
            {renderContent()}

            {/* Back to home link */}
            <motion.div
                className="mt-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <Link
                    href="/"
                    className="text-blue-500 hover:underline"
                >
                    Return to Home
                </Link>
            </motion.div>
        </div>
    );
} 