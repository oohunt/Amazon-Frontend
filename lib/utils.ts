/// <reference types="node" />

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { ComponentProduct } from '@/types';
import type { Product } from '@/types/api';

/**
 * Format price as currency display
 * @param price Price value
 * @param currency Currency code, defaults to USD
 * @returns Formatted price string
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(price);
}

/**
 * Calculate discount percentage
 * @param originalPrice Original price
 * @param currentPrice Current price
 * @returns Discount percentage
 */
export function calculateDiscount(originalPrice: number, currentPrice: number): number {
    if (originalPrice <= 0 || currentPrice >= originalPrice) return 0;

    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Truncate text
 * @param text Original text
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    return text.slice(0, maxLength) + '...';
}

/**
 * Format date
 * @param date Date object or timestamp
 * @returns Formatted date string
 */
export function formatDate(date: Date | number): string {
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(typeof date === 'number' ? new Date(date) : date);
}

/**
 * Format UTC time string for display in user's local timezone
 * @param utcDateString ISO string in UTC time
 * @param options Formatting options
 * @returns Formatted local time string
 */
export function formatUTCDateToLocal(
    utcDateString: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    }
): string {
    if (!utcDateString) return '';

    try {
        const date = new Date(utcDateString);

        if (isNaN(date.getTime())) return '';

        return new Intl.DateTimeFormat('zh-CN', {
            ...options,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }).format(date);
    } catch {
        return '';
    }
}

/**
 * Get current UTC time as ISO string
 * @returns ISO string in UTC time
 */
export function getCurrentUTCTimeString(): string {
    return new Date().toISOString();
}

/**
 * Generate random ID
 * @param length ID length
 * @returns Random ID string
 */
export function generateId(length: number = 8): string {
    return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Debounce function
 * @param func Function to execute
 * @param wait Wait time
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 * @param func Function to execute
 * @param limit Time limit
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Adapt API product data to frontend component format
 * @param apiProducts Product data returned from the API
 * @returns Adapted product data
 */
export function adaptProducts(apiProducts: Product[]): ComponentProduct[] {
    if (!apiProducts) {
        return [];
    }

    if (!Array.isArray(apiProducts)) {
        // If single object, try wrapping in array
        if (apiProducts && typeof apiProducts === 'object') {
            return adaptProducts([apiProducts as unknown as Product]);
        }

        return [];
    }

    return apiProducts.map(p => {
        if (!p) {
            return {
                id: 'unknown',
                title: 'Unknown product',
                price: 0,
                originalPrice: 0,
                discount: 0,
                image: '/placeholder-product.jpg',
                category: ''
            };
        }

        try {
            // Get main offer info
            const mainOffer = p.offers && p.offers.length > 0 ? p.offers[0] : null;

            // Get price info
            const price = mainOffer ? mainOffer.price : (p.price || 0);

            // Use original_price field returned by API directly
            let originalPrice = p.original_price || price;
            let discount = 0;

            // Prefer savings_percentage returned by API as discount rate
            if (mainOffer && mainOffer.savings_percentage) {
                discount = mainOffer.savings_percentage;
                // If no original price but has discount rate, calculate original price from discount rate
                if (originalPrice === price && discount > 0) {
                    originalPrice = Math.round(price / (1 - discount / 100) * 100) / 100;
                }
            }
            // If original_price exists, calculate discount
            else if (p.original_price && p.original_price > price) {
                discount = calculateDiscount(p.original_price, price);
            }
            // If no original_price but has discount_rate, use discount_rate
            else if (p.discount_rate) {
                discount = p.discount_rate;
                // If original price equals current price, calculate original price from discount rate
                if (originalPrice === price && discount > 0) {
                    originalPrice = Math.round(price / (1 - discount / 100) * 100) / 100;
                }
            }
            // If offer info exists but no original price or discount rate
            else if (mainOffer) {
                if (mainOffer.savings) {
                    originalPrice = price + mainOffer.savings;
                    // Calculate discount percentage
                    discount = Math.round((mainOffer.savings / originalPrice) * 100);
                }
            }

            // Get coupon info
            const couponValue = mainOffer?.coupon_value || 0;
            const couponType = mainOffer?.coupon_type || null;

            // Get image URL, handle different field names
            const imageUrl = p.main_image || p.image_url || (p as { image?: string }).image || '/placeholder-product.jpg';

            return {
                id: p.asin || p.id || '',
                title: p.title || '',
                price: price,
                originalPrice: originalPrice,
                discount: discount,
                image: imageUrl,
                category: p.product_group || p.binding || p.categories?.[0] || '',
                description: p.description || '',
                brand: p.brand || '',
                rating: p.rating || 0,
                reviews: p.reviews || 0,
                url: p.url || '',
                cj_url: p.cj_url || undefined,
                isPrime: mainOffer?.is_prime || false,
                isFreeShipping: mainOffer?.is_free_shipping_eligible || false,
                isAmazonFulfilled: mainOffer?.is_amazon_fulfilled || false,
                availability: mainOffer?.availability || 'Out of stock',
                couponValue: couponValue,
                couponType: couponType,
                apiProvider: p.api_provider,
                couponExpirationDate: p.coupon_expiration_date || null,
                couponTerms: p.coupon_terms || null,
                source: p.source || null
            };
        } catch {
            // return basic information
            return {
                id: p.asin || p.id || 'error',
                title: p.title || 'Data processing error',
                price: p.price || 0,
                originalPrice: p.original_price || p.price || 0,
                discount: 0,
                image: p.main_image || p.image_url || '/placeholder-product.jpg',
                category: ''
            };
        }
    });
}

/**
 * Generate URL slug from text
 * @param text Text to convert
 * @returns Generated slug
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove non-word/non-space/non-hyphen characters
        .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and hyphens with a single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
} 