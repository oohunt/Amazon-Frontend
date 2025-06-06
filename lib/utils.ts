/// <reference types="node" />

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { ComponentProduct } from '@/types';
import type { Product } from '@/types/api';

/**
 * 格式化价格为货币显示格式
 * @param price 价格数值
 * @param currency 货币代码，默认USD
 * @returns 格式化后的价格字符串
 */
export function formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(price);
}

/**
 * 计算折扣百分比
 * @param originalPrice 原价
 * @param currentPrice 现价
 * @returns 折扣百分比
 */
export function calculateDiscount(originalPrice: number, currentPrice: number): number {
    if (originalPrice <= 0 || currentPrice >= originalPrice) return 0;

    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * 截断文本
 * @param text 原文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    return text.slice(0, maxLength) + '...';
}

/**
 * 格式化日期
 * @param date 日期对象或时间戳
 * @returns 格式化后的日期字符串
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
 * 格式化UTC时间字符串为用户本地时区显示
 * @param utcDateString UTC时间的ISO字符串
 * @param options 格式化选项
 * @returns 格式化后的本地时间字符串
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
 * 获取当前UTC时间的ISO字符串
 * @returns UTC时间的ISO字符串
 */
export function getCurrentUTCTimeString(): string {
    return new Date().toISOString();
}

/**
 * 生成随机ID
 * @param length ID长度
 * @returns 随机ID字符串
 */
export function generateId(length: number = 8): string {
    return Math.random().toString(36).substring(2, length + 2);
}

/**
 * 防抖函数
 * @param func 要执行的函数
 * @param wait 等待时间
 * @returns 防抖后的函数
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
 * 节流函数
 * @param func 要执行的函数
 * @param limit 时间限制
 * @returns 节流后的函数
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
 * 适配API产品数据为前端组件格式
 * @param apiProducts API返回的产品数据
 * @returns 适配后的产品数据
 */
export function adaptProducts(apiProducts: Product[]): ComponentProduct[] {
    if (!apiProducts) {
        return [];
    }

    if (!Array.isArray(apiProducts)) {
        // 如果是单个对象，尝试包装为数组
        if (apiProducts && typeof apiProducts === 'object') {
            return adaptProducts([apiProducts as unknown as Product]);
        }

        return [];
    }

    return apiProducts.map(p => {
        if (!p) {
            return {
                id: 'unknown',
                title: '未知商品',
                price: 0,
                originalPrice: 0,
                discount: 0,
                image: '/placeholder-product.jpg',
                category: ''
            };
        }

        try {
            // 获取主要优惠信息
            const mainOffer = p.offers && p.offers.length > 0 ? p.offers[0] : null;

            // 获取价格信息
            const price = mainOffer ? mainOffer.price : (p.price || 0);

            // 直接使用API返回的original_price字段
            let originalPrice = p.original_price || price;
            let discount = 0;

            // 优先使用API返回的savings_percentage作为折扣率
            if (mainOffer && mainOffer.savings_percentage) {
                discount = mainOffer.savings_percentage;
                // 如果没有原价但有折扣率，根据折扣率计算原价
                if (originalPrice === price && discount > 0) {
                    originalPrice = Math.round(price / (1 - discount / 100) * 100) / 100;
                }
            }
            // 如果有original_price，计算折扣
            else if (p.original_price && p.original_price > price) {
                discount = calculateDiscount(p.original_price, price);
            }
            // 如果没有original_price但有discount_rate，使用discount_rate
            else if (p.discount_rate) {
                discount = p.discount_rate;
                // 如果原价和当前价格相同，根据折扣率计算原价
                if (originalPrice === price && discount > 0) {
                    originalPrice = Math.round(price / (1 - discount / 100) * 100) / 100;
                }
            }
            // 如果有优惠信息，但没有原价和折扣率
            else if (mainOffer) {
                if (mainOffer.savings) {
                    originalPrice = price + mainOffer.savings;
                    // 计算折扣百分比
                    discount = Math.round((mainOffer.savings / originalPrice) * 100);
                }
            }

            // 获取优惠券信息
            const couponValue = mainOffer?.coupon_value || 0;
            const couponType = mainOffer?.coupon_type || null;

            // 获取图片URL，处理不同的字段名
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
                availability: mainOffer?.availability || '无库存',
                couponValue: couponValue,
                couponType: couponType,
                apiProvider: p.api_provider,
                couponExpirationDate: p.coupon_expiration_date || null,
                couponTerms: p.coupon_terms || null,
                source: p.source || null
            };
        } catch {
            // 返回基本信息
            return {
                id: p.asin || p.id || 'error',
                title: p.title || '数据处理错误',
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
 * 根据文本生成URL slug
 * @param text 要转换的文本
 * @returns 生成的slug
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // 移除非单词/空格/连字符的字符
        .replace(/[\s_-]+/g, '-') // 将空格、下划线和连字符替换为单个连字符
        .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
} 