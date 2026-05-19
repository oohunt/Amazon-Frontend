/**
 * CMS content page model
 */
export interface ContentPage {
    _id?: string;
    title: string;          // Page title, used for H1 and SEO
    slug: string;           // SEO-friendly URL path
    content: string;        // Rich text HTML content
    excerpt?: string;       // Content summary for SEO description
    featuredImage?: string; // Featured imageURL
    categories: string[];   // Category list
    tags: string[];         // Tag list
    author: string;         // Author ID
    status: 'draft' | 'published' | 'archived'; // Page status
    publishedAt?: Date;     // Publish date
    createdAt: Date;        // Created date
    updatedAt: Date;        // Update date
    metaTitle?: string;     // SEO title, takes precedence over title
    metaDescription?: string; // SEO description, takes precedence over excerpt
    metaKeywords?: string;  // SEO keywords, comma-separated
    canonicalUrl?: string;  // Canonical URL
    ogImage?: string;       // Open Graph image URL
    seoData?: {             // Legacy SEO data (kept for backward compatibility)
        metaTitle?: string;
        metaDescription?: string;
        canonicalUrl?: string;
        ogImage?: string;
    };
    productIds?: string[];  // Associated product ID list
}

/**
 * Content category model
 */
export interface ContentCategory {
    _id?: string;
    name: string;           // Category name
    slug: string;           // SEO-friendly URL path
    description?: string;   // Category description
    parentId?: string | null; // Parent category ID for hierarchy
    createdAt: Date;
    updatedAt: Date;
    postCount?: number; // Add postCount field
}

/**
 * Content tag model
 */
export interface ContentTag {
    _id?: string;
    name: string;           // Tag name
    slug: string;           // SEO-friendly URL path
    createdAt: Date;
    updatedAt: Date;
    postCount?: number; // Add postCount field
}

/**
 * Content page list response
 */
export interface ContentPageListResponse {
    pages: ContentPage[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
}

/**
 * Content category list response
 */
export interface ContentCategoryListResponse {
    categories: ContentCategory[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
}

/**
 * Content tag list response
 */
export interface ContentTagListResponse {
    tags: ContentTag[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
}

/**
 * Content page create request
 */
export type ContentPageCreateRequest = Omit<ContentPage, '_id' | 'createdAt' | 'updatedAt'>;

/**
 * Content page update request
 */
export type ContentPageUpdateRequest = Partial<Omit<ContentPage, '_id' | 'createdAt' | 'updatedAt'>>;

/**
 * Content category create request
 */
export type ContentCategoryCreateRequest = Omit<ContentCategory, '_id' | 'createdAt' | 'updatedAt'>;

/**
 * Content category update request
 */
export type ContentCategoryUpdateRequest = Partial<Omit<ContentCategory, '_id' | 'createdAt' | 'updatedAt'>>;

/**
 * Content tag create request
 */
export type ContentTagCreateRequest = Omit<ContentTag, '_id' | 'createdAt' | 'updatedAt'>;

/**
 * Content tag update request
 */
export type ContentTagUpdateRequest = Partial<Omit<ContentTag, '_id' | 'createdAt' | 'updatedAt'>>;

/**
 * Response for product selection
 */
export interface ProductSelectionResponse {
    products: Array<{
        id: string;
        asin?: string;
        title: string;
        image?: string;
        price?: number;
        rating?: number;
    }>;
    totalPages: number;
    currentPage: number;
    totalItems: number;
}

/**
 * Page details response
 */
export type PageResponse = ContentPage; 