// Amazon API product-related types
export interface AmazonOffer {
    condition: string;
    price: number;
    currency: string;
    savings: number | null;
    savings_percentage: number | null;
    is_prime: boolean;
    is_amazon_fulfilled: boolean;
    is_free_shipping_eligible: boolean;
    availability: string;
    merchant_name: string;
    is_buybox_winner: boolean;
    deal_type: string | null;
    coupon_type: string | null;
    coupon_value: number | null;
    coupon_history: Record<string, unknown> | null;
    commission: Record<string, unknown> | null;
}

export interface BrowseNode {
    id: string;
    name: string;
    is_root: boolean;
}

export interface AmazonProduct {
    asin: string;
    title: string;
    url: string;
    brand: string;
    main_image: string;
    offers: AmazonOffer[];
    timestamp: string;
    coupon_info: Record<string, unknown> | null;
    binding: string | null;
    product_group: string;
    categories: string[];
    browse_nodes: BrowseNode[];
    features: string[];
    cj_url: string | null;
    api_provider: string;
}

// Page response
export interface ProductResponse {
    items: AmazonProduct[];
    total: number;
    page: number;
    page_size: number;
}

// API response
export interface ApiResponse {
    status: number;
    message: string;
    data: ProductResponse;
} 