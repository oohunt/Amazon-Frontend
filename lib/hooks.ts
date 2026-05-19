"use client";

import type { AxiosResponse } from 'axios';
import { useEffect } from 'react';
import useSWR from 'swr';

import type { ScriptLocation } from '@/lib/models/CustomScript';
import type { Product, Category, PriceHistory, ApiResponse, CJProduct, CategoryStats, ProductStats, BrandStats, UserItem, ListResponse, EmailItem, ContactMessage, SocialLinks } from '@/types/api';

import { productsApi, userApi, systemApi } from './api';

// Generic fetcher type
type _Fetcher<T> = (...args: unknown[]) => Promise<AxiosResponse<ApiResponse<T>>>;

// SWR configuration type
type SWRHookResponse<T> = {
    data?: T;
    isLoading: boolean;
    isError: unknown;
    mutate?: () => Promise<unknown>;
};

// Define custom script interface
interface CustomScript {
    _id?: string;
    name: string;
    content: string;
    location: ScriptLocation;
    enabled: boolean;
    isNew?: boolean;
}

// Product list
export function useProducts(params?: {
    product_type?: 'discount' | 'coupon' | 'all';
    page?: number;
    limit?: number;
    sort_by?: 'price' | 'discount' | 'created' | 'all';
    sort_order?: 'asc' | 'desc';
    min_price?: number;
    max_price?: number;
    min_discount?: number;
    is_prime_only?: boolean;
    product_groups?: string;
    brands?: string;
    api_provider?: string;
}): SWRHookResponse<{ items: Product[], total: number, page: number, page_size: number }> {
    // Create a unique key to ensure re-fetch on parameter change
    const cacheKey = JSON.stringify(['/products/list', params]);

    const { data, error, isLoading, mutate } = useSWR(
        cacheKey,
        () => productsApi.getProducts(params),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 30000, // Deduplicate identical requests within 30 seconds
            shouldRetryOnError: true,
            errorRetryCount: 3,
            revalidateIfStale: false, // Do not auto-revalidate stale data
            focusThrottleInterval: 10000, // Throttle focus revalidation frequency
        }
    );

    // Handle nested API response structure
    let processedData;

    if (data) {
        // Simplify data handling — support multiple possible response formats
        if (data.data?.data?.items) {
            // Handle double-nested {data: {data: {items: [...]}}}
            processedData = data.data.data;
        } else if (data.data?.items) {
            // Handle single-nested {data: {items: [...]}}
            processedData = data.data;
        } else if ((data as unknown as { items: Product[] }).items) {
            // Handle direct return {items: [...]}
            processedData = data;
        } else if (typeof data.data === 'object' && data.data && 'success' in data.data && data.data.success && 'data' in data.data) {
            // Handle {data: {success: true, data: {items: [...]}}} format
            processedData = data.data.data;
        } else {
            // Default empty value
            processedData = { items: [], total: 0, page: 1, page_size: 10 };
        }
    } else {
        // Provide default value when no data is available
        processedData = { items: [], total: 0, page: 1, page_size: 10 };
    }

    return {
        data: processedData,
        isLoading,
        isError: error,
        mutate,
    };
}

// Product details
export function useProduct(id: string): SWRHookResponse<Product> {
    const { data: response, error, isLoading } = useSWR(
        id ? `/products/${id}` : null,
        () => productsApi.getProductById(id),
        {
            revalidateOnFocus: false,
        }
    );

    return {
        data: response?.data?.data,
        isLoading,
        isError: error,
    };
}

// Category list
export function useCategories(params?: {
    product_type?: 'discount' | 'coupon';
}): SWRHookResponse<Category[]> {
    const { data: response, error, isLoading } = useSWR(
        ['/categories', params],
        () => productsApi.getCategories(params),
        {
            revalidateOnFocus: false,
        }
    );

    return {
        data: response?.data?.data,
        isLoading,
        isError: error,
    };
}

