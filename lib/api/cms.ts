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

// BASE URL for the server-side environment
const SERVER_API_URL = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api`
    : 'http://localhost:3004/api';
const isServer = () => typeof window === 'undefined';

// Create separate API clients for server-side and client-side
const apiClient = axios.create({
    baseURL: isServer() ? SERVER_API_URL : '/api',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

// Add request interceptor to ensure the correct URL is used
apiClient.interceptors.request.use((config) => {
    // Force correct URL format
    if (isServer()) {
        // Ensure server-side uses a full URL
        if (!config.baseURL?.startsWith('http')) {
            config.baseURL = SERVER_API_URL;
        }

        // Ensure the baseURL does not have a redundant /api since the URL path already includes /api
        if (config.baseURL.endsWith('/api') && config.url?.startsWith('/api')) {
            // Remove the leading /api from the URL path to avoid duplication
            config.url = config.url.replace(/^\/api/, '');
        }
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

// Export CMS-related API from the main API module
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

    // Content category-related
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

    // Content tag-related
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

    // Product selection-related
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