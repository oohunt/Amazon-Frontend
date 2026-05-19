import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

import type { Product, Category, PriceHistory, ApiResponse, CJProduct, ListResponse, CategoryStats, ProductStats, BrandStats, ProductInfo } from '@/types/api';
import type {
    ContentPage,
    ContentPageListResponse,
    ContentPageCreateRequest,
    ContentPageUpdateRequest,
    ContentCategory,
    ContentCategoryListResponse,
    ContentCategoryCreateRequest,
    ContentCategoryUpdateRequest,
    ContentTag,
    ContentTagListResponse,
    ContentTagCreateRequest,
    ContentTagUpdateRequest,
    ProductSelectionResponse
} from '@/types/cms';

// API Base URL configuration
// SERVER_ORIGIN is the full site origin (no trailing /api) — used for server-side absolute URLs
const SERVER_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004';
const API_BASE_URL = `${SERVER_ORIGIN}/api`;
// SERVER_API_URL: full /api base for axios instance; falls back to our local origin
const SERVER_API_URL = process.env.SERVER_API_URL || API_BASE_URL;
const DEFAULT_TIMEOUT = 15000;

// Function to determine if code is running on server or client
const isServer = () => typeof window === 'undefined';

// Create axios instance with dynamic base URL
const createApiClient = (config?: AxiosRequestConfig) => {
    return axios.create({
        baseURL: isServer() ? SERVER_API_URL : '/api',
        timeout: DEFAULT_TIMEOUT,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(process.env.NEXT_PUBLIC_API_KEY && {
                'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
            })
        },
        withCredentials: false,
        ...config
    });
};

const api = createApiClient();

// Update cmsApiClient config to add dynamic baseURL resolution
const cmsApiClient = axios.create({
    baseURL: isServer() ? SERVER_API_URL : '/api', // Use correct baseURL based on environment
    timeout: DEFAULT_TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(process.env.NEXT_PUBLIC_API_KEY && {
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
        })
    },
    withCredentials: false,
});

