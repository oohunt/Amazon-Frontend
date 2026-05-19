/**
 * Favorites feature Context module
 * Provides global favorites state and action methods
 */

import { useSession } from 'next-auth/react';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

import type { Product } from '@/types/api';

import { favoritesApi } from './api';
import {
    getLocalFavorites,
    addLocalFavorite,
    removeLocalFavorite,
    isLocalFavorite,
    clearLocalFavorites,
    syncLocalFavorites
} from './storage';

// Define Context type
interface FavoritesContextType {
    // State
    favorites: Product[];          // List of favorited products
    favoriteIds: string[];         // List of favorited product IDs
    isLoading: boolean;            // Loading state
    error: Error | null;           // Error information
    isAuthenticated: boolean;      // Whether the user is logged in

    // Methods
    addFavorite: (productId: string) => Promise<{ success: boolean; message: string }>;              // Add to favorites
    removeFavorite: (productId: string) => Promise<{ success: boolean; message: string }>;           // Remove from favorites
    isFavorite: (productId: string) => boolean;                     // Check if already favorited
    refreshFavorites: () => Promise<void>;                          // Refresh favorites list
    clearFavorites: () => Promise<void>;                            // Clear favorites
    syncWithServer: () => Promise<void>;                           // Sync with server
}

// Create Context
const FavoritesContext = createContext<FavoritesContextType>({
    favorites: [],
    favoriteIds: [],
    isLoading: false,
    error: null,
    isAuthenticated: false,
    addFavorite: async () => ({ success: true, message: '' }),
    removeFavorite: async () => ({ success: true, message: '' }),
    isFavorite: () => false,
    refreshFavorites: async () => { },
    clearFavorites: async () => { },
    syncWithServer: async () => { }
});

// Provider component Props type
interface FavoritesProviderProps {
    children: React.ReactNode;
}

/**
 * Favorites feature Provider component
 */
