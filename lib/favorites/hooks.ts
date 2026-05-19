/**
 * Favorites custom hook module
 * Provide convenient custom hooks to simplify component usage
 */

import { useCallback, useEffect, useState, useMemo } from 'react';

import { productsApi } from '@/lib/api';
import type { Product } from '@/types/api';

import { useFavoritesContext } from './context';

/**
 * Hook for using favorites functionality in components
 * Return favorites state and operations
 */
export function useFavorites() {
    const {
        favorites,
        favoriteIds,
        isLoading,
        error,
        addFavorite,
        removeFavorite,
        isFavorite,
        refreshFavorites,
        clearFavorites
    } = useFavoritesContext();

    return {
        favorites,
        favoriteIds,
        isLoading,
        error,
        addFavorite,
        removeFavorite,
        isFavorite,
        refreshFavorites,
        clearFavorites
    };
}

/**
 * Hook for managing the favorite state of a single product
 * @param productId Product ID
 * @returns Favorite state and toggle method
 */
export function useProductFavorite(productId: string) {
    const { isFavorite, addFavorite, removeFavorite } = useFavoritesContext();
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Use local storage to check favorites state
    const isProductFavorite = useMemo(() => {
        return isFavorite(productId);
    }, [isFavorite, productId]);

    // Toggle favorite state
    const toggleFavorite = useCallback(async () => {
        setIsUpdating(true);
        setError(null);

        try {
            const result = isProductFavorite
                ? await removeFavorite(productId)
                : await addFavorite(productId);

            if (!result.success) {
                setError(result.message);
            }

            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Operation failed';

            setError(errorMessage);

            return { success: false, message: errorMessage };
        } finally {
            setIsUpdating(false);
        }
    }, [isProductFavorite, addFavorite, removeFavorite, productId]);

    return {
        isFavorite: isProductFavorite,
        toggleFavorite,
        isUpdating,
        error
    };
}

/**
 * Hook for fetching the list of favorited products
 * Return favorited product list and loading status
 */
export function useFavoritesList() {
    const { favorites, isLoading, error, refreshFavorites } = useFavoritesContext();

    return {
        favorites,
        isLoading,
        error,
        refreshFavorites
    };
}

/**
 * Get favorites list with full product info
 * Fetch full product information based on a list of favorited IDs
 */
export function useEnrichedFavorites() {
    const { favoriteIds, refreshFavorites } = useFavoritesContext();
    const [enrichedFavorites, setEnrichedFavorites] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchProductDetails() {
            if (!favoriteIds.length) {
                setEnrichedFavorites([]);
                setIsLoading(false);

                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Use batch query API to fetch product information
                const response = await productsApi.queryProducts({
                    asins: favoriteIds,
                    include_metadata: false,
                    include_browse_nodes: ["false"]
                });

                let products: Product[] = [];

                // Check different response structures
                if (response?.data?.data) {
                    // Standard API response structure
                    products = response.data.data;
                } else if (Array.isArray(response?.data)) {
                    // Direct array case
                    products = response.data;
                } else if (response?.data) {
                    // Other possible response structures
                    products = response.data as unknown as Product[];
                }

                // Ensure products is an array
                if (!Array.isArray(products)) {
                    products = [];
                }

                // Handle returned product array, ensure each position has valid product data
                const matchedProducts = favoriteIds.map((id) => {
                    const product = products.find(p => p.asin === id || p.id === id);

                    if (!product) {
                        // If product doesn't exist, return basic info object
                        return {
                            id,
                            asin: id,
                            title: `Product ${id}`,
                            price: 0,
                            image_url: '/placeholder-product.jpg'
                        } as Product;
                    }

                    return product;
                });

                setEnrichedFavorites(matchedProducts);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Failed to get favorite product details'));
                // Use basic info object when error occurs
                const fallbackProducts = favoriteIds.map(id => ({
                    id,
                    asin: id,
                    title: `Product ${id}`,
                    price: 0,
                    image_url: '/placeholder-product.jpg'
                })) as Product[];

                setEnrichedFavorites(fallbackProducts);
            } finally {
                setIsLoading(false);
            }
        }

        fetchProductDetails();
    }, [favoriteIds]);

    return {
        favorites: enrichedFavorites,
        isLoading,
        error,
        refreshFavorites
    };
}

/**
 * Hook for checking whether specific product IDs are favorited
 * @param productIds Array of product IDs
 * @returns Object containing favorite status keyed by product ID
 */
export function useMultipleProductsFavoriteStatus(productIds: string[]) {
    const { isFavorite } = useFavoritesContext();

    const favoriteStatus: Record<string, boolean> = {};

    productIds.forEach(id => {
        favoriteStatus[id] = isFavorite(id);
    });

    return favoriteStatus;
}

/**
 * Hook for bulk favorites operations
 * Provide methods for bulk-adding and bulk-removing products from favorites
 */
export function useBatchFavorites() {
    const { addFavorite, removeFavorite } = useFavoritesContext();

    // Bulk add to favorites
    const addMultipleFavorites = useCallback(async (productIds: string[]) => {
        const promises = productIds.map(id => addFavorite(id));

        await Promise.all(promises);
    }, [addFavorite]);

    // Bulk remove from favorites
    const removeMultipleFavorites = useCallback(async (productIds: string[]) => {
        const promises = productIds.map(id => removeFavorite(id));

        await Promise.all(promises);
    }, [removeFavorite]);

    return {
        addMultipleFavorites,
        removeMultipleFavorites
    };
} 