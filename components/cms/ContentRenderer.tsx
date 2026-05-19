'use client';

import parse, { Element, type HTMLReactParserOptions } from 'html-react-parser';
import Image from 'next/image';
import { useState, useEffect } from 'react';

import DynamicMetadataLoader from './DynamicMetadataLoader';
import DynamicProductLoader from './DynamicProductLoader';
import EmbeddedEmailForm from './Template/email/EmbeddedEmailForm';

// Props interface for content renderer
interface ContentRendererProps {
    content: string;
    className?: string;
}

// Check if node is inside p tag
function checkIfInsideParagraph(node: Element): boolean {
    let parent = node.parent as Element | null;

    while (parent) {
        if (parent.name === 'p') {
            return true;
        }
        // Reached root element or other block element, stop checking upward
        if (!parent.parent || ['div', 'section', 'article'].includes(parent.name)) {
            break;
        }
        parent = parent.parent as Element | null;
    }

    return false;
}

// Content renderer component
const ContentRenderer = ({ content, className = '' }: ContentRendererProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Parse options
    const parseOptions: HTMLReactParserOptions = {
        replace: (domNode) => {
            if (!(domNode instanceof Element)) {
                return;
            }

            // Detect product node
            if (domNode.attribs && domNode.attribs['data-node-type'] === 'product') {
                const productId = domNode.attribs['data-product-id'];
                const productStyle = domNode.attribs['data-style'] || 'simple';
                // Read alignment attribute
                const alignment = (domNode.attribs['data-alignment'] || 'left') as 'left' | 'center' | 'right';

                if (!productId) {
                    return <span className="text-red-500 text-xs p-2 border border-red-200 rounded align-middle">Product ID missing</span>;
                }

                // Check if inside p tag to determine which container element to use
                const isInsideParagraph = checkIfInsideParagraph(domNode);

                // Use span inside p tag, otherwise use div
                return <DynamicProductLoader
                    productId={productId}
                    style={productStyle}
                    alignment={alignment}
                    containerElement={isInsideParagraph ? 'span' : 'div'}
                />;
            }

            // New: handle productMetadata node
            else if (domNode.attribs && domNode.attribs['data-type'] === 'product-metadata') {
                const productId = domNode.attribs['data-product-id'];
                const fieldId = domNode.attribs['data-field-id'];

                if (!productId || !fieldId) {
                    // return a hint message indicating incomplete data
                    return <span className="text-orange-500 text-xs">[Metadata information incomplete]</span>;
                }

                // Render dynamic metadata loader, ensure correct layout element is used
                return <DynamicMetadataLoader productId={productId} fieldId={fieldId} />;
            }

            // New: handle email collection form node
            else if (domNode.attribs && domNode.attribs['data-type'] === 'email-collection-form') {
                const formId = domNode.attribs['data-form-id'] || `form-${Date.now()}`;
                const sourceType = (domNode.attribs['data-source-type'] || 'general') as 'general' | 'blog';
                const formTitle = domNode.attribs['data-form-title'] || 'Subscribe to get the latest news';
                const formDescription = domNode.attribs['data-form-description'] ||
                    'Enter your email address to get the latest product information and discount offers.';
                const inputPlaceholder = domNode.attribs['data-input-placeholder'] || 'your.email@example.com';
                const submitButtonText = domNode.attribs['data-submit-button-text'] || 'Subscribe';
                const style = (domNode.attribs['data-style'] || 'default') as 'default' | 'compact';

                return (
                    <EmbeddedEmailForm
                        formId={formId}
                        sourceType={sourceType}
                        formTitle={formTitle}
                        formDescription={formDescription}
                        inputPlaceholder={inputPlaceholder}
                        submitButtonText={submitButtonText}
                        style={style}
                    />
                );
            }

            // Keep existing image handling (unchanged, but slightly improved)
            if (domNode.name === 'img') {
                const { src, alt, width, height, style, ...rest } = domNode.attribs;

                // Ensure src exists before proceeding
                if (!src) return null;

                const isLocalImage = src.startsWith('/') || src.startsWith(process.env.NEXT_PUBLIC_API_BASE_URL || '');

                if (isLocalImage) {
                    // Determine dimensions for Next Image (prefer explicit, fallback to fill)
                    const imgWidth = width ? parseInt(width) : undefined;
                    const imgHeight = height ? parseInt(height) : undefined;
                    const useFill = !imgWidth || !imgHeight;

                    return (
                        // Add max-w-full to the container for responsiveness
                        <div className="relative my-4 mx-auto max-w-full" style={{
                            width: imgWidth ? `${imgWidth}px` : '100%', // Use explicit width or 100%
                            // Maintain aspect ratio if height is provided, otherwise auto
                            aspectRatio: imgWidth && imgHeight ? `${imgWidth} / ${imgHeight}` : undefined,
                            height: useFill ? undefined : (imgHeight ? `${imgHeight}px` : 'auto'), // Set height only if not using fill
                            // minHeight: useFill ? '200px' : undefined // Min height only when using fill
                        }}>
                            <Image
                                src={src}
                                alt={alt || 'Content image'} // Provide a default alt text
                                fill={useFill}
                                width={imgWidth}
                                height={imgHeight}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw" // Adjusted sizes
                                className="object-contain rounded-md" // Use contain, add rounded corners
                                {...rest}
                                unoptimized={src.startsWith('data:')} // Keep unoptimized for data URLs
                                // Add error handler for images
                                onError={(e) => { e.currentTarget.style.display = 'none'; /* Hide broken image */ }}
                            />
                        </div>
                    );
                }

                // Handle external images - render as standard img tag with basic styling
                return (
                    <Image
                        src={src}
                        alt={alt || 'External content image'} // Default alt text
                        width={width ? parseInt(width) : undefined}
                        height={height ? parseInt(height) : undefined}
                        className="my-4 max-w-full h-auto rounded-md block mx-auto" // Center external images
                        loading="lazy"
                        style={parseStyleString(style)} // Apply inline styles
                        {...rest}
                        unoptimized={true} // Disable optimization for external images
                        onError={(e) => { e.currentTarget.style.display = 'none'; /* Hide broken image */ }}
                    />
                );
            }

            // Keep existing YouTube embed handling (unchanged, but slightly improved)
            if (domNode.name === 'iframe' &&
                domNode.attribs.src &&
                (domNode.attribs.src.includes('youtube.com') || domNode.attribs.src.includes('youtu.be'))) {
                const { src, height = 'auto', style, ...rest } = domNode.attribs;
                const aspectRatio = 16 / 9; // Standard video aspect ratio

                return (
                    <div
                        className="relative my-4 w-full overflow-hidden rounded-md shadow-lg" // Add shadow and rounded corners
                        style={{
                            maxWidth: '800px', // Max width for video
                            // Use padding-bottom for aspect ratio only if height is auto or not specified
                            paddingBottom: (height === 'auto' || !height) ? `${100 / aspectRatio}%` : undefined,
                            height: (height === 'auto' || !height) ? 0 : height, // Set height if specified
                            marginLeft: 'auto', // Center
                            marginRight: 'auto' // Center
                        }}
                    >
                        <iframe
                            src={src}
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            frameBorder="0"
                            className="absolute top-0 left-0 w-full h-full" // Position iframe within container
                            style={parseStyleString(style)} // Apply inline styles
                            {...rest}
                            loading="lazy" // Add lazy loading
                        />
                    </div>
                );
            }

            // No matching special element, return default behavior
            return undefined;
        },
    };

    if (!isMounted) {
        // Render a simple loading state or skeleton for the whole content area
        return (
            <div className={`cms-content prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none ${className} animate-pulse`}>
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4" />
                <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4" />
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
        );
    }

    return (
        // Apply prose styling for general content formatting
        <div className={`cms-content prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg max-w-none ${className}`}>
            {parse(content, parseOptions)}
        </div>
    );
};

// Helper to parse inline style string into an object
function parseStyleString(styleString?: string): React.CSSProperties | undefined {
    if (!styleString) return undefined;
    try {
        const style: React.CSSProperties = {};

        styleString.split(';').forEach(declaration => {
            const colonIndex = declaration.indexOf(':');

            if (colonIndex === -1) return; // Skip if no colon

            const property = declaration.substring(0, colonIndex).trim();
            const value = declaration.substring(colonIndex + 1).trim();

            if (property && value) {
                // Basic conversion from kebab-case to camelCase
                const camelCaseProperty = property.replace(/-([a-z])/g, g => g[1].toUpperCase());

                // Assign only if it's a valid key (basic check)
                // A more robust solution might involve checking against known CSS properties
                // or using a library, but this avoids the immediate TS error.
                (style as Record<string, string>)[camelCaseProperty] = value;
            }
        });

        return Object.keys(style).length > 0 ? style : undefined; // Return undefined if empty
    } catch {

        return undefined;
    }
}

export default ContentRenderer; 