export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
    const { data: session } = useSession();
    const [favorites, setFavorites] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    // Extract the list of favorited product IDs
    const favoriteIds = useMemo(() => {
        return favorites.map(product => product.asin || product.id || '');
    }, [favorites]);

    // Whether the user is logged in
    const isAuthenticated = !!session?.user;

    // Initialize state from local storage when the component mounts
    useEffect(() => {
        const localFavoriteIds = getLocalFavorites();

        if (localFavoriteIds.length > 0) {
            const simpleProducts = localFavoriteIds.map(id => ({
                id,
                asin: id,
                title: `Product ${id}`
            })) as Product[];

            setFavorites(simpleProducts);
        }
    }, []);

    /**
     * Refresh favorites list
     */
    const refreshFavorites = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (isAuthenticated) {
                // Fetch favorites list from the server
                const response = await favoritesApi.getFavorites();

                if (response.data.code === 200) {
                    setFavorites(response.data.data);
                    // Sync to local storage, filtering out undefined values
                    syncLocalFavorites(response.data.data.map(p => p.id || p.asin).filter((id): id is string => id !== undefined));
                } else {
                    throw new Error(response.data.message);
                }
            } else {
                // Fetch from local storage
                const localFavoriteIds = getLocalFavorites();
                const simpleProducts = localFavoriteIds.map(id => ({
                    id,
                    asin: id,
                    title: `Product ${id}`
                })) as Product[];

                setFavorites(simpleProducts);
            }
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to refresh favorites'));
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    /**
     * Add to favorites
     */
    const addFavorite = useCallback(async (productId: string) => {
        if (!productId || favoriteIds.includes(productId)) {
            return { success: true, message: 'Item already in favorites' };
        }

        try {
            setError(null);

            if (isAuthenticated) {
                // Call server API
                const response = await favoritesApi.addFavorite(productId);

                if (response.data.code !== 200) {
                    throw new Error(response.data.message);
                }
            }
            // Always add to local storage regardless of login state
            addLocalFavorite(productId);

            // Update local state directly instead of re-fetching the full list
            setFavorites(prev => [
                ...prev,
                {
                    id: productId,
                    asin: productId,
                    title: `Product ${productId}`
                } as Product
            ]);

            return { success: true, message: 'Successfully added to favorites' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add favorite';

            setError(err instanceof Error ? err : new Error(errorMessage));

            return { success: false, message: errorMessage };
        }
    }, [favoriteIds, isAuthenticated]);

    /**
     * Remove from favorites
     */
    const removeFavorite = useCallback(async (productId: string) => {
        // Check both state and local storage
        const isInFavorites = favoriteIds.includes(productId) || isLocalFavorite(productId);

        if (!productId || !isInFavorites) {
            return { success: true, message: 'Item not in favorites' };
        }

        try {
            setError(null);

            if (isAuthenticated) {
                // Call server API
                const response = await favoritesApi.removeFavorite(productId);

                if (response.data.code !== 200) {
                    throw new Error(response.data.message);
                }
            }
            // Always remove from local storage regardless of login state
            removeLocalFavorite(productId);

            // Update local state directly instead of re-fetching the full list
            setFavorites(prev => prev.filter(product =>
                (product.id !== productId) && (product.asin !== productId)
            ));

            return { success: true, message: 'Successfully removed from favorites' };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to remove favorite';

            setError(err instanceof Error ? err : new Error(errorMessage));

            return { success: false, message: errorMessage };
        }
    }, [favoriteIds, isAuthenticated]);

    /**
     * Check if a product is in favorites
     */
    const isFavorite = useCallback((productId: string) => {
        return favoriteIds.includes(productId) || isLocalFavorite(productId);
    }, [favoriteIds]);

    /**
     * Clear favorites
     */
    const clearFavorites = useCallback(async () => {
        try {
            if (isAuthenticated) {
                // Call server API to sync an empty list
                const response = await favoritesApi.syncFavorites([]);

                if (response.data.code !== 200) {
                    throw new Error(response.data.message);
                }
            }
            // Clear local storage
            clearLocalFavorites();
            await refreshFavorites();
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to clear favorites'));
        }
    }, [isAuthenticated, refreshFavorites]);

    /**
     * Sync favorites list with server
     */
    const syncWithServer = useCallback(async () => {
        if (!isAuthenticated) {
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Get local favorites ID list
            const localIds = getLocalFavorites();

            // Get server-side favorites list
            const serverResponse = await favoritesApi.getFavorites();
            const serverIds = serverResponse.data.data.map(p => p.id || p.asin).filter((id): id is string => id !== undefined);

            // Calculate IDs to sync (exists locally but not on server)
            const idsToSync = localIds.filter(id => !serverIds.includes(id));

            if (idsToSync.length > 0) {
                // Sync only the differences
                const response = await favoritesApi.syncFavorites(idsToSync);

                if (response.data.code !== 200) {
                    throw new Error(response.data.message);
                }
            }

            // Merge local and server data
            const allIds = Array.from(new Set([...localIds, ...serverIds]));
            const mergedProducts = allIds.map(id => ({
                id,
                asin: id,
                title: `Product ${id}`
            })) as Product[];

            setFavorites(mergedProducts);
            // update local storage
            syncLocalFavorites(allIds);

        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to sync favorites'));
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // Build context value
    const contextValue = useMemo(() => ({
        favorites,
        favoriteIds,
        isLoading,
        error,
        isAuthenticated,
        addFavorite,
        removeFavorite,
        isFavorite,
        refreshFavorites,
        clearFavorites,
        syncWithServer
    }), [
        favorites,
        favoriteIds,
        isLoading,
        error,
        isAuthenticated,
        addFavorite,
        removeFavorite,
        isFavorite,
        refreshFavorites,
        clearFavorites,
        syncWithServer
    ]);

    return (
        <FavoritesContext.Provider value={contextValue}>
            {children}
        </FavoritesContext.Provider>
    );
};

/**
 * Hook for consuming the favorites context
 */
export const useFavoritesContext = () => useContext(FavoritesContext);

export default FavoritesContext; 