"use client";

import { motion } from 'framer-motion';
import { BellRing } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { NewsletterSubscribe } from '@/components/email/NewsletterSubscribe';
import type { ComponentProduct } from '@/types';

interface ProductImageGalleryProps {
    product: ComponentProduct;
}

export default function ProductImageGallery({ product }: ProductImageGalleryProps) {
    // Addstatus for controlling large image view mode
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Handle image click event
    const handleImageClick = () => {
        setIsFullscreen(true);
    };

    // close full-screen image viewer
    const handleCloseFullscreen = () => {
        setIsFullscreen(false);
    };

    // Handle external link click
    const handleExternalLink = (e: React.MouseEvent) => {
        e.preventDefault();
        const linkUrl = product.cj_url || product.url;

        if (linkUrl) {
            window.open(linkUrl, '_blank');
        }
    };

    // Get product link
    const getProductLink = () => {
        return product.cj_url || product.url || '';
    };

    return (
        <div className="product-gallery flex flex-col space-y-3">
            {/* Main image display area */}
            <div className="main-image-container relative bg-white rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-[240px] sm:h-[220px] md:h-[260px] lg:h-[380px]">
                {/* Hot Deal badge */}
                <div className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-md">
                    HOT DEAL
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full relative"
                >
                    <a
                        href={getProductLink()}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        onClick={handleExternalLink}
                        className="block w-full h-full cursor-pointer"
                    >
                        <Image
                            src={product.image}
                            alt={product.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-contain hover:scale-105 transition-transform duration-300"
                            priority
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleImageClick();
                            }}
                        />
                    </a>
                </motion.div>
            </div>

            {/* Fullscreen image viewer */}
            {isFullscreen && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={handleCloseFullscreen}
                    onKeyDown={(e) => e.key === 'Escape' && handleCloseFullscreen()}
                    role="button"
                    tabIndex={0}
                    aria-label="Close fullscreen image"
                >
                    <div className="relative max-w-5xl max-h-[90vh] w-full h-full">
                        <button
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCloseFullscreen();
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <div className="w-full h-full relative">
                            <Image
                                src={product.image}
                                alt={product.title}
                                fill
                                sizes="100vw"
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Newsletter subscription - Only visible on desktop (lg screens) */}
            <div className="hidden lg:block">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="newsletter-section bg-gradient-to-br from-white to-gray-50 dark:from-gray-800/80 dark:to-gray-800/60 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                    <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-3">
                            <div className="bg-[#16A085]/10 p-2 rounded-lg">
                                <BellRing className="w-5 h-5 text-[#16A085]" />
                            </div>
                            <h3 className="font-medium text-[#16A085] dark:text-white text-lg">Don&apos;t Miss More Deals</h3>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            Subscribe to our newsletter for exclusive deals and promotions.
                        </p>

                        <div className="mt-1">
                            <NewsletterSubscribe compact={true} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
} 