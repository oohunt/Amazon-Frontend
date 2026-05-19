import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import FavoriteButton from '@/components/common/FavoriteButton';
import { StoreIdentifier } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types/api';

// import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

interface ProductSwiperProps {
    products: Product[];
}

export function ProductSwiper({ products }: ProductSwiperProps) {
    // Function to render individual product card
    const renderProductCard = (product: Product, index: number) => {
        try {
            // Get main offer information
            const mainOffer = product.offers && product.offers.length > 0 ? product.offers[0] : null;

            // Get price and discount information with enhanced error handling
            const price = mainOffer?.price || product.price || 0;
            const savingsPercentage = mainOffer?.savings_percentage ||
                product.discount_rate ||
                (product.original_price && price ? ((product.original_price - price) / product.original_price) * 100 : 0);

            const originalPrice = mainOffer && mainOffer.savings
                ? price + mainOffer.savings
                : product.original_price || price;

            const productId = product.asin || product.id || `product-${index}`;
            const productImage = product.main_image || product.image_url || '';
            const isPrime = mainOffer?.is_prime || false;
            const title = product.title || 'Product title not available';
            const productUrl = product.url || product.cj_url || '';

            return (
                <motion.div
                    key={productId}
                    className="relative w-full"
                >
                    {/* Favorite button */}
                    <div
                        className="absolute top-3 right-3 z-20"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        role="button"
                        tabIndex={0}
                    >
                        <FavoriteButton
                            productId={productId}
                            size="md"
                            withAnimation={true}
                            className="bg-white/80 dark:bg-gray-800/80 shadow-sm hover:bg-white dark:hover:bg-gray-800"
                        />
                    </div>

                    <Link href={`/product/${productId}`} className="block w-full">
                        <motion.div
                            className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden h-full flex flex-col w-full"
                            transition={{ duration: 0.3 }}
                        >
                            {/* Prime badge */}
                            {isPrime && (
                                <div className="absolute top-3 left-3 z-10">
                                    <div className="bg-[#0574F7] text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                                        PRIME
                                    </div>
                                </div>
                            )}

                            {/* Product image */}
                            <div className="relative w-full aspect-[1/1] bg-white dark:bg-gray-800 pt-0.5 pb-0">
                                <div className="h-full w-full relative">
                                    {productImage ? (
                                        <Image
                                            src={productImage}
                                            alt={title}
                                            fill
                                            sizes="100vw"
                                            className="object-cover p-2"
                                            priority={index < 2}
                                            loading={index < 2 ? "eager" : "lazy"}
                                            unoptimized={productImage.startsWith('data:')}
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                                            No image available
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Product information */}
                            <div className="pl-3 pr-3 flex-grow flex flex-col">
                                {/* Brand and Store */}
                                <div className="flex items-center justify-between mb-1.5">
                                    {product.brand && (
                                        <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded inline-block">
                                            {product.brand.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                        </span>
                                    )}
                                    <StoreIdentifier
                                        url={productUrl}
                                        align="right"
                                        apiProvider={product.api_provider}
                                    />
                                </div>

                                <h3 className="text-base font-medium line-clamp-2 mb-2 flex-grow text-primary-dark dark:text-white">
                                    {title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                </h3>

                                {/* Price and discount */}
                                <div className="flex items-center justify-between mt-1 mb-2">
                                    <div className="flex items-baseline min-w-0 overflow-hidden mr-2">
                                        <span className="text-lg font-semibold text-primary dark:text-primary-light whitespace-nowrap">
                                            {formatPrice(price)}
                                        </span>
                                        {originalPrice > price && (
                                            <span className="text-xs text-secondary dark:text-gray-400 line-through whitespace-nowrap ml-1.5">
                                                {formatPrice(originalPrice)}
                                            </span>
                                        )}
                                    </div>
                                    {savingsPercentage > 0 && (
                                        <span className={`text-xs font-bold text-white px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${savingsPercentage > 30 ? 'bg-primary-badge' :
                                            savingsPercentage > 10 ? 'bg-accent' :
                                                'bg-secondary'
                                            }`}>
                                            -{Math.round(savingsPercentage)}%
                                        </span>
                                    )}
                                </div>

                                {/* Action button */}
                                <div className="mb-3">
                                    <button className="w-full py-2 bg-primary-button hover:bg-primary-button-hover dark:bg-primary-button-light dark:hover:bg-primary-button text-white text-center rounded-full font-medium transition-colors">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                </motion.div>
            );
        } catch {

            return null;
        }
    };

    // remove variant-related config, use unified configuration
    const swiperProps = {
        modules: [Pagination],
        slidesPerView: 1,
        spaceBetween: 20,
        speed: 600,
        loop: true,
        effect: 'fade',
        fadeEffect: {
            crossFade: true
        }
    };

    return (
        <div className="product-swiper-container">
            <Swiper
                {...swiperProps}
                centeredSlides={true}
                grabCursor={true}
                pagination={{
                    clickable: true,
                    renderBullet: function (index, className) {
                        return `<span class="${className}"></span>`;
                    },
                }}
                className="product-swiper"
            >
                {products.map((product, index) => (
                    <SwiperSlide key={product.asin || product.id || `product-${index}`} className="swiper-slide-product">
                        {renderProductCard(product, index)}
                    </SwiperSlide>
                ))}
            </Swiper>
            <style jsx global>{`
                .product-swiper-container {
                    width: 100%;
                    position: relative;
                    padding: 0;
                    background: transparent;
                }

                .product-swiper {
                    padding: 0.5rem 0.5rem 2rem;
                }

                .swiper-slide-product {
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    opacity: 0;
                    transform: scale(0.95);
                    padding: 0.5rem;
                }

                .swiper-slide-product.swiper-slide-active {
                    opacity: 1;
                    transform: scale(1);
                }

                .swiper-slide-product.swiper-slide-prev,
                .swiper-slide-product.swiper-slide-next {
                    opacity: 0.5;
                    transform: scale(0.9);
                }

                /* Pagination Styles */
                .swiper-pagination {
                    bottom: 0rem !important;
                }

                .swiper-pagination-bullet {
                    width: 8px;
                    height: 8px;
                    background-color: #D1D5DB;
                    opacity: 1;
                    transition: all 0.3s ease;
                }

                .swiper-pagination-bullet-active {
                    width: 16px;
                    background-color: #10B981;
                    border-radius: 4px;
                }

                @media (max-width: 640px) {
                    .swiper-slide-product {
                        padding: 0.25rem 0.5rem;
                    }
                }
            `}</style>
        </div>
    );
}