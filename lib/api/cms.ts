import axios from 'axios';

import type { ApiResponse } from '@/types/api';
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
    ProductSelectionResponse,
    PageResponse
} from '@/types/cms';

// 服务器端环境下的BASE URL
const SERVER_API_URL = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api`
    : 'http://localhost:3004/api';
const isServer = () => typeof window === 'undefined';

// 为服务器端和客户端创建单独的API客户端
const apiClient = axios.create({
    baseURL: isServer() ? SERVER_API_URL : '/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// 添加请求拦截器，确保使用正确的URL
apiClient.interceptors.request.use((config) => {
    // 强制使用正确的URL格式
    if (isServer()) {
        // 确保服务器端使用的是完整URL
        if (!config.baseURL?.startsWith('http')) {
            config.baseURL = SERVER_API_URL;
        }

        // 确保baseURL后面不要有多余的/api，因为URL路径已经包含/api
        if (config.baseURL.endsWith('/api') && config.url?.startsWith('/api')) {
            // 去掉URL路径开头的/api，避免重复
            config.url = config.url.replace(/^\/api/, '');
        }
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// 从主API模块导出CMS相关API
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
    }) => apiClient.get<ApiResponse<ContentPageListResponse>>('/cms/pages', { params }),

    getPageById: (id: string) =>
        apiClient.get<ApiResponse<PageResponse>>(`/cms/pages/${id}`),

    getPageBySlug: (slug: string) =>
        apiClient.get<ApiResponse<ContentPage>>(`/cms/content/${slug}`),

    createPage: (page: ContentPageCreateRequest) =>
        apiClient.post<ApiResponse<ContentPage>>('/cms/pages', page),

    updatePage: (id: string, page: ContentPageUpdateRequest) =>
        apiClient.put<ApiResponse<ContentPage>>(`/cms/pages/${id}`, page),

    deletePage: (id: string) =>
        apiClient.delete<ApiResponse<void>>(`/cms/pages/${id}`),

    // 内容分类相关
    getCategories: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        parentId?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => apiClient.get<ApiResponse<ContentCategoryListResponse>>('/cms/categories', { params }),

    getCategoryById: (id: string) =>
        apiClient.get<ApiResponse<ContentCategory>>(`/cms/categories/${id}`),

    getCategoryBySlug: (slug: string) =>
        apiClient.get<ApiResponse<ContentCategory>>(`/cms/categories/slug/${slug}`),

    createCategory: (category: ContentCategoryCreateRequest) =>
        apiClient.post<ApiResponse<ContentCategory>>('/cms/categories', category),

    updateCategory: (id: string, category: ContentCategoryUpdateRequest) =>
        apiClient.put<ApiResponse<ContentCategory>>(`/cms/categories/${id}`, category),

    deleteCategory: (id: string) =>
        apiClient.delete<ApiResponse<void>>(`/cms/categories/${id}`),

    // 内容标签相关
    getTags: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => apiClient.get<ApiResponse<ContentTagListResponse>>('/cms/tags', { params }),

    getTagById: (id: string) =>
        apiClient.get<ApiResponse<ContentTag>>(`/cms/tags/${id}`),

    getTagBySlug: (slug: string) =>
        apiClient.get<ApiResponse<ContentTag>>(`/cms/tags/slug/${slug}`),

    createTag: (tag: ContentTagCreateRequest) =>
        apiClient.post<ApiResponse<ContentTag>>('/cms/tags', tag),

    updateTag: (id: string, tag: ContentTagUpdateRequest) =>
        apiClient.put<ApiResponse<ContentTag>>(`/cms/tags/${id}`, tag),

    deleteTag: (id: string) =>
        apiClient.delete<ApiResponse<void>>(`/cms/tags/${id}`),

    // 产品选择相关
    getProductsForSelection: (params?: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }) => apiClient.get<ApiResponse<ProductSelectionResponse>>('/cms/products', { params }),
};

export default cmsApi; 