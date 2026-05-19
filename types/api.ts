/**
 * Generic API response type
 */
export interface ApiResponse<T = unknown> {
    status: number;
    success: boolean;
    message?: string;
    data?: T;
}

/**
 * Pagination response parameters
 */
export interface PaginationResponse {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

// FastAPI pagination response type
export interface ListResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
}

// Amazon product offer information
export interface ProductOffer {
    condition: string;
    price: number;
    currency: string;
    savings?: number | null;
    savings_percentage?: number | null;
    is_prime?: boolean;
    is_amazon_fulfilled?: boolean;
    is_free_shipping_eligible?: boolean;
    availability?: string;
    merchant_name?: string;
    is_buybox_winner?: boolean;
    deal_type?: string | null;
    coupon_type?: string | null;
    coupon_value?: number | null;
    coupon_history?: Record<string, unknown> | null;
    commission?: Record<string, unknown> | null;
}

// Browse node type
export interface BrowseNode {
    id: string;
    name: string;
    is_root: boolean;
}

// Product-related types
export interface Product {
    asin?: string;
    id?: string;
    title: string;
    description?: string;
    features?: string[];
    brand?: string;
    price?: number;
    original_price?: number;
    discount_rate?: number;
    rating?: number;
    rating_count?: number;
    reviews?: number;
    main_image?: string;
    image_url?: string;
    images?: string[];
    product_group?: string;
    binding?: string;
    categories?: string[];
    rank?: number;
    availability?: string;
    url?: string;
    cj_url?: string | null;
    offers?: ProductOffer[];
    browse_nodes?: BrowseNode[];
    timestamp?: string;
    coupon_info?: Record<string, unknown>;
    api_provider?: string;
    coupon_expiration_date?: string;
    coupon_terms?: string;
    source?: string;
}

export interface ComponentProduct {
    id: string;
    title: string;
    description: string;
    price: number;
    originalPrice: number;
    discount: number;
    image: string;
    category: string;
    brand: string;
    rating: number;
    reviews: number;
    url: string;
    cj_url: string | null;
    isPrime: boolean;
    isFreeShipping: boolean;
    isAmazonFulfilled: boolean;
    availability: string;
    couponValue: number;
    couponType: string | null;
    apiProvider: string;
}

export interface PriceHistory {
    date: string;
    price: number;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
}

// CJ platform-related types
export interface CJProduct extends Omit<Product, 'id' | 'type'> {
    pid: string;
    shipping_price: number;
}

// Category statistics interface
export interface CategoryStats {
    browse_nodes: {
        [key: string]: {
            name?: string;
            count?: number;
            products?: number;
            children?: { [key: string]: string };
            parent?: string;
            [key: string]: unknown;
        }
    };
    browse_tree: Record<string, unknown>;
    bindings: { [key: string]: number };
    product_groups: { [key: string]: number };
    total_categories?: number;
}

// Product statistics interface
export interface ProductStats {
    total_products: number;
    discount_products: number;
    coupon_products: number;
    prime_products: number;
    avg_discount: number;
    avg_price: number;
    min_price: number;
    max_price: number;
}

// Brand statistics interface
export interface BrandStats {
    brands: { [brand: string]: number };
    total_brands: number;
    pagination: {
        page: number;
        page_size: number;
        total_count: number;
        total_pages: number;
    };
}

import type { UserRole } from '@/lib/models/UserRole';

/**
 * Interface definition for user items
 */
export interface UserItem {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image?: string;
    createdAt: string | Date;
    updatedAt?: string | Date;
    lastLogin?: string | Date;
    provider?: string;
    status?: 'active' | 'inactive' | 'disabled';
}

/**
 * Interface definition for product items
 */
export interface ProductItem {
    id: string;
    name: string;
    description?: string;
    sku?: string;
    price?: number;
    stockQuantity?: number;
    image?: string;
    status?: 'active' | 'draft' | 'inactive';
    categories?: string[];
    createdAt: string | Date;
    updatedAt?: string | Date;
    createdBy?: string;
    featured?: boolean;
    discount?: number;
}

/**
 * Email subscription item interface definition
 */
export interface EmailItem {
    id: string;
    email: string;
    subscribedAt: string;
    isActive: boolean;
}

/**
 * Interface definition for contact form messages
 */
export interface ContactMessage {
    id: string;
    name: string;
    email: string;
    message: string;
    subject?: string;
    phone?: string;
    createdAt: string;
    isProcessed: boolean;
    processedAt?: string;
    notes?: string;
    formSource?: 'general' | 'blog' | string;
    formId?: string;
}

// Social media link configuration
export interface SocialLinks {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    pinterest?: string;
    youtube?: string;
    linkedin?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Request body structure for manually adding products
 * Based on /api/products/manual API documentation
 * Note: reuses the existing ProductOffer interface definition
 */
export interface ProductInfo {
    asin: string; // Unique ASIN for the product (required)
    title: string; // Product title (required)
    url: string; // Amazon link for the product (required)
    offers: ProductOffer[]; // Array containing at least one ProductOffer object (required)
    brand?: string; // Brand name (optional)
    main_image?: string; // Main image link (optional)
    timestamp?: string; // Data collection timestamp (ISO 8601 format) (optional)
    binding?: string; // Product binding type (optional)
    product_group?: string; // Product group (optional)
    categories?: string[]; // Product category path list (string array) (optional)
    browse_nodes?: Array<{ id: string; name: string;[key: string]: unknown }>; // Amazon browse node info list (optional)
    features?: string[]; // Product features list (string array) (optional)
    cj_url?: string; // CJ affiliate link (optional)
    api_provider?: string; // API provider identifier (default "manual") (optional)
    source?: string; // Data source identifier (default: "manual") (optional)
    coupon_expiration_date?: string; // Coupon expiry date (ISO 8601 format) (optional)
    coupon_terms?: string; // Coupon usage terms (optional)
    raw_data?: Record<string, unknown>; // JSON object containing raw data (optional)
} 