import {
    Modal,
    ModalContent,
    ModalHeader,
    Input,
    Button,
    ScrollShadow
} from '@heroui/react';
import { debounce } from 'lodash';
import { Search } from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import useSWR from 'swr';

import { showErrorToast } from '@/lib/toast';
import type { ComponentProduct } from '@/types';
import type { Product as ApiProduct, ListResponse, ProductOffer } from '@/types/api';

import { PRODUCT_STYLES, type ProductAttributes } from './ProductBlot';
import ProductCard from './ProductCard';

/**
 * Product data interface (explicitly define required fields and make them optional)
 */
interface Product { // No longer extends ApiProduct, explicitly defined
    id?: string;
    title?: string;
    price?: number;
    main_image?: string;
    image_url?: string;
    image?: string; // Keep just in case
    images?: string[];
    sku?: string;
    asin?: string;
    url?: string;
    cj_url?: string | null; // Allow null
    brand?: string | null;
    original_price?: number | null;
    discount?: number | null;
    discount_percentage?: number | null; // Added discount_percentage
    coupon_type?: 'percentage' | 'fixed' | null;
    coupon_value?: number | null;
    coupon_expiration_date?: string | null;
    is_prime?: boolean | null;
    is_free_shipping?: boolean | null;
    is_free_shipping_eligible?: boolean | null; // Added for compatibility
    category?: string;
    offers?: ProductOffer[]; // Changed from ApiProduct to ProductOffer
    coupon_history?: {
        coupon_type?: 'percentage' | 'fixed' | null;
        coupon_value?: number | null;
        expiration_date?: string | null;
    };
    product_group?: string;
    binding?: string;
    categories?: string[];
}

/**
 * Product Picker Modal Props
 */
interface ProductPickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductSelect: (product: ComponentProduct) => void;
}

/**
 * Product Picker Modal Component
 * Used to select and insert products in the rich text editor
 */