// Category statistics
export function useCategoryStats(params?: {
    product_type?: 'discount' | 'coupon' | 'all';
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}): SWRHookResponse<CategoryStats> & { rawData?: Record<string, unknown> } {
    // Set default parameter values
    const defaultParams = {
        page: 1,
        page_size: 50, // Maximum number of categories
        sort_by: 'count',
        sort_order: 'desc' as const,
        ...params
    };

    // Create SWR fetcher function using the new API route directly
    const fetcher = async (url: string, params: Record<string, unknown>) => {
        // Build query parameters
        const queryParams = new URLSearchParams();

        // Add all query parameters
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                queryParams.append(key, String(value));
            }
        });

        // Make request, leveraging Next.js automatic caching
        const response = await fetch(`${url}?${queryParams.toString()}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return response.json();
    };

    const { data, error, isLoading } = useSWR(
        ['/api/categories/stats', defaultParams],
        ([url, params]) => fetcher(url, params),
        {
            revalidateOnFocus: false,
            refreshInterval: 300000, // Refresh every 5 minutes
        }
    );

    const defaultData: CategoryStats = {
        browse_nodes: {},
        browse_tree: {},
        bindings: {},
        product_groups: {}
    };

    // Handle data returned by API
    const processData = (rawData: Record<string, unknown>): CategoryStats => {
        if (!rawData) {
            return defaultData;
        }

        try {
            // Use data directly from API response
            const result: CategoryStats = {
                browse_nodes: (rawData.browse_nodes as CategoryStats['browse_nodes']) || {},
                browse_tree: (rawData.browse_tree as CategoryStats['browse_tree']) || {},
                bindings: (rawData.bindings as CategoryStats['bindings']) || {},
                product_groups: {}
            };

            // Validate and process product_groups
            if (rawData.product_groups) {
                if (typeof rawData.product_groups === 'object' && !Array.isArray(rawData.product_groups)) {
                    // Ensure all values are numbers and filter out categories with count 0
                    result.product_groups = Object.fromEntries(
                        Object.entries(rawData.product_groups as Record<string, number>)
                            .filter(([_, count]) => Number(count) > 0)
                            .map(([key, value]) => [
                                key,
                                Number(value) || 0
                            ])
                    );
                }
            }

            return result;
        } catch {
            return defaultData;
        }
    };

    // Access data based on API response structure
    const apiData = data?.data || data;
    const processedData = processData((apiData as unknown) as Record<string, unknown> || {});

    return {
        data: processedData,
        rawData: (apiData as unknown) as Record<string, unknown>,
        isLoading,
        isError: error,
    };
}

// Flash Deals
export function useDeals(params?: {
    active?: boolean;
    page?: number;
    limit?: number;
    min_discount?: number;
    is_prime_only?: boolean;
}): SWRHookResponse<{ items: Product[], total: number, page: number, page_size: number }> {
    const { data, error, isLoading, mutate } = useSWR(
        ['/products/list', { ...params, min_discount: params?.min_discount || 50, sort_by: 'discount', sort_order: 'desc' }],
        () => productsApi.getDeals(params),
        {
            refreshInterval: 60000, // Refresh every minute
        }
    );

    // Build default return value
    const defaultResult = { items: [], total: 0, page: 1, page_size: 10 };

    // Handle nested response (using type-safe access)
    let responseData;

    if (data?.data?.data) {
        // Deep nesting, matching ApiResponse<ListResponse<Product>> structure
        responseData = data.data.data as ListResponse<Product>;
    } else if (data?.data) {
        // Middle nesting level, directly containing data
        responseData = data.data as unknown as ListResponse<Product>;
    } else {
        // Default case
        responseData = defaultResult;
    }

    return {
        data: {
            items: responseData.items || [],
            total: responseData.total || 0,
            page: responseData.page || 1,
            page_size: responseData.page_size || 10
        },
        isLoading,
        isError: error,
        mutate,
    };
}

// Price history
export function usePriceHistory(productId: string): SWRHookResponse<PriceHistory[]> {
    const { data: response, error, isLoading } = useSWR(
        productId ? `/products/${productId}/price-history` : null,
        () => productsApi.getPriceHistory(productId),
        {
            revalidateOnFocus: false,
        }
    );

    return {
        data: response?.data?.data,
        isLoading,
        isError: error,
    };
}

// Favorites list
export function useFavorites(): SWRHookResponse<Product[]> & { mutate: () => Promise<unknown> } {
    const { data: response, error, isLoading, mutate } = useSWR(
        '/user/favorites',
        () => userApi.getFavorites(),
        {
            revalidateOnFocus: true,
        }
    );

    return {
        data: response?.data?.data,
        isLoading,
        isError: error,
        mutate,
    };
}

// CJ product search
export function useCJProducts(params: {
    keyword: string;
    page?: number;
    limit?: number;
}): SWRHookResponse<CJProduct[]> {
    const { data: response, error, isLoading } = useSWR(
        params.keyword ? ['/cj/products/search', params] : null,
        () => productsApi.searchCJProducts(params),
        {
            revalidateOnFocus: false,
        }
    );

    return {
        data: response?.data?.data,
        isLoading,
        isError: error,
    };
}

// CJProduct details
export function useCJProduct(pid: string): SWRHookResponse<CJProduct> {
    const { data: response, error, isLoading } = useSWR(
        pid ? `/cj/products/${pid}` : null,
        () => productsApi.getCJProductDetails(pid),
        {
            revalidateOnFocus: false,
        }
    );

    return {
        data: response?.data?.data,
        isLoading,
        isError: error,
    };
}

// Product statistics
export function useProductStats(productType?: 'discount' | 'coupon'): SWRHookResponse<ProductStats> {
    const { data, error, isLoading } = useSWR(
        ['/products/stats', productType],
        () => productsApi.getProductsStats(productType),
        {
            revalidateOnFocus: false,
            refreshInterval: 300000, // Refresh every 5 minutes
        }
    );

    const defaultStats: ProductStats = {
        total_products: 0,
        discount_products: 0,
        coupon_products: 0,
        prime_products: 0,
        avg_discount: 0,
        avg_price: 0,
        min_price: 0,
        max_price: 0
    };

    return {
        data: (data?.data?.data || defaultStats) as ProductStats,
        isLoading,
        isError: error,
    };
}

// Brand statistics
export function useBrandStats(params?: {
    product_type?: 'discount' | 'coupon';
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}): SWRHookResponse<BrandStats> & { rawData?: Record<string, unknown> } {
    // Set default parameter values
    const defaultParams = {
        page: 1,
        page_size: 50, // Maximum brand count
        sort_by: 'count',
        sort_order: 'desc' as const,
        ...params
    };

    const { data, error, isLoading } = useSWR(
        ['/brands/stats', defaultParams],
        () => productsApi.getBrandStats(defaultParams),
        {
            revalidateOnFocus: false,
            refreshInterval: 300000, // Refresh every 5 minutes
        }
    );

    // create default brand statistics data
    const defaultBrandStats: BrandStats = {
        brands: {},
        total_brands: 0,
        pagination: {
            page: 1,
            page_size: 50,
            total_count: 0,
            total_pages: 0
        }
    };

    return {
        data: data?.data || defaultBrandStats,
        rawData: (data?.data as unknown) as Record<string, unknown>,
        isLoading,
        isError: error,
    };
}

// Product search
export function useProductSearch(params: {
    keyword: string;
    page?: number;
    page_size?: number;
    sort_by?: 'relevance' | 'price' | 'discount' | 'created';
    sort_order?: 'asc' | 'desc';
    min_price?: number;
    max_price?: number;
    min_discount?: number;
    is_prime_only?: boolean;
    product_groups?: string;
    brands?: string;
    api_provider?: string;
}): SWRHookResponse<{ items: Product[], total: number, page: number, page_size: number }> {
    // Execute query only when keyword exists and is non-empty
    const shouldFetch = Boolean(params.keyword && params.keyword.trim());

    // Create a unique key to ensure re-fetch on parameter change
    const cacheKey = shouldFetch ? JSON.stringify(['/search/products', params]) : null;
    const paramsString = JSON.stringify(params);

    const { data, error, isLoading, mutate } = useSWR(
        cacheKey,
        () => productsApi.searchProducts(params),
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 0, // Disable cache deduplication to ensure re-fetch on every param change
            shouldRetryOnError: true,
            errorRetryCount: 3
        }
    );

    // Proactively trigger data re-fetch when parameters change
    useEffect(() => {
        if (shouldFetch) {
            mutate();
        }
    }, [shouldFetch, paramsString, mutate]);

    return {
        data: data?.data?.data,
        isLoading,
        isError: error,
        mutate,
    };
}

// System health status
export function useHealthStatus(): SWRHookResponse<{
    status: string;
    service: string;
    timestamp: string;
    database: {
        total_products: number;
        discount_products: number;
        coupon_products: number;
        prime_products: number;
        last_update: string;
    }
}> {
    const { data: response, error, isLoading } = useSWR(
        '/health',
        () => systemApi.getHealthStatus(),
        {
            refreshInterval: 60000, // Refresh every minute
            revalidateOnFocus: false,
        }
    );

    // Use type assertion to handle response data
    const healthData = response?.data?.data ||
        (response?.data && typeof response.data === 'object' && ('status' in response.data || 'database' in response.data)
            ? (response.data as unknown) as {
                status: string;
                service: string;
                timestamp: string;
                database: {
                    total_products: number;
                    discount_products: number;
                    coupon_products: number;
                    prime_products: number;
                    last_update: string;
                }
            }
            : undefined);

    return {
        data: healthData,
        isLoading,
        isError: error,
    };
}

// User statistics
export function useUserStats(): SWRHookResponse<{
    total_users: number;
    active_users: number;
    new_users_last_month: number;
    last_update: string;
}> {
    const { data: response, error, isLoading } = useSWR(
        '/stats/users',
        () => systemApi.getUserStats(),
        {
            refreshInterval: 60000, // Refresh every minute
            revalidateOnFocus: false,
        }
    );

    // Use type assertion to handle response data
    const userData = response?.data?.data ||
        (response?.data && typeof response.data === 'object' && 'total_users' in response.data
            ? (response.data as unknown) as {
                total_users: number;
                active_users: number;
                new_users_last_month: number;
                last_update: string;
            }
            : undefined);

    return {
        data: userData,
        isLoading,
        isError: error,
    };
}

// Favorites statistics
export function useFavoriteStats(): SWRHookResponse<{
    total_favorites: number;
    unique_users: number;
    last_month_favorites: number;
    last_update: string;
}> {
    const { data: response, error, isLoading } = useSWR(
        '/stats/favorites',
        () => systemApi.getFavoriteStats(),
        {
            refreshInterval: 60000, // Refresh every minute
            revalidateOnFocus: false,
        }
    );

    // Use type assertion to handle response data
    const favoritesData = response?.data?.data ||
        (response?.data && typeof response.data === 'object' && 'total_favorites' in response.data
            ? (response.data as unknown) as {
                total_favorites: number;
                unique_users: number;
                last_month_favorites: number;
                last_update: string;
            }
            : undefined);

    return {
        data: favoritesData,
        isLoading,
        isError: error,
    };
}

// User list
export function useUserList(): SWRHookResponse<UserItem[]> {
    const { data: response, error, isLoading, mutate } = useSWR(
        '/users/list',
        () => fetch('/api/users').then(res => res.json()),
        {
            revalidateOnFocus: false,
            refreshInterval: 30000, // Refresh every 30 seconds
        }
    );

    return {
        data: response?.data || [],
        isLoading,
        isError: error,
        mutate,
    };
}

// Email list
export function useEmailList(params?: {
    page?: number;
    limit?: number;
    sort_by?: 'email' | 'subscribedAt';
    sort_order?: 'asc' | 'desc';
    search?: string;
    is_active?: boolean;
    collection?: string; // Specify collection name: 'email_subscription' or 'users'
}): SWRHookResponse<{ items: EmailItem[], total: number, page: number, page_size: number }> {
    const cacheKey = JSON.stringify(['/api/emails/list', params]);

    const { data, error, isLoading, mutate } = useSWR(
        cacheKey,
        async () => {
            // Convert params to Record<string, string> for URLSearchParams
            const queryParams: Record<string, string> = {};

            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams[key] = String(value);
                    }
                });
            }
            const url = `/api/emails/list?${new URLSearchParams(queryParams).toString()}`;

            try {
                const response = await fetch(url, {
                    // Addno-cache and no-store headers to avoid browser caching
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });

                // Check response status
                if (!response.ok) {
                    const errorText = await response.text();

                    throw new Error(`API error ${response.status}: ${errorText}`);
                }

                return await response.json();
            } catch (err) {
                throw err;
            }
        },
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 30000,
            shouldRetryOnError: true,
            errorRetryCount: 3
        }
    );

    return {
        data: data?.data || { items: [], total: 0, page: 1, page_size: 10 },
        isLoading,
        isError: error,
        mutate,
    };
}

/**
 * Get contact form message list
 */
export function useContactMessages(params?: {
    page?: number;
    limit?: number;
    sort_by?: 'name' | 'email' | 'createdAt';
    sort_order?: 'asc' | 'desc';
    search?: string;
    is_processed?: boolean;
    formSource?: string | { $exists: boolean }; // Add formSource filter
}): SWRHookResponse<{ items: ContactMessage[], total: number, page: number, page_size: number }> {
    const cacheKey = JSON.stringify(['/api/contact/list', params]);

    const { data, error, isLoading, mutate } = useSWR(
        cacheKey,
        async () => {
            // Convert params to URL query parameters
            const queryParams: Record<string, string> = {};

            if (params) {
                Object.entries(params).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        // Special handling for formSource field
                        if (key === 'formSource' && typeof value === 'object') {
                            queryParams['formSourceExists'] = String(!(value.$exists === false));
                        } else {
                            queryParams[key] = String(value);
                        }
                    }
                });
            }
            const url = `/api/contact/list?${new URLSearchParams(queryParams).toString()}`;

            try {
                const response = await fetch(url, {
                    // Addno-cache and no-store headers to avoid browser caching
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });

                // Check response status
                if (!response.ok) {
                    const errorText = await response.text();

                    throw new Error(`API error ${response.status}: ${errorText}`);
                }

                return await response.json();
            } catch (err) {
                throw err;
            }
        },
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 30000,
            shouldRetryOnError: true,
            errorRetryCount: 3
        }
    );

    return {
        data: data?.data || { items: [], total: 0, page: 1, page_size: 10 },
        isLoading,
        isError: error,
        mutate,
    };
}

// Social media link configuration
export function useSocialLinks(): SWRHookResponse<SocialLinks> & { mutate: () => Promise<unknown> } {
    const { data: response, error, isLoading, mutate } = useSWR(
        '/api/settings/social-links',
        async () => {
            const res = await fetch('/api/settings/social-links');

            if (!res.ok) {
                throw new Error('Failed to get social media link configuration');
            }

            return res.json();
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // Do not repeat request within 1 minute
        }
    );

    return {
        data: response,
        isLoading,
        isError: error,
        mutate,
    };
}

// Custom script configuration
export function useCustomScripts(params?: {
    enabled?: boolean;
    location?: string;
}): SWRHookResponse<{ items: CustomScript[], total: number }> & { mutate: () => Promise<unknown> } {
    // Build query parameters
    const queryParams = new URLSearchParams();

    if (params?.enabled !== undefined) {
        queryParams.append('enabled', params.enabled.toString());
    }
    if (params?.location) {
        queryParams.append('location', params.location);
    }

    const queryString = queryParams.toString();
    const apiUrl = `/api/settings/custom-scripts${queryString ? `?${queryString}` : ''}`;

    const { data: response, error, isLoading, mutate } = useSWR(
        apiUrl,
        async () => {
            const res = await fetch(apiUrl);

            if (!res.ok) {
                throw new Error('Failed to get custom script configuration');
            }

            return res.json();
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // Do not repeat request within 1 minute
        }
    );

    return {
        data: response,
        isLoading,
        isError: error,
        mutate,
    };
} 