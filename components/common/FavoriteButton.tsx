/**
 * Favorite button component
 * Display a favorite button on product cards or detail pages
 */

import { Heart } from 'lucide-react';
import React, { memo, useState } from 'react';

import { useProductFavorite } from '@/lib/favorites';

import FavoriteToast from './FavoriteToast';

interface FavoriteButtonProps {
    productId: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    withText?: boolean;
    withAnimation?: boolean;
    withToast?: boolean;
    productTitle?: string;
}

/**
 * Favorite button component
 * @param productId Product ID
 * @param className Custom CSS class name
 * @param size Button size: sm, md, or lg
 * @param withText Whether to show text
 * @param withAnimation Whether to enable animation
 * @param withToast Whether to show a toast notification, defaults to true
 * @param productTitle Product title displayed in the toast
 */
const FavoriteButton: React.FC<FavoriteButtonProps> = ({
    productId,
    className = '',
    size = 'md',
    withText = false,
    withAnimation = true,
    withToast = true,
    productTitle = '',
}) => {
    // Use custom hook to get product favorites state and toggle method
    const { isFavorite, toggleFavorite, isUpdating } = useProductFavorite(productId);
    const [animateHeartbeat, setAnimateHeartbeat] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [lastAction, setLastAction] = useState<'add' | 'remove'>('add');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    // Determine icon size based on size
    const iconSize = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
    }[size];

    // Determine button styles based on size
    const buttonSize = {
        sm: 'p-1.5',
        md: 'p-2',
        lg: 'p-2.5',
    }[size];

    // Animation class names
    const animationClass = withAnimation
        ? 'transition-all duration-300 ease-in-out hover:scale-110 active:scale-95'
        : '';

    // Heartbeat animation class names
    const heartbeatClass = animateHeartbeat
        ? 'animate-heartbeat'
        : '';

    // Click handler
    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Avoid duplicate clicks
        if (isUpdating) return;

        // Set operation type
        const actionType = isFavorite ? 'remove' : 'add';

        setLastAction(actionType);

        // If adding to favorites, trigger heartbeat animation
        if (!isFavorite) {
            setAnimateHeartbeat(true);
            setTimeout(() => setAnimateHeartbeat(false), 1000);
        }

        // Execute favorites operation
        const result = await toggleFavorite();

        // show toast
        if (withToast) {
            setToastType(result.success ? 'success' : 'error');
            setToastMessage(result.message);
            setShowToast(true);
        }
    };

    // callback function to hide toast
    const handleHideToast = () => {
        setShowToast(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={handleClick}
                disabled={isUpdating}
                className={`flex items-center justify-center rounded-full 
                    ${buttonSize} 
                    ${animationClass}
                    ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}
                    ${isUpdating ? 'opacity-70 cursor-wait' : ''}
                    ${className}`}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
                <Heart
                    className={`${iconSize} ${heartbeatClass} transition-transform duration-300`}
                    fill={isFavorite ? "currentColor" : "none"}
                />

                {withText && (
                    <span className={`ml-1 text-sm transition-all duration-300 ${isFavorite ? 'font-medium' : ''}`}>
                        {isUpdating ? 'Processing...' : (isFavorite ? 'Favorited' : 'Favorite')}
                    </span>
                )}
            </button>

            {withToast && (
                <FavoriteToast
                    action={lastAction}
                    show={showToast}
                    onHide={handleHideToast}
                    type={toastType}
                    message={toastMessage}
                    productTitle={productTitle}
                />
            )}
        </>
    );
};

export default memo(FavoriteButton); 