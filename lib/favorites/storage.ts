/**
 * Favorites local storage module
 * Handle localStorage operations including client ID and favorites list
 */

// localStorage key name
const CLIENT_ID_KEY = 'amazon_frontend_client_id';
const FAVORITES_KEY = 'amazon_frontend_favorites';

/**
 * Generate random client ID
 * @returns Randomly generated client ID
 */
function generateClientId(): string {
    return `client_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
}

/**
 * Get or create client ID
 * @returns Client ID
 */
export function getClientId(): string {
    if (typeof window === 'undefined') {
        return ''; // Return empty string during SSR
    }

    // Try to get client ID from localStorage
    let clientId = localStorage.getItem(CLIENT_ID_KEY);

    // If not exists, generate new client ID and save
    if (!clientId) {
        clientId = generateClientId();
        localStorage.setItem(CLIENT_ID_KEY, clientId);
    }

    return clientId;
}

/**
 * Get locally stored favorites list
 * @returns Array of favorited product IDs
 */
export function getLocalFavorites(): string[] {
    if (typeof window === 'undefined') {
        return []; // Return empty array during SSR
    }

    try {
        const favorites = localStorage.getItem(FAVORITES_KEY);

        return favorites ? JSON.parse(favorites) : [];
    } catch {
        return [];
    }
}

/**
 * Add product to local favorites list
 * @param productId Product ID
 */
export function addLocalFavorite(productId: string): void {
    if (typeof window === 'undefined') {
        return; // Return directly during SSR
    }

    try {
        const favorites = getLocalFavorites();

        // If product ID not in list, add it
        if (!favorites.includes(productId)) {
            favorites.push(productId);
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        }
    } catch {
        // Error handling
        return;
    }
}

/**
 * Remove product from local favorites list
 * @param productId Product ID
 */
export function removeLocalFavorite(productId: string): void {
    if (typeof window === 'undefined') {
        return; // Return directly during SSR
    }

    try {
        let favorites = getLocalFavorites();

        // Filter out product IDs to be removed
        favorites = favorites.filter(id => id !== productId);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
        return;
    }
}

/**
 * Check whether a product is in the local favorites list
 * @param productId Product ID
 * @returns Whether the item is favorited
 */
export function isLocalFavorite(productId: string): boolean {
    if (typeof window === 'undefined') {
        return false; // Return false during SSR
    }

    const favorites = getLocalFavorites();

    return favorites.includes(productId);
}

/**
 * Clear local favorites list
 */
export function clearLocalFavorites(): void {
    if (typeof window === 'undefined') {
        return; // Return directly during SSR
    }

    localStorage.removeItem(FAVORITES_KEY);
}

/**
 * Sync local and remote favorites
 * @param remoteIds Array of remotely favorited product IDs
 */
export function syncLocalFavorites(remoteIds: string[]): void {
    if (typeof window === 'undefined') {
        return; // Return directly during SSR
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(remoteIds));
} 