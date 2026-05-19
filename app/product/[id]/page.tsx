import { type Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { FeaturedDeals } from '@/components/ui/FeaturedDeals';
import { getProductsByAsin } from '@/lib/db/products';
import { isHaram } from '@/lib/haram-filter';
import { adaptProducts } from '@/lib/utils';
import type { ComponentProduct } from '@/types';

import ProductClient from './ProductClient';

type ProductPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Fetch all offers for this ASIN, filtered for haram, adapted to ComponentProduct. */
async function getProductOffers(id: string): Promise<ComponentProduct[]> {
    if (!id) return [];
    try {
        const all = await getProductsByAsin(id);
        const clean = all.filter((p) => !isHaram(p.title || "", p.product_group || ""));
        return adaptProducts(clean);
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching product:', error);
        return [];
    }
}

// Generate page metadata
export async function generateMetadata(
    props: ProductPageProps
): Promise<Metadata> {
    const params = await props.params;
    const id = params.id;

    const offers = await getProductOffers(id);
    const product = offers[0] ?? null;

    if (!product) {
        return {
            title: 'Product Not Found | OOHunt',
            description: 'The requested product could not be found.'
        };
    }

    // Capitalize first letter of product title
    const formattedTitle = product.title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

    return {
        title: `Oohunt - ${formattedTitle}`,
        description: product.description || `View details and pricing for ${formattedTitle}`,
    };
}

// Main page component
export default async function ProductPage(props: ProductPageProps) {
    const params = await props.params;
    const id = params.id;

    const offers = await getProductOffers(id);
    const adaptedProduct = offers[0] ?? null;
    // Remaining offers shown in the product info panel
    const otherOffers = offers.slice(1);

    if (!adaptedProduct) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                        Product Not Found
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Sorry, we couldn&apos;t find the product you were looking for. Please return to the homepage to continue browsing.
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary-dark transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Product details main content */}
            <div className="bg-gray-50 dark:bg-gray-900 py-4 sm:py-6">
                <ProductClient product={adaptedProduct} otherOffers={otherOffers} />
            </div>

            {/* Similar products and Today's Best Deals sections */}
            <div className="container mx-auto px-4 space-y-8 sm:space-y-12 py-8 sm:py-12">
                {/* Similar products section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                            Similar Products
                        </h2>
                        <Link
                            href={`/products/category/${encodeURIComponent(adaptedProduct.category)}`}
                            className="flex items-center text-green-600 hover:text-green-700 dark:text-green-500 dark:hover:text-green-400 font-medium transition-colors"
                        >
                            <span>See All</span>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 ml-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                />
                            </svg>
                        </Link>
                    </div>
                    <Suspense fallback={<div className="h-64 animate-pulse" />}>
                        <FeaturedDeals
                            pageSize={8}
                            className="bg-transparent"
                            hideTitle={true}
                            productGroups={adaptedProduct.category}
                            useListApi={true}
                        />
                    </Suspense>
                </section>

                {/* Today's Best Deals section */}
                <section>
                    <Suspense fallback={<div className="h-64 animate-pulse" />}>
                        <FeaturedDeals
                            pageSize={8}
                            className="bg-transparent"
                        />
                    </Suspense>
                </section>
            </div>
        </div>
    );
} 