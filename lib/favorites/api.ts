/**
 * Favorites feature API module
 */

import type { Product } from '@/types/api';

// Favorite item interface
interface FavoriteItem {
    userId: string;
    productId: string;
    updatedAt?: Date;
}

// Mock API response type
export type ApiResponseWrapper<T> = {
    data: {
        code: number;
        message: string;
        data: T;
    }
};

/**
 * Favorites API wrapper
 */
export const favoritesApi = {
    /**
     * Get favorites list
     * @returns Promise of favorited product list
     */
    getFavorites: async (): Promise<ApiResponseWrapper<Product[]>> => {
        try {
            const response = await fetch('/api/favorites');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get favorites list');
            }

            // Convert favorite records to product objects
            const products = data.favorites.map((fav: FavoriteItem) => ({
                id: fav.productId,
                asin: fav.productId,
                title: `Product ${fav.productId}`
            })) as Product[];

            return {
                data: {
                    code: 200,
                    message: 'Favorites list retrieved successfully',
                    data: products
                }
            };
        } catch (error) {
            return {
                data: {
                    code: 500,
                    message: error instanceof Error ? error.message : 'Failed to get favorites list',
                    data: []
                }
            };
        }
    },

    /**
     * Add to favorites
     * @param productId Product ID
     * @returns Promise of add result
     */
    addFavorite: async (productId: string): Promise<ApiResponseWrapper<undefined>> => {
        try {
            const response = await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to add favorite');
            }

            return {
                data: {
                    code: 200,
                    message: 'Favorite added successfully',
                    data: undefined
                }
            };
        } catch (error) {
            return {
                data: {
                    code: 500,
                    message: error instanceof Error ? error.message : 'Failed to add favorite',
                    data: undefined
                }
            };
        }
    },

    /**
     * Remove from favorites
     * @param productId Product ID
     * @returns Promise of remove result
     */
    removeFavorite: async (productId: string): Promise<ApiResponseWrapper<undefined>> => {
        try {
            const response = await fetch('/api/favorites', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to remove favorite');
            }

            return {
                data: {
                    code: 200,
                    message: 'Favorite removed successfully',
                    data: undefined
                }
            };
        } catch (error) {
            return {
                data: {
                    code: 500,
                    message: error instanceof Error ? error.message : 'Failed to remove favorite',
                    data: undefined
                }
            };
        }
    },

    /**
     * Batch sync favorites
     * @param productIds Array of product IDs
     * @returns Promise of sync result
     */
    syncFavorites: async (productIds: string[]): Promise<ApiResponseWrapper<undefined>> => {
        try {
            if (!productIds.length) {
                return {
                    data: {
                        code: 200,
                        message: 'Nothing to sync',
                        data: undefined
                    }
                };
            }

            // Process in batches of up to 20 items each
            const batchSize = 20;
            const batches = [];

            for (let i = 0; i < productIds.length; i += batchSize) {
                const batch = productIds.slice(i, i + batchSize);

                batches.push(batch);
            }

            // Use Promise.allSettled to process each batch
            const results = await Promise.allSettled(
                batches.map(async (batchIds) => {
                    const retryLimit = 3;
                    let attempt = 0;

                    while (attempt < retryLimit) {
                        try {
                            const response = await fetch('/api/favorites/batch', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ productIds: batchIds }),
                            });

                            const data = await response.json();

                            if (!response.ok) {
                                throw new Error(data.error || 'Batch sync failed');
                            }

                            return data;
                        } catch (error) {
                            attempt++;
                            if (attempt === retryLimit) {
                                throw error;
                            }
                            // Exponential backoff retry
                            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                        }
                    }
                })
            );

            // Check if all batches succeeded
            const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

            if (failures.length > 0) {
                throw new Error(`Some batches failed to sync: ${failures.map(f => f.reason.message).join(', ')}`);
            }

            return {
                data: {
                    code: 200,
                    message: 'Favorites list synced successfully',
                    data: undefined
                }
            };
        } catch (error) {
            return {
                data: {
                    code: 500,
                    message: error instanceof Error ? error.message : 'Failed to sync favorites list',
                    data: undefined
                }
            };
        }
    }
}; 