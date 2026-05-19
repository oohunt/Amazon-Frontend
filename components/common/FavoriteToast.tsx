/**
 * Favorites operation result toast component
 * Display a brief toast after a favorite/unfavorite action
 */

import { AlertTriangle, Heart } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface FavoriteToastProps {
    action: 'add' | 'remove';
    show: boolean;
    onHide: () => void;
    duration?: number;
    className?: string;
    type?: 'success' | 'error';
    message?: string;
    productTitle?: string;
}

/**
 * Favorites operation result toast component
 * @param action Action type: 'add' to add to favorites, 'remove' to remove from favorites
 * @param show Whether to show the toast
 * @param onHide Callback fired after the toast is hidden
 * @param duration Toast display duration in milliseconds, defaults to 3000ms
 * @param className Custom CSS class name
 * @param type Toast type: 'success' or 'error'. Defaults to 'success'
 * @param message Custom toast message; uses default message if not provided
 * @param productTitle Product title displayed in the toast
 */
const FavoriteToast: React.FC<FavoriteToastProps> = ({
    action,
    show,
    onHide,
    duration = 3000,
    className = '',
    type = 'success',
    message,
    productTitle = '',
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                onHide();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [show, duration, onHide]);

    if (!show && !isVisible) return null;

    const isError = type === 'error';
    const isAdding = action === 'add';

    // create default message containing product name
    const getDefaultMessage = () => {
        if (isError) {
            return 'Operation failed, please try again later';
        }

        const productName = productTitle
            ? `"${productTitle.length > 30 ? productTitle.substring(0, 30) + '...' : productTitle}"`
            : 'Product';

        return isAdding
            ? `${productName} added to favorites`
            : `${productName} removed from favorites`;
    };

    // Use custom message or default message
    const displayMessage = message || getDefaultMessage();

    // Style settings — enhance visual effect
    const bgColor = isError
        ? 'bg-red-50 dark:bg-red-900/50'
        : (isAdding ? 'bg-red-50 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-700/50');

    const textColor = isError
        ? 'text-red-600 dark:text-red-400'
        : (isAdding ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300');

    const borderColor = isError
        ? 'border-red-300 dark:border-red-700'
        : (isAdding ? 'border-red-200 dark:border-red-700/50' : 'border-gray-200 dark:border-gray-600');

    // create toast content
    const toastContent = (
        <div
            className={`fixed bottom-20 right-6 z-[999]
                px-5 py-3 rounded-lg shadow-lg border-2
                flex items-center space-x-3
                animate-favorite-success
                min-w-[280px] max-w-[400px]
                ${bgColor} ${textColor} ${borderColor} ${className}`}
            role="alert"
        >
            {isError ? (
                <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-500" />
            ) : (
                <Heart
                    className={`w-6 h-6 flex-shrink-0 ${isAdding ? 'text-red-500 fill-current' : 'text-gray-500'}`}
                />
            )}
            <span className="text-base font-medium flex-grow">{displayMessage}</span>
        </div>
    );

    // Use Portal to render Toast into body, ensuring it is above all elements
    // Use Portal only when rendering on client side
    if (typeof document !== 'undefined') {
        return createPortal(toastContent, document.body);
    }

    // Return content directly during SSR
    return toastContent;
};

export default FavoriteToast; 