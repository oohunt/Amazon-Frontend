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

// 修改cmsApiClient配置，添加动态baseURL决定
const cmsApiClient = axios.create({
    baseURL: isServer() ? SERVER_API_URL : '/api', // 根据环境使用正确的baseURL
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

// 添加请求拦截器确保使用本地URL
api.interceptors.request.use(
    (config) => {
        // 在服务器端运行时，除非请求URL包含特定路径
        if (isServer() && !config.url?.includes('/products/query')) {
            config.baseURL = API_BASE_URL;
        } else if (isServer()) {
            // 对于products/query请求，使用SERVER_API_URL
            config.baseURL = SERVER_API_URL;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 为cmsApiClient添加同样的拦截器
cmsApiClient.interceptors.request.use(
    (config) => {
        // 在服务器端运行时，强制使用本地URL
        if (isServer()) {
            config.baseURL = API_BASE_URL;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {


        return Promise.reject(error);
    }
);

// API endpoints
export const productsApi = {
    /**
     * 通过ASIN查询商品详情
     * 使用POST请求，支持更丰富的查询选项
     * @param params - 查询参数
     * @param params.asins - 商品ASIN码数组
     * @param params.include_metadata - 是否包含原始元数据
     * @param params.include_browse_nodes - 筛选特定的浏览节点ID数组
     * @returns API响应对象，包含商品数据
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
     * 批量查询商品详情
     * @param params - 查询参数
     * @param params.asins - 商品ASIN数组，最多50个
     * @param params.include_metadata - 是否包含原始元数据
     * @param params.include_browse_nodes - 筛选特定的浏览节点ID数组
     * @returns API响应对象，包含商品数据数组
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

    // 商品相关
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
            // 将前端参数映射到API参数
            const apiParams: Record<string, unknown> = { ...params };

            // 重命名一些参数以匹配API预期
            if (params?.limit) apiParams.page_size = params.limit;
            if (params?.sort_by) apiParams.sort_by = params.sort_by;
            if (params?.sort_order) apiParams.sort_order = params.sort_order;

            // 移除空的分类和品牌参数
            if (params?.brands === '') delete apiParams.brands;
            if (params?.product_groups === '') delete apiParams.product_groups;

            // 移除不需要的参数
            delete apiParams.limit;

            // 构建查询参数
            const queryParams = new URLSearchParams();

            // 添加所有查询参数
            Object.entries(apiParams).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, String(value));
                }
            });

            // 获取完整URL
            const queryString = queryParams.toString();
            // Server-side needs absolute URL; client-side uses relative /api path
            const baseUrl = isServer() ? SERVER_ORIGIN : '';
            const url = `${baseUrl}/api/products/list${queryString ? `?${queryString}` : ''}`;

            // 使用fetch API发起请求，利用Next.js的自动缓存
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();

            return {
                data: data
            };
        } catch {
            // 错误处理
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

    // CJ平台相关
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
     * 搜索产品
     * @param params 搜索参数
     * @param params.keyword 搜索关键词，必填
     * @param params.page 页码，从1开始
     * @param params.page_size 每页返回的产品数量，范围：1-100
     * @param params.sort_by 排序字段："relevance"、"price"、"discount"或"created"
     * @param params.sort_order 排序方向："asc"或"desc"
     * @param params.min_price 最低价格过滤
     * @param params.max_price 最高价格过滤
     * @param params.min_discount 最低折扣率过滤，范围：0-100
     * @param params.is_prime_only 是否只显示Prime商品
     * @param params.product_groups 商品分类过滤，多个分类用逗号分隔
     * @param params.brands 品牌过滤，多个品牌用逗号分隔
     * @param params.api_provider 数据来源过滤："pa-api"或"cj-api"
     * @returns API响应对象，包含搜索结果数据
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
            throw new Error('关键词是必填的搜索参数');
        }

        // 首先尝试解码关键词，确保它是原始未编码状态
        let cleanKeyword = params.keyword;

        try {
            // 尝试解码，看是否是编码过的
            while (cleanKeyword.includes('%')) {
                const decoded = decodeURIComponent(cleanKeyword);

                if (decoded === cleanKeyword) {
                    break; // 已经不能再解码了
                }
                cleanKeyword = decoded;
            }
        } catch {
            // 解码失败，保持原样
            cleanKeyword = params.keyword;
        }

        // 创建干净的参数对象，使用解码后的关键词并添加默认排序
        const cleanParams = {
            ...params,
            keyword: cleanKeyword,
            sort_order: params.sort_order || 'desc' // 设置默认排序为desc
        };

        // 不要在这里进行编码，让axios自动处理
        // axios会自动对URL参数进行编码
        return api.get<ApiResponse<ListResponse<Product>>>('/search/products', { params: cleanParams });
    },

    /**
     * 手动添加商品到数据库
     * @param productData - 符合 ProductInfo 结构的数据
     * @returns API响应对象，包含创建的商品信息
     */
    manualAddProduct: (productData: ProductInfo) => {
        // 使用api实例发送请求，让请求通过Next.js API路由
        return api.post<ApiResponse<ProductInfo>>('/products/manual', productData);
    },

    /**
     * 更新已存在的商品信息
     * @param asin - 商品的ASIN码
     * @param productData - 符合 ProductInfo 结构的更新数据
     * @returns API响应对象，包含更新后的商品信息
     */
    updateProduct: (asin: string, productData: ProductInfo) => {
        // 确保ASIN格式正确
        if (!asin || asin.length !== 10 || !/^[A-Z0-9]{10}$/i.test(asin)) {
            throw new Error('Invalid ASIN format. ASIN must be 10 alphanumeric characters.');
        }
        
        // 使用api实例发送请求，让请求通过Next.js API路由
        return api.put<ApiResponse<ProductInfo>>(`/products/${asin.toUpperCase()}`, productData);
    },
};

export const userApi = {
    getFavorites: () => api.get<ApiResponse<Product[]>>('/user/favorites'),
    addFavorite: (productId: string) => api.post<ApiResponse<void>>(`/user/favorites/${productId}`),
    removeFavorite: (productId: string) => api.delete<ApiResponse<void>>(`/user/favorites/${productId}`),

    // 用户偏好设置
    getPreferences: () => api.get<ApiResponse<Record<string, unknown>>>('/user/preferences'),
    updatePreferences: (preferences: Record<string, unknown>) => api.put<ApiResponse<void>>('/user/preferences', preferences),
};

export const systemApi = {
    /**
     * 获取系统健康状态和统计数据
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
     * 获取用户统计数据
     */
    getUserStats: () => api.get<ApiResponse<{
        total_users: number;
        active_users: number;
        new_users_last_month: number;
        last_update: string;
    }>>('/stats/users'),

    /**
     * 获取收藏统计数据
     */
    getFavoriteStats: () => api.get<ApiResponse<{
        total_favorites: number;
        unique_users: number;
        last_month_favorites: number;
        last_update: string;
    }>>('/stats/favorites'),
};

// CMS相关API
export const cmsApi = {
    // 内容页面相关
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

    // 内容分类相关
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

    // 内容标签相关
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

    // 产品选择相关
    getProductsForSelection: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => cmsApiClient.get<ApiResponse<ProductSelectionResponse>>('/cms/products', { params }),

    // 新增：使用search/products端点的产品选择函数，替代上面的函数
    getProductsForSearch: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => {
        // 创建sortBy到sort_by的映射函数
        const mapSortBy = (sortBy?: string): 'relevance' | 'price' | 'discount' | 'created' | undefined => {
            if (!sortBy) return undefined;
            // 映射常见的排序字段
            switch (sortBy.toLowerCase()) {
                case 'title': return 'relevance';
                case 'price': return 'price';
                case 'discount': return 'discount';
                case 'created': case 'createdat': return 'created';
                default: return 'relevance';
            }
        };

        // 将参数映射到searchProducts所需格式
        return productsApi.searchProducts({
            keyword: params?.search || '',
            page: params?.page,
            page_size: params?.limit,
            sort_by: mapSortBy(params?.sortBy),
            sort_order: params?.sortOrder,
            // 如果有category参数，则转换为product_groups
            ...(params?.category && { product_groups: params.category })
        });
    },
};

export default api;