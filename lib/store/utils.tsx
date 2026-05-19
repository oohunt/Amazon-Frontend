import type { ReactNode } from 'react';

import { AmazonLogo, WalmartIcon, BestBuyIcon, GenericStoreIcon } from './icons';

export interface StoreInfo {
    name: string;
    color: string;
    icon: ReactNode;
}

/**
 * Determine store source from product URL or API provider
 * @param url Product URL
 * @param apiProvider API provider (optional)
 * @returns Store info including name, color and icon
 */
export const getStoreFromUrl = (url: string, apiProvider?: string): StoreInfo => {
    // Prefer determining based on apiProvider
    if (apiProvider === 'amazon' || apiProvider === 'pa-api') {
        return {
            name: 'Amazon',
            color: '#FF9900',
            icon: <AmazonLogo />
        };
    }

    if (!url) return { name: 'Online Store', color: '#6c757d', icon: <GenericStoreIcon /> };

    if (url.includes('amazon.com')) {
        return {
            name: 'Amazon',
            color: '#FF9900',
            icon: <AmazonLogo />
        };
    }

    if (url.includes('walmart.com')) {
        return {
            name: 'Walmart',
            color: '#0071DC',
            icon: <WalmartIcon />
        };
    }

    if (url.includes('bestbuy.com')) {
        return {
            name: 'Best Buy',
            color: '#0046BE',
            icon: <BestBuyIcon />
        };
    }

    // Extract domain from URL as store name
    try {
        const domain = new URL(url).hostname.replace('www.', '');

        return {
            name: domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
            color: '#6c757d',
            icon: <GenericStoreIcon />
        };
    } catch {
        return {
            name: 'Online Store',
            color: '#6c757d',
            icon: <GenericStoreIcon />
        };
    }
}; 