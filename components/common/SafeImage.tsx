'use client';

import NextImage, { type ImageProps } from 'next/image';
import React, { useState } from 'react';

// Define Props received by SafeImage component, extending from next/image's ImageProps
interface SafeImageProps extends ImageProps {
    // Custom props can be added here, such as placeholder style or component
    placeholderClassName?: string;
}

/**
 * SafeImage component
 * @description A client component wrapping next/image to handle image load errors (onError).
 * When an image fails to load, a placeholder is rendered.
 * @param {SafeImageProps} props - Component props, inheriting from next/image's ImageProps.
 */
export function SafeImage({ placeholderClassName = 'bg-gray-200 animate-pulse', ...props }: SafeImageProps) {
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        setHasError(true);
    };

    if (hasError) {
        // Render placeholder
        // Try to preserve layout-related classNames from the original Image
        const layoutClasses = props.className?.split(' ').filter(cls =>
            cls.includes('w-') ||
            cls.includes('h-') ||
            cls.includes('aspect-') ||
            cls === 'absolute' ||
            cls === 'relative' ||
            cls === 'fixed' ||
            cls === 'fill'
        ).join(' ') || '';

        // Use passed props.width and props.height (if provided) to set styles
        const style: React.CSSProperties = {};

        if (props.width) style.width = `${props.width}px`;
        if (props.height) style.height = `${props.height}px`;
        // If fill, placeholder also needs absolute positioning
        if (props.fill) {
            style.position = 'absolute';
            style.top = '0';
            style.left = '0';
            style.bottom = '0';
            style.right = '0';
            style.width = '100%';
            style.height = '100%';
        }

        return (
            <div
                className={`${placeholderClassName} ${layoutClasses} ${props.className?.replace(layoutClasses, '').trim()}`}
                style={style}
                role="img"
                aria-label={typeof props.alt === 'string' ? `Failed to load: ${props.alt}` : 'Image failed to load'}
            />
        );
    }

    // Render NextImage normally
    return <NextImage {...props} onError={handleError} />;
} 