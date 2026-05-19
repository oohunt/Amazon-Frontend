/**
 * Favorites module entry file
 * Export all favorites-related functionality
 */

// export context and Provider
export {
    default as FavoritesContext,
    FavoritesProvider,
    useFavoritesContext
} from './context';

// export custom hooks
export {
    useFavorites,
    useProductFavorite,
    useFavoritesList,
    useMultipleProductsFavoriteStatus,
    useBatchFavorites
} from './hooks';

// ExportAPI
export { favoritesApi } from './api';

// export local storage utilities
export {
    getClientId,
    getLocalFavorites,
    addLocalFavorite,
    removeLocalFavorite,
    isLocalFavorite,
    clearLocalFavorites,
    syncLocalFavorites
} from './storage'; 