const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
    isOpen,
    onClose,
    onProductSelect
}) => {
    // Product list and search state
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState('card'); // Default card style
    const scrollRef = useRef<HTMLDivElement>(null);
    const pageSize = 20; // Load 20 products per page

    // Reset search and pagination state
    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1);
            setProducts([]);
        }
    }, [isOpen, debouncedSearchTerm]);

    // Build request URL
    const apiUrl = `/api/search/products?keyword=${encodeURIComponent(debouncedSearchTerm || '')}&page=${currentPage}&page_size=${pageSize}`;

    // Use SWR to fetch data
    const { data, error, isLoading } = useSWR<ApiResponse<ListResponse<ApiProduct>>>(
        isOpen ? apiUrl : null, // Only request when modal is open
        async (url) => {
            const res = await fetch(url);

            if (!res.ok) {
                const error = new Error('Error fetching product data');

                error.message = await res.text();
                throw error;
            }

            return res.json();
        },
        {
            revalidateOnFocus: false, // Don't revalidate on focus
            dedupingInterval: 2000, // Deduplicate requests within 2 seconds
        }
    );

    // Handle SWR data
    useEffect(() => {
        if (data?.data) {
            const newProducts = data.data.items || [];

            // Carefully cast the products to the correct type to fix the type error
            setProducts(prev =>
                currentPage === 1 ? newProducts as Product[] : [...prev, ...(newProducts as Product[])]
            );
            setTotalPages(Math.ceil((data.data.total || 0) / pageSize));
            setIsLoadingMore(false);
        }
    }, [data, currentPage, pageSize]);

    // Handle SWR error
    useEffect(() => {
        if (error) {
            showErrorToast({
                title: 'Failed to fetch products',
                description: error.message || 'Unable to fetch product data'
            });
            setIsLoadingMore(false);
        }
    }, [error]);

    // Debounce search input
    useEffect(() => {
        const handler = debounce(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset page number on search
            setProducts([]); // Clear loaded products
        }, 500); // 500ms debounce

        handler();

        // Cleanup function
        return () => {
            handler.cancel();
        };
    }, [searchTerm]);

    // Handle scroll to load more
    const handleScroll = useCallback(() => {
        if (scrollRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

            // Load more when scrolled to within 100px of the bottom
            if (scrollHeight - scrollTop - clientHeight < 100 &&
                !isLoading &&
                !isLoadingMore &&
                currentPage < totalPages) {
                setIsLoadingMore(true);
                setCurrentPage(prev => prev + 1);
            }
        }
    }, [isLoading, isLoadingMore, currentPage, totalPages]);

    // Handle product selection
    const handleProductSelect = (product: Product) => {
        // Get offer information from the offers array
        const mainOffer = product.offers && product.offers.length > 0 ? product.offers[0] : null;
        // Get coupon information
        const couponType = product.coupon_type || mainOffer?.coupon_type || product.coupon_history?.coupon_type || null;
        const couponValue = product.coupon_value || mainOffer?.coupon_value || product.coupon_history?.coupon_value || 0;
        // Calculate or use existing discount percentage
        const discountPercentage = product.discount_percentage ||
            (product.original_price && product.price ?
                Math.round(((product.original_price - product.price) / product.original_price) * 100) : null);

        // Extract all needed attributes
        const attributes: ProductAttributes = {
            id: product.id || product.asin || '',
            title: product.title || 'Unnamed Product',
            price: mainOffer?.price || product.price || 0,
            image: product.main_image || product.image_url || product.images?.[0] || '/placeholder-product.jpg',
            asin: product.asin || '',
            style: selectedStyle, // Use selected style
            url: product.url || '',
            cj_url: product.cj_url || '',
            brand: product.brand ?? null,
            originalPrice: product.original_price || null,
            discount: discountPercentage ?? product.discount ?? null, // Use calculated or existing discount percentage
            couponType: couponType as 'percentage' | 'fixed' | null,
            couponValue: couponValue,
            couponExpirationDate: product.coupon_expiration_date || product.coupon_history?.expiration_date || null,
            isPrime: product.is_prime ?? mainOffer?.is_prime ?? null,
            isFreeShipping: product.is_free_shipping ?? mainOffer?.is_free_shipping_eligible ?? null,
            category: product.categories?.[0] || product.product_group || product.binding || ''
        };

        onProductSelect(attributes as ComponentProduct);
        onClose();
    };

    // Determine grid columns
    const getGridColumns = () => {
        // Dynamically adjust column count based on screen size and card size
        switch (true) {
            case products.length <= 4:
                return 'grid-cols-1 sm:grid-cols-2';
            default:
                return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            disableAnimation={false}
            classNames={{
                backdrop: "z-[9998]",
                base: "z-[9999]",
                wrapper: "z-[9999]"
            }}
            size="3xl" // Adjust modal size
        >
            <ModalContent className="max-h-[80vh] overflow-hidden">
                <ModalHeader>
                    <h3 className="text-lg font-medium">Select Product</h3>
                </ModalHeader>

                {/* Search box */}
                <div className="relative mb-4 px-4">
                    <Search className="absolute left-6 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search for product name or SKU..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Product list - use scroll event to load more */}
                <ScrollShadow
                    ref={scrollRef}
                    className="h-[400px] px-4"
                    onScroll={handleScroll}
                >
                    {isLoading && products.length === 0 ? (
                        <div className="flex justify-center items-center h-40">
                            <p>Loading...</p>
                        </div>
                    ) : products.length === 0 && debouncedSearchTerm ? (
                        <div className="flex justify-center items-center h-40">
                            <p>No related products found</p>
                        </div>
                    ) : products.length === 0 && !debouncedSearchTerm ? (
                        <div className="flex justify-center items-center h-40">
                            <p>Please enter a keyword to search for products</p>
                        </div>
                    ) : (
                        <div className={`grid ${getGridColumns()} gap-3`}>
                            {products.map((product, index) => (
                                <ProductCard
                                    key={`${product.id || product.asin || index}`}
                                    product={product as ProductCardProduct}
                                    onClick={(p) => handleProductSelect(p as Product)}
                                    size="medium"
                                />
                            ))}
                        </div>
                    )}

                    {/* Load more indicator */}
                    {isLoadingMore && (
                        <div className="flex justify-center py-4">
                            <p className="text-sm text-gray-500">Loading more products...</p>
                        </div>
                    )}

                    {/* Pagination info */}
                    {products.length > 0 && (
                        <div className="text-center py-2 text-xs text-gray-500">
                            {currentPage} / {totalPages} pages · Total {data?.data?.total || 0} products
                        </div>
                    )}
                </ScrollShadow>

                {/* Footer action area */}
                <div className="flex justify-between items-center mt-4 px-4 pb-2 border-t pt-3">
                    {/* Add style selector */}
                    <div className="flex items-center">
                        <span className="text-sm mr-2">Display style:</span>
                        <select
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className="w-32 text-sm py-1 px-2 border rounded"
                        >
                            {PRODUCT_STYLES.map(style => (
                                <option key={style.id} value={style.id}>
                                    {style.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button variant="light" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </ModalContent>
        </Modal>
    );
};

export default ProductPickerModal;

interface ApiResponse<T> {
    status: boolean;
    message?: string;
    data: T;
    error?: string;
}

// Define product type accepted by ProductCard component
type ProductCardProduct = {
    id?: string;
    title?: string;
    price?: number;
    main_image?: string;
    image_url?: string;
    image?: string;
    images?: string[];
    sku?: string;
    asin?: string;
    brand?: string | null;
    original_price?: number | null;
    discount?: number | null;
    discount_percentage?: number | null;
    coupon_type?: 'percentage' | 'fixed' | null;
    coupon_value?: number | null;
    offers?: Array<{
        coupon_type?: 'percentage' | 'fixed' | null;
        coupon_value?: number | null;
        price?: number;
        original_price?: number | null;
    }>;
    coupon_history?: {
        coupon_type?: 'percentage' | 'fixed' | null;
        coupon_value?: number;
    };
}; 