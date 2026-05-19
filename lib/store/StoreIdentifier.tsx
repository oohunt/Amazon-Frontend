import React from 'react';

import { getStoreFromUrl } from './utils';

interface StoreIdentifierProps {
    url: string;
    showName?: boolean;
    className?: string;
    align?: 'left' | 'right';
    apiProvider?: string;
}

/**
 * Store identifier component for displaying store icon and name
 */
export const StoreIdentifier: React.FC<StoreIdentifierProps> = ({
    url,
    showName = true,
    className = '',
    align = 'left',
    apiProvider
}) => {
    const store = getStoreFromUrl(url, apiProvider);

    if (store.name === 'Amazon') {
        return (
            <span className={`inline-flex items-center align-middle ${align === 'right' ? 'justify-end' : ''} ${className.includes('mb-') ? '' : ''} ${className}`}>
                {store.icon}
            </span>
        );
    } else if (store.icon) {
        return (
            <span className={`inline-flex items-center align-middle ${align === 'right' ? 'justify-end' : ''} ${className.includes('mb-') ? '' : ''} ${className}`}>
                <span
                    className="w-5 h-5 rounded-full inline-flex items-center justify-center mr-1.5 flex-shrink-0"
                    style={{ backgroundColor: store.color }}
                >
                    {store.icon}
                </span>
                {showName && (
                    <span className="text-xs font-medium text-secondary dark:text-gray-400">
                        {store.name}
                    </span>
                )}
            </span>
        );
    }

    return null;
}; 