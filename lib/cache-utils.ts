import { useEffect, useState, useCallback } from 'react';

/**
 * Type used for generating cache keys
 */
type CacheKeyParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Local cache item interface
 */
interface CacheItem<T> {
    data: T;
    timestamp: number;
    expiry: number;
}

/**
 * Cache hit result interface
 */
export interface CacheResult<T> {
    hit: boolean;
    data?: T;
    age?: number;
}

/**
 * Generate a cache key based on parameters
 */
export function generateCacheKey(prefix: string, params: CacheKeyParams): string {
    // Filter out undefined and null values
    const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null && value !== '')
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');

    return `${prefix}|${filteredParams}`;
}

/**
 * Retrieve cached data from local storage
 */
export function getFromCache<T>(key: string, maxAge = 300000): CacheResult<T> {
    if (typeof window === 'undefined') {
        return { hit: false };
    }

    try {
        const cacheJson = localStorage.getItem(`cache_${key}`);

        if (!cacheJson) {
            return { hit: false };
        }

        const cache = JSON.parse(cacheJson) as CacheItem<T>;
        const now = Date.now();
        const age = now - cache.timestamp;

        // Check if the cache is still valid
        if (age < maxAge) {
            return {
                hit: true,
                data: cache.data,
                age
            };
        }

        // Cache expired, remove it
        localStorage.removeItem(`cache_${key}`);

        return { hit: false };
    } catch {
        return { hit: false };
    }
}

/**
 * Write data to local storage cache
 */
export function writeToCache<T>(key: string, data: T, maxAge = 300000): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const cache: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            expiry: Date.now() + maxAge
        };

        localStorage.setItem(`cache_${key}`, JSON.stringify(cache));
    } catch {
        // If cache write fails, try to clean up some cached entries
        cleanupCache();
    }
}

/**
 * Clean up old cache entries to free space
 */
export function cleanupCache(keepNewest = 50): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const cacheKeys = [];
        const now = Date.now();

        // Collect all cache entries
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            if (key && key.startsWith('cache_')) {
                try {
                    const value = localStorage.getItem(key);

                    if (value) {
                        const item = JSON.parse(value) as CacheItem<unknown>;

                        cacheKeys.push({
                            key,
                            timestamp: item.timestamp,
                            expiry: item.expiry
                        });
                    }
                } catch {
                    // Remove invalid cache entries
                    localStorage.removeItem(key);
                }
            }
        }

        // First delete expired cache entries
        const expiredKeys = cacheKeys.filter(item => item.expiry < now);

        for (const { key } of expiredKeys) {
            localStorage.removeItem(key);
        }

        // If more space is needed, sort by timestamp and keep the newest entries
        if (cacheKeys.length - expiredKeys.length > keepNewest) {
            const validKeys = cacheKeys
                .filter(item => item.expiry >= now)
                .sort((a, b) => b.timestamp - a.timestamp);

            // Delete old cache entries
            for (let i = keepNewest; i < validKeys.length; i++) {
                localStorage.removeItem(validKeys[i].key);
            }
        }
    } catch {
        // If cleanup fails, try to clear all cache entries
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                if (key && key.startsWith('cache_')) {
                    localStorage.removeItem(key);
                }
            }
        } catch {
            // Ignore errors
        }
    }
}

/**
 * Hook for fetch state with caching
 */
export function useCachedFetch<T>(
    url: string | null,
    params: CacheKeyParams,
    options?: {
        maxAge?: number;
        prefixKey?: string;
        requireUrl?: boolean;
    }
): {
    data: T | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
    fromCache: boolean;
} {
    const { maxAge = 300000, prefixKey = 'fetch', requireUrl = true } = options || {};

    const [data, setData] = useState<T | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);
    const [fromCache, setFromCache] = useState<boolean>(false);

    // Generate cache key
    const cacheKey = url ? generateCacheKey(`${prefixKey}_${url}`, params) : null;

    const fetchData = useCallback(async () => {
        if (!url && requireUrl) {
            return;
        }

        setIsLoading(true);
        setIsError(false);
        setError(null);
        setFromCache(false);

        try {
            // Try to get from cache
            if (cacheKey) {
                const cached = getFromCache<T>(cacheKey, maxAge);

                if (cached.hit && cached.data) {
                    setData(cached.data);
                    setIsLoading(false);
                    setFromCache(true);

                    return;
                }
            }

            // Build query parameters
            const queryParams = new URLSearchParams();

            // Add all query parameters
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value));
                }
            });

            // Correctly handle the query string portion of the URL
            const queryString = queryParams.toString();
            const urlWithQuery = url
                ? url + (queryString ? (url.includes('?') ? '&' : '?') + queryString : '')
                : '';

            // Exit if no URL is provided
            if (!url) {
                throw new Error('URL is required for fetch');
            }

            // Make the network request
            const response = await fetch(urlWithQuery);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();
            const responseData = result.data as T;

            // Update state
            setData(responseData);

            // Cache the result
            if (cacheKey) {
                writeToCache(cacheKey, responseData, maxAge);
            }
        } catch (err) {
            setIsError(true);
            setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
            setIsLoading(false);
        }
    }, [url, cacheKey, maxAge, params, requireUrl]);

    // Fetch data on initial load and when dependencies change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Provide a method to re-fetch data
    const refetch = async () => {
        await fetchData();
    };

    return { data, isLoading, isError, error, refetch, fromCache };
}

/**
 * Initialize the cache system and clean up expired cache entries
 * Should be called when the application starts
 */
export function initCacheSystem(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        // Use requestIdleCallback to clean up cache when the browser is idle
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(() => {
                cleanupCache();
            });
        } else {
            // Fall back to setTimeout
            setTimeout(() => {
                cleanupCache();
            }, 2000);
        }
    } catch {
        // Ignore errors
    }
} 