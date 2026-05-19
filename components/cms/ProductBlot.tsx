'use client';

import { Node, mergeAttributes, type ChainedCommands } from '@tiptap/core';
import { type Node as ProseMirrorNode } from '@tiptap/pm/model';
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import { type FC } from 'react';
import useSWR from 'swr'; // Import useSWR

// Import necessary functions and types
import { productsApi } from '@/lib/api';
import { adaptProducts } from '@/lib/utils'; // Import adaptProducts
import type { ComponentProduct, Product } from '@/types'; // Import ComponentProduct

// Import the actual display components
import CardProductElement from './Template/CardProductElement';
import CompactGridItemElement from './Template/CompactGridItemElement';
import FeaturedItemElement from './Template/FeaturedItemElement';
import HorizontalProductElement from './Template/HorizontalProductElement';
import MiniProductElement from './Template/MiniProductElement';
import SimpleProductElement from './Template/SimpleProductElement';

// Define a similar skeleton placeholder for the editor preview
const ProductSkeletonPlaceholder = ({ style }: { style: string }) => {
    let className = "w-full h-24 my-2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md";

    if (style === 'card') {
        className = "my-4 w-full max-w-[280px] h-96 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg shadow-md inline-block align-middle";
    } else if (style === 'horizontal') {
        className = " w-full max-w-xl h-32 my-4 border rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-sm animate-pulse p-4 items-center inline-block align-middle";
    } else if (style === 'mini') {
        className = "inline-flex items-center my-2 border rounded-lg p-2 bg-gray-200 dark:bg-gray-700 shadow-sm animate-pulse max-w-full w-64 h-14 overflow-hidden align-middle";
    } else if (style === 'compact-grid') {
        className = "inline-block align-middle w-full max-w-[200px] h-64 my-2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg shadow-sm";
    } else if (style === 'featured') {
        className = " flex-col md:flex-row w-full max-w-3xl h-auto md:h-64 my-4 border rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-lg animate-pulse inline-block align-middle";
    }

    return <span className={className} />;
};

// Fetcher function for SWR (similar to DynamicProductLoader)
const fetchEditorProduct = async (productIdOrAsin: string): Promise<ComponentProduct | null> => {
    if (!productIdOrAsin) return null;
    try {
        const isAsin = /^[A-Z0-9]{10,13}$/.test(productIdOrAsin.toUpperCase());
        let apiResponse;

        if (isAsin) {
            // console.log(`[Editor Fetch] ASIN: ${productIdOrAsin}`);
            apiResponse = await productsApi.queryProduct({ asins: [productIdOrAsin.toUpperCase()], include_browse_nodes: null });
        } else {
            // console.log(`[Editor Fetch] ID: ${productIdOrAsin}`);
            apiResponse = await productsApi.getProductById(productIdOrAsin);
        }

        if (apiResponse?.data) {
            const productData = Array.isArray(apiResponse.data) ? apiResponse.data[0] : apiResponse.data;

            if (!productData) return null;
            const adapted = adaptProducts([productData as Product]);

            return adapted[0] || null;
        }

        return null;
    } catch (error) {
        throw error; // Let SWR handle the error state
    }
};

// Product node attribute interface — add alignment
export interface ProductAttributes {
    id: string;
    title?: string;
    price?: number;
    image?: string;
    asin?: string;
    style?: string;
    url?: string;
    cj_url?: string;
    originalPrice?: number | null;
    discount?: number | null;
    couponType?: 'percentage' | 'fixed' | null;
    couponValue?: number | null;
    couponExpirationDate?: string | null;
    isPrime?: boolean | null;
    isFreeShipping?: boolean | null;
    brand?: string | null;
    alignment?: 'left' | 'center' | 'right';
    category?: string;
}

type ProductComponentProps = NodeViewProps;

// Define product styles (export for use in RichTextEditor)
export const PRODUCT_STYLES = [
    { id: 'simple', name: 'Simple' },
    { id: 'card', name: 'Card' },
    { id: 'horizontal', name: 'Horizontal' },
    { id: 'mini', name: 'Mini' },
    { id: 'compact-grid', name: 'Compact Grid' },
    { id: 'featured', name: 'Featured Item' }
];