// Add request interceptor to ensure local URL is used
api.interceptors.request.use(
    (config) => {
        // When running on the server side, unless the request URL contains a specific path
        if (isServer() && !config.url?.includes('/products/query')) {
            config.baseURL = API_BASE_URL;
        } else if (isServer()) {
            // For products/query requests, use SERVER_API_URL
            config.baseURL = SERVER_API_URL;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add the same interceptor to cmsApiClient
cmsApiClient.interceptors.request.use(
    (config) => {
        // When running on the server side, force use of local URL
        if (isServer()) {
            config.baseURL = API_BASE_URL;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {


        return Promise.reject(error);
    }
);

// API endpoints
export const productsApi = {
    /**
     * Query product details by ASIN
     * Uses POST request, supports richer query options
     * @param params - Query parameters
     * @param params.asins - Array of product ASINs
     * @param params.include_metadata - Whether to include raw metadata
     * @param params.include_browse_nodes - Filter by specific browse node ID array
     * @returns API response object containing product data
     */
    queryProduct: (params: {
        asins: string[];
        include_metadata?: boolean;
        include_browse_nodes?: string[] | null;
    }) => {
        if (!params.asins || params.asins.length === 0) {
            throw new Error('ASINs array is required for product query');
        }

        return api.post<ApiResponse<Product[]>>('/products/query', params);
    },

    /**
     * Batch query product details
     * @param params - Query parameters
     * @param params.asins - Array of product ASINs, maximum 50
     * @param params.include_metadata - Whether to include raw metadata
     * @param params.include_browse_nodes - Filter by specific browse node ID array
     * @returns API response object containing product data array
     */
    queryProducts: (params: {
        asins: string[];
        include_metadata?: boolean;
        include_browse_nodes?: string[] | null;
    }) => {
        if (!params.asins || params.asins.length === 0) {
            throw new Error('ASINs array is required for products query');
        }

        if (params.asins.length > 50) {
            throw new Error('Maximum 50 ASINs allowed per request');
        }

        return api.post<ApiResponse<Product[]>>('/products/query', params);
    },

    // Product-related
    getProducts: async (params?: {
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
    }) => {
        try {
            // Map frontend params to API params
            const apiParams: Record<string, unknown> = { ...params };

            // Rename some params to match API expectations
            if (params?.limit) apiParams.page_size = params.limit;
            if (params?.sort_by) apiParams.sort_by = params.sort_by;
            if (params?.sort_order) apiParams.sort_order = params.sort_order;

            // Remove empty category and brand params
            if (params?.brands === '') delete apiParams.brands;
            if (params?.product_groups === '') delete apiParams.product_groups;

            // Remove unnecessary params
            delete apiParams.limit;

            // Build query params
            const queryParams = new URLSearchParams();

            // Add all query params
            Object.entries(apiParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value));
                }
            });

            // Get full URL
            const queryString = queryParams.toString();
            // Server-side needs absolute URL; client-side uses relative /api path
            const baseUrl = isServer() ? SERVER_ORIGIN : '';
            const url = `${baseUrl}/api/products/list${queryString ? `?${queryString}` : ''}`;

            // Use fetch API to make the request, leveraging Next.js automatic caching
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            return {
                data: data
            };
        } catch {
            // Error handling
            return {
                data: {
                    items: [],
                    total: 0,
                    page: 1,
                    page_size: 10
                }
            };
        }
    },
    getProductsStats: (productType?: 'discount' | 'coupon') =>
        api.get<ApiResponse<ProductStats>>('/products/stats', { params: { product_type: productType } }),

    getProductById: (id: string) => api.get<ApiResponse<Product>>(`/products/${id}`),

    getCategories: (params?: {
        product_type?: 'discount' | 'coupon';
    }) => api.get<ApiResponse<Category[]>>('/categories', { params }),

    getCategoryStats: (params?: {
        page?: number;
        page_size?: number;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }) => api.get<ApiResponse<CategoryStats>>('/categories/stats', { params }),

    getBrandStats: (params?: {
        product_type?: 'discount' | 'coupon';
        page?: number;
        page_size?: number;
        sort_by?: string;
        sort_order?: 'asc' | 'desc';
    }) => api.get<BrandStats>('/brands/stats', { params }),

    getDeals: (params?: {
        active?: boolean;
        page?: number;
        limit?: number;
        min_discount?: number;
        is_prime_only?: boolean;
    }) => api.get<ApiResponse<ListResponse<Product>>>('/products/list', {
        params: {
            ...params,
            min_discount: params?.min_discount || 50,
            sort_by: 'discount',
            sort_order: 'desc'
        }
    }),

    getPriceHistory: (productId: string, params?: {
        days?: number;
    }) => api.get<ApiResponse<PriceHistory[]>>(`/products/${productId}/price-history`, { params }),

    // CJ platform-related
    searchCJProducts: (params: {
        keyword: string;
        page?: number;
        limit?: number;
    }) => api.get<ApiResponse<CJProduct[]>>('/cj/products/search', { params }),

    getCJProductDetails: (pid: string) => api.get<ApiResponse<CJProduct>>(`/cj/products/${pid}`),

    getCJShippingInfo: (pid: string, params: {
        country: string;
        quantity: number;
    }) => api.get<ApiResponse<{
        shipping_price: number;
        shipping_time: string;
        shipping_method: string;
    }>>(`/cj/products/${pid}/shipping`, { params }),

    /**
     * Search products
     * @param params Search parameters
     * @param params.keyword Search keyword, required
     * @param params.page Page number, starting from 1
     * @param params.page_size Number of products per page, range: 1-100
     * @param params.sort_by Sort field: "relevance", "price", "discount", or "created"
     * @param params.sort_order Sort direction: "asc" or "desc"
     * @param params.min_price Minimum price filter
     * @param params.max_price Maximum price filter
     * @param params.min_discount Minimum discount rate filter, range: 0-100
     * @param params.is_prime_only Whether to show only Prime products
     * @param params.product_groups Product category filter, multiple categories separated by commas
     * @param params.brands Brand filter, multiple brands separated by commas
     * @param params.api_provider Data source filter: "pa-api" or "cj-api"
     * @returns API response object containing search result data
     */
    searchProducts: (params: {
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
    }) => {
        if (!params.keyword) {
            throw new Error('Keyword is a required search parameter');
        }

        // First try to decode the keyword to ensure it is in its original unencoded state
        let cleanKeyword = params.keyword;

        try {
            // Try to decode to see if it is already encoded
            while (cleanKeyword.includes('%')) {
                const decoded = decodeURIComponent(cleanKeyword);

                if (decoded === cleanKeyword) {
                    break; // Cannot decode further
                }
                cleanKeyword = decoded;
            }
        } catch {
            // Decoding failed, keep as-is
            cleanKeyword = params.keyword;
        }

        // Create a clean params object using the decoded keyword and add default sort order
        const cleanParams = {
            ...params,
            keyword: cleanKeyword,
            sort_order: params.sort_order || 'desc' // Set default sort order to desc
        };

        // Do not encode here, let axios handle it automatically
        // axios will automatically encode URL parameters
        return api.get<ApiResponse<ListResponse<Product>>>('/search/products', { params: cleanParams });
    },

    /**
     * Manually add a product to the database
     * @param productData - Data conforming to the ProductInfo structure
     * @returns API response object containing the created product information
     */
    manualAddProduct: (productData: ProductInfo) => {
        // Use api instance to send request, routing through Next.js API routes
        return api.post<ApiResponse<ProductInfo>>('/products/manual', productData);
    },

    /**
     * Update an existing product's information
     * @param asin - The product's ASIN code
     * @param productData - Update data conforming to the ProductInfo structure
     * @returns API response object containing the updated product information
     */
    updateProduct: (asin: string, productData: ProductInfo) => {
        // Ensure ASIN format is correct
        if (!asin || asin.length !== 10 || !/^[A-Z0-9]{10}$/i.test(asin)) {
            throw new Error('Invalid ASIN format. ASIN must be 10 alphanumeric characters.');
        }

        // Use api instance to send request, routing through Next.js API routes
        return api.put<ApiResponse<ProductInfo>>(`/products/${asin.toUpperCase()}`, productData);
    },
};

export const userApi = {
    getFavorites: () => api.get<ApiResponse<Product[]>>('/user/favorites'),
    addFavorite: (productId: string) => api.post<ApiResponse<void>>(`/user/favorites/${productId}`),
    removeFavorite: (productId: string) => api.delete<ApiResponse<void>>(`/user/favorites/${productId}`),

    // User preferences
    getPreferences: () => api.get<ApiResponse<Record<string, unknown>>>('/user/preferences'),
    updatePreferences: (preferences: Record<string, unknown>) => api.put<ApiResponse<void>>('/user/preferences', preferences),
};

export const systemApi = {
    /**
     * Get system health status and statistics
     */
    getHealthStatus: () => api.get<ApiResponse<{
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
    }>>('/health'),

    /**
     * Get user statistics
     */
    getUserStats: () => api.get<ApiResponse<{
        total_users: number;
        active_users: number;
        new_users_last_month: number;
        last_update: string;
    }>>('/stats/users'),

    /**
     * Get favorites statistics
     */
    getFavoriteStats: () => api.get<ApiResponse<{
        total_favorites: number;
        unique_users: number;
        last_month_favorites: number;
        last_update: string;
    }>>('/stats/favorites'),
};

// CMS-related API
export const cmsApi = {
    // Content page-related
    getPages: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: 'draft' | 'published' | 'archived';
        category?: string;
        tag?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => cmsApiClient.get<ApiResponse<ContentPageListResponse>>('/cms/pages', { params }),

    getPageById: (id: string) =>
        cmsApiClient.get<ApiResponse<ContentPage>>(`/cms/pages/${id}`),

    getPageBySlug: (slug: string) =>
        cmsApiClient.get<ApiResponse<ContentPage>>(`/cms/content/${slug}`),

    createPage: (page: ContentPageCreateRequest) =>
        cmsApiClient.post<ApiResponse<ContentPage>>('/cms/pages', page),

    updatePage: (id: string, page: ContentPageUpdateRequest) =>
        cmsApiClient.put<ApiResponse<ContentPage>>(`/cms/pages/${id}`, page),

    deletePage: (id: string) =>
        cmsApiClient.delete<ApiResponse<void>>(`/cms/pages/${id}`),

    // Content category-related
    getCategories: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        parentId?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => cmsApiClient.get<ApiResponse<ContentCategoryListResponse>>('/cms/categories', { params }),

    getCategoryById: (id: string) =>
        cmsApiClient.get<ApiResponse<ContentCategory>>(`/cms/categories/${id}`),

    getCategoryBySlug: (slug: string) =>
        cmsApiClient.get<ApiResponse<ContentCategory>>(`/cms/categories/slug/${slug}`),

    createCategory: (category: ContentCategoryCreateRequest) =>
        cmsApiClient.post<ApiResponse<ContentCategory>>('/cms/categories', category),

    updateCategory: (id: string, category: ContentCategoryUpdateRequest) =>
        cmsApiClient.put<ApiResponse<ContentCategory>>(`/cms/categories/${id}`, category),

    deleteCategory: (id: string) =>
        cmsApiClient.delete<ApiResponse<void>>(`/cms/categories/${id}`),

    // Content tag-related
    getTags: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => cmsApiClient.get<ApiResponse<ContentTagListResponse>>('/cms/tags', { params }),

    getTagById: (id: string) =>
        cmsApiClient.get<ApiResponse<ContentTag>>(`/cms/tags/${id}`),

    getTagBySlug: (slug: string) =>
        cmsApiClient.get<ApiResponse<ContentTag>>(`/cms/tags/slug/${slug}`),

    createTag: (tag: ContentTagCreateRequest) =>
        cmsApiClient.post<ApiResponse<ContentTag>>('/cms/tags', tag),

    updateTag: (id: string, tag: ContentTagUpdateRequest) =>
        cmsApiClient.put<ApiResponse<ContentTag>>(`/cms/tags/${id}`, tag),

    deleteTag: (id: string) =>
        cmsApiClient.delete<ApiResponse<void>>(`/cms/tags/${id}`),

    // Product selection-related
    getProductsForSelection: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => cmsApiClient.get<ApiResponse<ProductSelectionResponse>>('/cms/products', { params }),

    // New: product selection function using the search/products endpoint, replacing the one above
    getProductsForSearch: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => {
        // Create a mapping function from sortBy to sort_by
        const mapSortBy = (sortBy?: string): 'relevance' | 'price' | 'discount' | 'created' | undefined => {
            if (!sortBy) return undefined;
            // Map common sort fields
            switch (sortBy.toLowerCase()) {
                case 'title': return 'relevance';
                case 'price': return 'price';
                case 'discount': return 'discount';
                case 'created': case 'createdat': return 'created';
                default: return 'relevance';
            }
        };

        // Map params to the format required by searchProducts
        return productsApi.searchProducts({
            keyword: params?.search || '',
            page: params?.page,
            page_size: params?.limit,
            sort_by: mapSortBy(params?.sortBy),
            sort_order: params?.sortOrder,
            // If a category param is present, convert it to product_groups
            ...(params?.category && { product_groups: params.category })
        });
    },
};

export default api;