// Product node component — apply inline-block styles
const ProductComponent: FC<ProductComponentProps> = ({ node, selected }) => {
    const { id: productId, style = 'simple' } = node.attrs as ProductAttributes;

    // Fetch data using SWR based on the product ID
    const { data: product, error, isLoading } = useSWR<ComponentProduct | null>(
        productId ? ['editor-product', productId] : null, // Unique key for editor product
        () => fetchEditorProduct(productId),
        {
            revalidateOnFocus: false,
            shouldRetryOnError: false,
            dedupingInterval: 60000, // Cache for 1 minute
        }
    );

    // Renders the actual product based on fetched data and style
    const renderFetchedProduct = () => {
        if (isLoading) {
            return <ProductSkeletonPlaceholder style={style} />;
        }

        if (error || !product) {
            return (
                <span className="inline-flex items-center justify-center my-2 p-3 border rounded-md bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 shadow-sm text-xs align-middle">
                    Failed to load product preview (ID: {productId}).
                </span>
            );
        }

        // Render the correct component based on style attribute
        switch (style) {
            case 'card':
                return <CardProductElement product={product} />;
            case 'horizontal':
                return <HorizontalProductElement product={product} />;
            case 'mini':
                return <MiniProductElement product={product} />;
            case 'compact-grid':
                return <CompactGridItemElement product={product} />;
            case 'featured':
                return <FeaturedItemElement product={product} />;
            case 'simple':
            default:
                return <SimpleProductElement product={product} />;
        }
    };

    // remove alignmentClass calculation

    return (
        // NodeViewWrapper renders as <span class="... inline-block ...">
        <NodeViewWrapper as="span" className="flex-shrink-0">
            {/* Inner container - changed to span and added inline-block */}
            <span
                data-product-id={productId}
                data-node-type="product"
                data-style={style}
                // copy original styles and add inline-block — use group class for hover effects
                className={`relative p-1 border ${selected ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800'} rounded-lg overflow-visible bg-white dark:bg-gray-800 inline-block align-middle group flex-shrink-0`}
            >
                {renderFetchedProduct()}

                {/* Product label - improved visibility */}
                <span className={`absolute top-1 right-1 flex items-center gap-1 z-20 transition-opacity duration-200 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-200 rounded-full shadow-sm transition-colors" contentEditable={false}>Product</span>
                </span>
            </span>
        </NodeViewWrapper>
    );
};

// TipTap product node extension — modify group and inline
export const ProductBlot = Node.create<ProductAttributes>({
    name: 'product',
    group: 'inline',
    atom: true,
    inline: true,
    // draggable: true, // Remove or comment out draggable
    content: '',

    addAttributes() {
        return {
            id: { // Essential
                default: '',
                parseHTML: element => element.getAttribute('data-product-id'),
                renderHTML: attributes => ({ 'data-product-id': attributes.id }),
            },
            style: { // Essential for rendering
                default: 'simple',
                parseHTML: element => element.getAttribute('data-style'),
                renderHTML: attributes => ({ 'data-style': attributes.style }),
            },
            alignment: { // <-- New addition
                default: 'left',
                parseHTML: element => element.getAttribute('data-alignment') || 'left',
                // Render HTML attributes only when values are non-default
                renderHTML: attributes => attributes.alignment && attributes.alignment !== 'left' ? { 'data-alignment': attributes.alignment } : {},
            },
            // Keep other attributes for node structure, insertion, and parsing
            title: {
                default: 'Unnamed Product',
                parseHTML: element => element.getAttribute('data-title'),
                renderHTML: attributes => attributes.title ? { 'data-title': attributes.title } : {},
            },
            price: {
                default: 0,
                parseHTML: element => parseFloat(element.getAttribute('data-price') || '0'),
                renderHTML: attributes => typeof attributes.price === 'number' ? { 'data-price': String(attributes.price) } : {},
            },
            image: {
                default: '/placeholder-product.jpg',
                parseHTML: element => element.getAttribute('data-image'),
                renderHTML: attributes => attributes.image ? { 'data-image': attributes.image } : {},
            },
            asin: {
                default: '',
                parseHTML: element => element.getAttribute('data-asin'),
                renderHTML: attributes => attributes.asin ? { 'data-asin': attributes.asin } : {},
            },
            url: {
                default: '',
                parseHTML: element => element.getAttribute('data-url'),
                renderHTML: attributes => attributes.url ? { 'data-url': attributes.url } : {},
            },
            cj_url: {
                default: '',
                parseHTML: element => element.getAttribute('data-cj-url'),
                renderHTML: attributes => attributes.cj_url ? { 'data-cj-url': attributes.cj_url } : {},
            },
            brand: {
                default: null,
                parseHTML: element => element.getAttribute('data-brand'),
                renderHTML: attributes => attributes.brand ? { 'data-brand': attributes.brand } : {},
            },
            originalPrice: {
                default: null,
                parseHTML: element => {
                    const v = element.getAttribute('data-original-price');

                    return v ? parseFloat(v) : null;
                },
                renderHTML: attributes => attributes.originalPrice ? { 'data-original-price': String(attributes.originalPrice) } : {},
            },
            discount: {
                default: null,
                parseHTML: element => {
                    const v = element.getAttribute('data-discount');

                    return v ? parseFloat(v) : null;
                },
                renderHTML: attributes => attributes.discount ? { 'data-discount': String(attributes.discount) } : {},
            },
            couponType: {
                default: null,
                parseHTML: element => element.getAttribute('data-coupon-type') as ProductAttributes['couponType'],
                renderHTML: attributes => attributes.couponType ? { 'data-coupon-type': attributes.couponType } : {},
            },
            couponValue: {
                default: null,
                parseHTML: element => {
                    const v = element.getAttribute('data-coupon-value');

                    return v ? parseFloat(v) : null;
                },
                renderHTML: attributes => attributes.couponValue ? { 'data-coupon-value': String(attributes.couponValue) } : {},
            },
            couponExpirationDate: {
                default: null,
                parseHTML: element => element.getAttribute('data-coupon-expiration-date'),
                renderHTML: attributes => attributes.couponExpirationDate ? { 'data-coupon-expiration-date': attributes.couponExpirationDate } : {},
            },
            isPrime: {
                default: null,
                parseHTML: element => element.getAttribute('data-is-prime') === 'true',
                renderHTML: attributes => typeof attributes.isPrime === 'boolean' ? { 'data-is-prime': String(attributes.isPrime) } : {},
            },
            isFreeShipping: {
                default: null,
                parseHTML: element => element.getAttribute('data-is-free-shipping') === 'true',
                renderHTML: attributes => typeof attributes.isFreeShipping === 'boolean' ? { 'data-is-free-shipping': String(attributes.isFreeShipping) } : {},
            },
            category: {
                default: '',
                parseHTML: element => element.getAttribute('data-category'),
                renderHTML: attributes => attributes.category ? { 'data-category': attributes.category } : {},
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-node-type="product"]',
                getAttrs: (dom) => {
                    const element = dom as HTMLElement;
                    const getNullableFloat = (attr: string) => {
                        const v = element.getAttribute(attr);

                        return v ? parseFloat(v) : null;
                    };
                    const getNullableString = (attr: string) => element.getAttribute(attr) || null;
                    const getBoolean = (attr: string) => element.getAttribute(attr) === 'true';

                    return {
                        id: element.getAttribute('data-product-id') || '',
                        style: element.getAttribute('data-style') || 'simple',
                        alignment: (element.getAttribute('data-alignment') || 'left') as ProductAttributes['alignment'],
                        title: element.getAttribute('data-title') || 'Unnamed Product',
                        price: parseFloat(element.getAttribute('data-price') || '0'),
                        image: element.getAttribute('data-image') || '/placeholder-product.jpg',
                        asin: element.getAttribute('data-asin') || '',
                        url: element.getAttribute('data-url') || '',
                        cj_url: element.getAttribute('data-cj-url') || '',
                        brand: getNullableString('data-brand'),
                        originalPrice: getNullableFloat('data-original-price'),
                        discount: getNullableFloat('data-discount'),
                        couponType: getNullableString('data-coupon-type') as ProductAttributes['couponType'],
                        couponValue: getNullableFloat('data-coupon-value'),
                        couponExpirationDate: getNullableString('data-coupon-expiration-date'),
                        isPrime: getBoolean('data-is-prime'),
                        isFreeShipping: getBoolean('data-is-free-shipping'),
                        category: getNullableString('data-category'),
                    };
                }
            },
        ];
    },

    // Directly define toDOM method and add type to node
    toDOM(node: ProseMirrorNode) {
        const attrs: Record<string, string | number | boolean | null | undefined> = {
            'data-node-type': 'product',
            'data-product-id': node.attrs.id || '',
            'data-style': node.attrs.style || 'simple',
            'data-alignment': node.attrs.alignment,
            'data-title': node.attrs.title,
            'data-price': node.attrs.price,
            'data-image': node.attrs.image,
            'data-asin': node.attrs.asin,
            'data-url': node.attrs.url,
            'data-cj-url': node.attrs.cj_url,
            'data-brand': node.attrs.brand,
            'data-original-price': node.attrs.originalPrice,
            'data-discount': node.attrs.discount,
            'data-coupon-type': node.attrs.couponType,
            'data-coupon-value': node.attrs.couponValue,
            'data-coupon-expiration-date': node.attrs.couponExpirationDate,
            'data-is-prime': node.attrs.isPrime,
            'data-is-free-shipping': node.attrs.isFreeShipping,
            'data-category': node.attrs.category,
        };

        Object.keys(attrs).forEach(key => {
            const value = attrs[key];

            if (value === undefined || value === null) {
                delete attrs[key];
            } else if (key === 'alignment' && value === 'left') {
                delete attrs[key];
            } else if (typeof value === 'boolean') {
                attrs[key] = String(value);
            } else if (typeof value === 'number') {
                attrs[key] = String(value);
            }
        });

        return ['span', attrs as Record<string, string>];
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes({ 'data-node-type': 'product' }, HTMLAttributes)];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ProductComponent);
    },

    addCommands() {
        return {
            insertProduct: (attributes: Partial<ProductAttributes>) => ({ commands }: { commands: ChainedCommands }) => {
                const validAttributes: Partial<ProductAttributes> = {};
                const allowedKeys: Array<keyof ProductAttributes> = [
                    'id', 'title', 'price', 'image', 'asin', 'style', 'url', 'cj_url',
                    'brand', 'originalPrice', 'discount', 'couponType', 'couponValue',
                    'couponExpirationDate', 'isPrime', 'isFreeShipping', 'alignment', 'category'
                ];

                allowedKeys.forEach(key => {
                    if (attributes[key] !== undefined) {
                        (validAttributes as Record<keyof ProductAttributes, string | number | boolean | null | undefined>)[key] = attributes[key];
                    }
                });

                const fullAttributes: ProductAttributes = {
                    id: validAttributes.id ?? '',
                    title: validAttributes.title ?? 'Unnamed Product',
                    price: validAttributes.price ?? 0,
                    image: validAttributes.image ?? '/placeholder-product.jpg',
                    asin: validAttributes.asin ?? '',
                    style: validAttributes.style ?? 'simple',
                    alignment: validAttributes.alignment ?? 'left',
                    url: validAttributes.url ?? '',
                    cj_url: validAttributes.cj_url ?? '',
                    brand: validAttributes.brand ?? null,
                    originalPrice: validAttributes.originalPrice ?? null,
                    discount: validAttributes.discount ?? null,
                    couponType: validAttributes.couponType ?? null,
                    couponValue: validAttributes.couponValue ?? null,
                    couponExpirationDate: validAttributes.couponExpirationDate ?? null,
                    isPrime: validAttributes.isPrime ?? null,
                    isFreeShipping: validAttributes.isFreeShipping ?? null,
                    category: validAttributes.category ?? '',
                };

                return commands.insertContent({
                    type: this.name,
                    attrs: fullAttributes
                });
            },
        } as unknown as Record<string, (...args: unknown[]) => (props: { commands: ChainedCommands }) => boolean>;
    },
});

export default ProductBlot; 