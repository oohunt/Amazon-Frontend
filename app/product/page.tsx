"use client";

import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';

import FavoriteButton from '@/components/common/FavoriteButton';
import { ProductCategoryNav } from '@/components/product/ProductCategoryNav';
import ProductList from '@/components/ProductList';
import { ProductFilter } from '@/components/products/ProductFilter';
import ApiStateWrapper from '@/components/ui/ApiStateWrapper';
import { useProducts } from '@/lib/hooks';
import { StoreIdentifier } from '@/lib/store';
import { adaptProducts } from '@/lib/utils';
import type { ComponentProduct } from '@/types';
import type { AmazonProduct } from '@/types/amazonApi';
import type { Product } from '@/types/api';

// 定义DrawerFilters接口
interface DrawerFilters {
    min_price?: number;
    max_price?: number;
    min_discount?: number;
    brands?: string | string[];
    is_prime_only?: boolean;
}

// 筛选器参数接口
interface FilterParams extends DrawerFilters {
    api_provider?: string;
    min_commission?: number;
    min_rating?: number;
}

// 添加类型定义
interface ProductsApiResponse {
    items?: Product[];
    total?: number;
    page?: number;
    page_size?: number;
    // 支持嵌套结构
    success?: boolean;
    data?: {
        items: Product[];
        total: number;
        page: number;
        page_size: number;
    };
}

// API参数类型
interface ApiParams {
    product_groups?: string;
    brands?: string;
    page?: number;
    page_size?: number;
    min_price?: number;
    max_price?: number;
    min_discount?: number;
    sort_by?: string;
    sort_order?: string;
    product_type?: string;
    is_prime_only?: boolean;
    limit?: number;
}

// 交互式动画SVG组件替代原3D模型
const CategoryIllustration = ({ category }: { category: string }) => {
    const illustrations: Record<string, React.ReactNode> = {
        electronics: (
            <motion.div className="w-full h-full flex items-center justify-center">
                <motion.div
                    className="relative w-64 h-64"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full opacity-30"
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M3 7h18v10H3V7z" stroke="white" strokeWidth="2" />
                            <path d="M7 18v2M17 18v2M9 7V5M15 7V5" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </motion.div>
                </motion.div>
            </motion.div>
        ),
        clothing: (
            <motion.div className="w-full h-full flex items-center justify-center">
                <motion.div
                    className="relative w-64 h-64"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full opacity-30"
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M6 3h12l2 4-5 2V21h-6V9L4 7l2-4z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </motion.div>
                </motion.div>
            </motion.div>
        ),
        home: (
            <motion.div className="w-full h-full flex items-center justify-center">
                <motion.div
                    className="relative w-64 h-64"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full opacity-30"
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 21v-8h6v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </motion.div>
                </motion.div>
            </motion.div>
        ),
        default: (
            <motion.div className="w-full h-full flex items-center justify-center">
                <motion.div
                    className="relative w-64 h-64"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-30"
                        animate={{
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    />
                    <motion.div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32"
                        animate={{
                            rotate: 360,
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                            <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2" />
                            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="white" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </motion.div>
                </motion.div>
            </motion.div>
        )
    };

    return illustrations[category] || illustrations.default;
};

// 液态按钮效果的SVG过滤器
const LiquidFilter = () => (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="liquid" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
            <feGaussianBlur in="SourceGraphic" stdDeviation={10} result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="liquid" />
            <feComposite in="SourceGraphic" in2="liquid" operator="atop" />
        </filter>
    </svg>
);

// 类型谓词函数，用于区分产品类型
const _isAmazonProduct = (product: AmazonProduct | Product): product is AmazonProduct => {
    return 'asin' in product;
};

const _isProduct = (product: AmazonProduct | Product): product is Product => {
    return 'id' in product;
};

// 添加商品骨架屏组件
const ProductSkeleton = () => (
    <div className="relative group h-full">
        <div className="relative h-full flex flex-col overflow-hidden rounded-lg shadow-lg bg-white dark:bg-gray-800 animate-pulse">
            {/* 图片骨架 */}
            <div className="relative w-full pt-[100%] bg-gray-200 dark:bg-gray-700" />

            {/* 内容区域 */}
            <div className="p-2 sm:p-3 md:p-4 flex-grow flex flex-col">
                {/* 标题骨架 */}
                <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-4" />

                {/* 价格区域骨架 */}
                <div className="mt-auto pt-1 sm:pt-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-0.5 sm:gap-1">
                    <div className="w-16 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-12 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            </div>
        </div>
    </div>
);

// 添加返回顶部按钮组件
const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    // 检测滚动位置以控制按钮可见性
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 500) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);

        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    // 滚动到顶部的函数
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                </motion.button>
            )}
        </AnimatePresence>
    );
};

// 修改主页面组件
export default function ProductsPage() {
    const categoryFromSlug = undefined;
    return (
        <Suspense fallback={<div className="w-full h-screen flex items-center justify-center">
            <div className="animate-pulse text-xl font-semibold">Loading products...</div>
        </div>}>
            <ProductsContent categoryFromSlug={categoryFromSlug} />
        </Suspense>
    );
}

// 使用 Client Component 包装搜索参数逻辑
function ProductsContent({ categoryFromSlug }: { categoryFromSlug?: string } = {}) {
    const searchParamsFromUrl = useSearchParams();
    // Detect category from URL path (e.g. /product/category/Electronics)
    const pathname0 = usePathname();
    const categoryFromPath = useMemo(() => {
        if (pathname0) {
            const match = pathname0.match(/\/product\/category\/(.+)/);
            return match ? decodeURIComponent(match[1]) : undefined;
        }
        return undefined;
    }, [pathname0]);
    const [searchParams, setSearchParams] = useState({
        product_groups: '' as string,
        brands: '' as string,
        page: 1,
        limit: 50,
        sort_by: 'all' as 'price' | 'discount' | 'created' | 'all',
        sort_order: 'desc' as 'asc' | 'desc',
        min_price: undefined as number | undefined,
        max_price: undefined as number | undefined,
        min_discount: undefined as number | undefined,
        product_type: 'all' as 'discount' | 'coupon' | 'all',
        is_prime_only: false,
        api_provider: undefined as string | undefined,
    });

    const [drawerFilters, setDrawerFilters] = useState<DrawerFilters | null>(null);
    const [urlParamsLoaded, setUrlParamsLoaded] = useState(false);
    const catalogRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const paginationRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ layoutEffect: false });
    const headerOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.97]);

    // 添加缓存状态展示
    const [_cacheStatus, setCacheStatus] = useState<{
        isCached: boolean;
        responseTime: number;
        expires: string;
    } | null>(null);

    // 添加JS滚动逻辑，实现侧边栏在父容器内的固定效果
    useEffect(() => {
        const handleScroll = () => {
            if (!sidebarRef.current || !mainContentRef.current || !catalogRef.current || !paginationRef.current) return;

            const sidebarElem = sidebarRef.current;
            const catalogRect = catalogRef.current.getBoundingClientRect();
            const mainContentRect = mainContentRef.current.getBoundingClientRect();
            const sidebarRect = sidebarElem.getBoundingClientRect();
            const paginationRect = paginationRef.current.getBoundingClientRect();

            // 固定偏移量（导航栏高度）
            const topOffset = 72;

            // 计算父容器的位置
            const containerTop = catalogRect.top + window.scrollY;
            const paginationTop = paginationRect.top + window.scrollY;

            // 计算侧边栏的高度和当前滚动位置
            const sidebarHeight = sidebarRect.height;
            const scrollY = window.scrollY;

            // 计算主内容区域的实际高度
            const mainContentHeight = mainContentRect.height;

            // 确保侧边栏不会超出分页区域的顶部，同时考虑侧边栏自身的高度
            const BUFFER = 20; // 增加缓冲区到20px
            const maxTop = Math.min(
                mainContentHeight - sidebarHeight,
                paginationTop - containerTop - sidebarHeight - BUFFER
            );

            // 计算当前滚动位置相对于底部的距离
            const currentScrollTop = scrollY + topOffset - containerTop;
            const distanceToBottom = maxTop - currentScrollTop;

            // 判断滚动位置并设置样式
            if (scrollY + topOffset >= containerTop) {
                if (distanceToBottom <= BUFFER) {
                    // 完全到达底部时
                    Object.assign(sidebarElem.style, {
                        position: 'absolute',
                        top: `${maxTop}px`,
                        transform: 'none'
                    });
                } else {
                    // 正常滚动时保持fixed
                    Object.assign(sidebarElem.style, {
                        position: 'fixed',
                        top: `${topOffset}px`,
                        transform: 'none'
                    });
                }
            } else {
                // 回到顶部
                Object.assign(sidebarElem.style, {
                    position: 'absolute',
                    top: '0',
                    transform: 'none'
                });
            }
        };

        // 添加防抖处理
        let ticking = false;
        const scrollHandler = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', scrollHandler, { passive: true });
        window.addEventListener('resize', scrollHandler, { passive: true });

        // 初始化调用一次
        handleScroll();

        return () => {
            window.removeEventListener('scroll', scrollHandler);
            window.removeEventListener('resize', scrollHandler);
        };
    }, []);

    // 添加useEffect，确保从URL参数正确加载
    useEffect(() => {
        // 获取URL参数（忽略时间戳参数_ts）
        const brands = searchParamsFromUrl.get('brands') || '';
        const product_groups = searchParamsFromUrl.get('product_groups') || '';
        const category = searchParamsFromUrl.get('category') || ''; // 兼容category参数

        // 优先使用从路由路径传入的categoryFromSlug或URL路径中的分类，而不是查询参数
        // 如果有categoryFromSlug或categoryFromPath，则忽略查询参数中的category或product_groups
        const effective_category = categoryFromSlug || categoryFromPath || product_groups || category;

        const page = Number(searchParamsFromUrl.get('page')) || 1;
        const min_price = searchParamsFromUrl.get('min_price') ? Number(searchParamsFromUrl.get('min_price')) : undefined;
        const max_price = searchParamsFromUrl.get('max_price') ? Number(searchParamsFromUrl.get('max_price')) : undefined;
        const min_discount = searchParamsFromUrl.get('min_discount') ? Number(searchParamsFromUrl.get('min_discount')) : undefined;
        const is_prime_only = searchParamsFromUrl.get('is_prime_only') === 'true';
        const sort_by = (searchParamsFromUrl.get('sort_by') as typeof searchParams.sort_by) || 'all';
        const sort_order = (searchParamsFromUrl.get('sort_order') as typeof searchParams.sort_order) || 'desc';
        const api_provider = searchParamsFromUrl.get('api_provider') || undefined;

        // 更新searchParams状态，使用合并后的分类参数
        setSearchParams(prev => {
            const newParams = {
                ...prev,
                brands,
                product_groups: effective_category, // 使用合并后的分类参数
                page,
                min_price,
                max_price,
                min_discount,
                is_prime_only,
                sort_by,
                sort_order,
                api_provider
            };

            return newParams;
        });

        // 标记URL参数已加载
        setUrlParamsLoaded(true);

        // 更新临时筛选状态
        setDrawerFilters({
            min_price: min_price,
            max_price: max_price,
            min_discount: min_discount,
            brands: brands,
            is_prime_only: is_prime_only
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParamsFromUrl, categoryFromSlug, categoryFromPath]);

    // 引入useRouter和usePathname
    const router = useRouter();
    const pathname = pathname0; // 使用当前页面实际路径

    // 添加useEffect，当searchParams变化时更新URL
    useEffect(() => {
        // 创建URL参数对象
        const params = new URLSearchParams();

        // 检查当前是否在分类页面（URL包含/category/）
        const isInCategoryPage = pathname.includes('/category/');

        // 仅在非分类页面时添加product_groups参数，避免重复
        if (searchParams.product_groups && !isInCategoryPage) {
            params.set('product_groups', searchParams.product_groups);
        }

        // 其他参数正常添加
        if (searchParams.brands) params.set('brands', searchParams.brands);
        if (searchParams.page > 1) params.set('page', searchParams.page.toString());
        if (searchParams.min_price !== undefined) params.set('min_price', searchParams.min_price.toString());
        if (searchParams.max_price !== undefined) params.set('max_price', searchParams.max_price.toString());
        if (searchParams.min_discount !== undefined) params.set('min_discount', searchParams.min_discount.toString());
        if (searchParams.is_prime_only) params.set('is_prime_only', 'true');
        if (searchParams.sort_by !== 'all') params.set('sort_by', searchParams.sort_by);
        if (searchParams.sort_order !== 'desc') params.set('sort_order', searchParams.sort_order);
        if (searchParams.api_provider) params.set('api_provider', searchParams.api_provider);

        // 构建查询字符串
        const queryString = params.toString();
        const url = queryString ? `${pathname}?${queryString}` : pathname;

        // 使用replace而不是push来更新URL，避免创建太多历史记录
        router.replace(url, { scroll: false });
    }, [searchParams, router, pathname]);

    // 清理URL中的时间戳参数
    useEffect(() => {
        if (typeof window !== 'undefined' && searchParamsFromUrl.has('_ts')) {
            // 创建一个新的URLSearchParams实例
            const cleanParams = new URLSearchParams();

            // 复制除了_ts之外的所有参数
            searchParamsFromUrl.forEach((value, key) => {
                if (key !== '_ts') {
                    cleanParams.append(key, value);
                }
            });

            // 构建干净的URL
            const cleanUrl = cleanParams.toString()
                ? `${pathname}?${cleanParams.toString()}`
                : pathname;

            // 延迟200ms后清理URL，避免干扰初始数据加载
            const timeoutId = setTimeout(() => {
                router.replace(cleanUrl, { scroll: false });
            }, 200);

            return () => clearTimeout(timeoutId);
        }
    }, [searchParamsFromUrl, router, pathname]);

    // 只有当urlParamsLoaded为true时才获取产品数据，确保使用的是从URL加载的参数
    const { data, isLoading, isError, mutate } = useProducts(urlParamsLoaded ? searchParams : undefined);
    const [isDirectLoading, setIsDirectLoading] = useState(false);
    const [directData, setDirectData] = useState<ProductsApiResponse | null>(null);

    // 在searchParams变化后，明确触发数据刷新
    useEffect(() => {
        if (urlParamsLoaded && mutate) {
            // 添加短暂延迟，确保URL已更新完成
            setTimeout(() => {
                mutate();
            }, 50);
        }
    }, [searchParams, urlParamsLoaded, mutate]);

    // 如果SWR获取失败，尝试直接使用fetch获取
    useEffect(() => {
        const fetchDirectlyIfNeeded = async () => {
            if ((isError || (!data && !isLoading)) && !isDirectLoading) {
                try {
                    setIsDirectLoading(true);

                    // 创建参数对象，转换参数名
                    const apiParams: ApiParams = { ...searchParams };

                    if (searchParams.limit) apiParams.page_size = searchParams.limit;
                    delete apiParams.limit;

                    // 移除空的参数
                    if (apiParams.brands === '') delete apiParams.brands;
                    if (apiParams.product_groups === '') delete apiParams.product_groups;

                    // 使用新的缓存路由端点
                    const queryParams = new URLSearchParams();

                    // 添加所有有效参数
                    Object.entries(apiParams)
                        .filter(([_, value]) => value !== undefined && value !== null)
                        .forEach(([key, value]) => {
                            queryParams.append(key, String(value));
                        });

                    const queryString = queryParams.toString();
                    const url = `/api/products/list${queryString ? `?${queryString}` : ''}`;

                    // 发起请求
                    const response = await fetch(url);

                    // 检查响应头中的缓存状态
                    if (response.ok) {
                        const responseData = await response.json();

                        // 处理可能的不同响应格式
                        let processedData;

                        if (responseData.success && responseData.data && typeof responseData.data === 'object') {
                            // 嵌套结构 { success: true, data: { items: [...], total: ... } }
                            processedData = responseData;
                        } else if (responseData.items) {
                            // 直接结构 { items: [...], total: ... }
                            processedData = {
                                success: true,
                                data: responseData
                            };
                        } else if (responseData.data && responseData.data.items) {
                            // 嵌套结构 { data: { items: [...], total: ... } }
                            processedData = {
                                success: true,
                                data: responseData.data
                            };
                        } else {
                            // 未知结构，使用空结果
                            processedData = {
                                success: true,
                                data: {
                                    items: [],
                                    total: 0,
                                    page: 1,
                                    page_size: 20
                                }
                            };
                        }

                        setDirectData(processedData);

                        // 获取并更新缓存状态
                        const isCached = response.headers.get('X-Cache-Source') === 'cache-hit';
                        const responseTime = parseInt(response.headers.get('X-Response-Time') || '0');
                        const expires = response.headers.get('X-Cache-Expires') || '';

                        setCacheStatus({
                            isCached,
                            responseTime,
                            expires
                        });
                    }
                } catch {
                    // 错误处理
                    setCacheStatus(null);
                } finally {
                    setIsDirectLoading(false);
                }
            }
        };

        fetchDirectlyIfNeeded();

        // 每当searchParams变化时，重置directData，确保会获取新数据
        setDirectData(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isError, data, isLoading, searchParams]);

    // 添加页面加载完成事件
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleLoad = () => {
                // 页面完全加载后，额外进行一次数据刷新
                if (mutate) {
                    setTimeout(() => mutate(), 100);
                }
            };

            window.addEventListener('load', handleLoad);

            return () => window.removeEventListener('load', handleLoad);
        }
    }, [mutate]);

    // 将API产品数据适配为组件所需的格式
    const adaptedProducts = useMemo(() => {
        // 优先使用SWR数据，如果没有则使用直接获取的数据
        let sourceData;

        // 处理SWR数据
        if (data) {
            const typedData = data as ProductsApiResponse;

            sourceData = typedData.items;
        }

        // 如果没有SWR数据，使用直接获取的数据
        if (!sourceData && directData) {
            const typedDirectData = directData as ProductsApiResponse;

            if (typedDirectData.data && typedDirectData.data.items) {
                sourceData = typedDirectData.data.items;
            } else if (typedDirectData.items) {
                sourceData = typedDirectData.items;
            }
        }

        if (!sourceData || !Array.isArray(sourceData)) {
            return [];
        }

        return adaptProducts(sourceData);
    }, [data, directData]);

    // 获取总商品数量，支持不同的数据结构
    const getTotalProducts = () => {
        if (data) {
            const typedData = data as ProductsApiResponse;

            if (typedData.total) {
                return typedData.total;
            } else if (typedData.data && typedData.data.total) {
                return typedData.data.total;
            }
        }

        if (directData) {
            const typedDirectData = directData as ProductsApiResponse;

            if (typedDirectData.data && typedDirectData.data.total) {
                return typedDirectData.data.total;
            } else if (typedDirectData.total) {
                return typedDirectData.total;
            }
        }

        return 0;
    };

    // 处理分类点击
    const handleCategoryClick = useCallback((category: string) => {
        // 先更新内部状态
        setSearchParams(prev => ({
            ...prev,
            product_groups: category || '',
            page: 1
        }));

        // 构建新的URL路径
        const newPath = category
            ? `/product/category/${encodeURIComponent(category)}`
            : '/product';

        // 直接操作URL，使用最简单的方法
        if (typeof window !== 'undefined') {
            try {
                // 方法1：直接替换URL，强制更新
                window.history.replaceState(
                    { as: newPath, url: newPath },
                    '',
                    newPath
                );

                // 方法2：延迟执行router.replace，确保它是最后一个执行的导航
                setTimeout(() => {
                    router.replace(newPath, { scroll: false });
                }, 50);
            } catch {
                // 如果出错，使用最直接的方法
                window.location.href = newPath;
            }
        }

        if (catalogRef.current) {
            catalogRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [router, setSearchParams, catalogRef]);

    // 处理分页
    const handlePageChange = useCallback((page: number) => {
        setSearchParams(prev => ({ ...prev, page }));

        if (catalogRef.current) {
            window.scrollTo({
                top: catalogRef.current.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    }, [setSearchParams, catalogRef]);

    // 处理筛选条件变更
    const handleFilterChange = useCallback((filters: FilterParams) => {
        // 移除不支持的参数，但保留api_provider
        const { min_commission: _min_commission, min_rating: _min_rating, ...validFilters } = filters;

        // 创建新的筛选器对象，确保类型兼容
        const newFilters: Partial<typeof searchParams> = {};

        // 手动处理每个属性，确保类型兼容
        if (validFilters.min_price !== undefined) newFilters.min_price = validFilters.min_price;
        if (validFilters.max_price !== undefined) newFilters.max_price = validFilters.max_price;
        if (validFilters.min_discount !== undefined) newFilters.min_discount = validFilters.min_discount;
        if (validFilters.is_prime_only !== undefined) newFilters.is_prime_only = validFilters.is_prime_only;
        if (validFilters.api_provider !== undefined) newFilters.api_provider = validFilters.api_provider;

        // 确保品牌参数为字符串类型
        if (validFilters.brands) {
            newFilters.brands = Array.isArray(validFilters.brands)
                ? validFilters.brands.join(',')
                : validFilters.brands;
        }

        setSearchParams(prev => ({
            ...prev,
            ...newFilters,
            page: 1
        }));
    }, []);

    // 关闭抽屉函数
    const closeDrawer = useCallback(() => {
        // 应用当前抽屉中的筛选条件
        if (drawerFilters) {
            handleFilterChange(drawerFilters);
        }

        const drawerElem = document.getElementById('mobile-filter-drawer');
        const overlayElem = document.getElementById('drawer-overlay');

        if (drawerElem && overlayElem) {
            drawerElem.classList.add('translate-y-full');
            overlayElem.classList.remove('opacity-70');
            overlayElem.classList.add('opacity-0');
            overlayElem.classList.add('pointer-events-none');
            document.body.classList.remove('overflow-hidden');
        }
    }, [drawerFilters, handleFilterChange]);

    // 渲染单个商品
    const renderProduct = (product: ComponentProduct) => {
        // 处理折扣和优惠券逻辑
        const hasCoupon = product.couponType && product.couponValue;
        const hasDiscount = product.discount > 0;
        const discountLabel = hasDiscount ? `-${Math.round(product.discount)}%` : '';
        let couponLabel = '';

        // 直接使用API适配后的originalPrice，不再需要复杂计算
        const calculatedOriginalPrice = product.originalPrice;

        // 处理优惠券标签
        if (hasCoupon) {
            if (product.couponType === 'percentage') {
                couponLabel = `-${product.couponValue}%`;
            } else if (product.couponType === 'fixed') {
                couponLabel = `$${product.couponValue}`;
            }
        }

        // 判断是否有任何形式的折扣
        const hasAnyDiscount = hasDiscount || hasCoupon;

        // 计算折扣百分比用于标签颜色样式
        let discountBadgeClass = 'bg-primary-badge';

        if (hasDiscount) {
            if (product.discount > 30) {
                discountBadgeClass = 'bg-primary-badge';
            } else if (product.discount > 10) {
                discountBadgeClass = 'bg-primary-badge';
            }
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="relative group h-full"
            >
                {/* 收藏按钮 */}
                <div
                    className="absolute top-3 right-3 z-20"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    role="button"
                    tabIndex={0}
                >
                    <FavoriteButton
                        productId={product.id}
                        size="md"
                        withAnimation={true}
                        className="bg-white/80 dark:bg-gray-800/80 shadow-sm hover:bg-white dark:hover:bg-gray-800"
                    />
                </div>

                <Link href={`/product/${product.id}`} className="block">
                    <motion.div
                        className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden h-full flex flex-col mx-auto w-full"
                        whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 10px 10px -5px rgba(0, 0, 0, 0.03)' }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Prime badge */}
                        {product.isPrime && (
                            <div className="absolute top-3 left-3 z-10">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="bg-[#0574F7] text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm flex items-center"
                                >
                                    Prime
                                </motion.div>
                            </div>
                        )}

                        {/* 图片容器固定比例 */}
                        <div className="relative w-full aspect-[1/1] bg-white dark:bg-gray-800 pt-0.5 pb-0">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="h-full w-full relative"
                            >
                                <Image
                                    src={product.image}
                                    alt={product.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-cover p-2"
                                    loading="lazy"
                                    unoptimized={product.image.startsWith('data:')}
                                />
                            </motion.div>
                        </div>

                        {/* 内容区域 */}
                        <div className="pl-3 pr-3 flex-grow flex flex-col">
                            {/* 品牌信息和StoreIdentifier放在同一行 */}
                            <div className="flex items-center justify-between mb-1.5">
                                {product.brand ? (
                                    <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded inline-block">
                                        {product.brand.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                    </span>
                                ) : (
                                    <div /> /* 占位空元素，确保右对齐 */
                                )}
                                <StoreIdentifier
                                    url={product.cj_url || product.url || ''}
                                    align="right"
                                    apiProvider={product.apiProvider}
                                />
                            </div>

                            <h3 className="text-base font-medium line-clamp-2 mb-2 flex-grow text-primary-dark dark:text-white">
                                {product.title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                            </h3>

                            {/* 价格和折扣 */}
                            <div className="flex items-center justify-between mt-1 mb-2">
                                <div className="flex items-baseline min-w-0 overflow-hidden mr-2">
                                    <span className="text-lg font-semibold text-primary dark:text-primary-light whitespace-nowrap">
                                        ${product.price.toFixed(2)}
                                    </span>
                                    {hasAnyDiscount && calculatedOriginalPrice > product.price && (
                                        <span className="text-xs text-secondary dark:text-gray-400 line-through whitespace-nowrap ml-1.5">
                                            ${calculatedOriginalPrice.toFixed(2)}
                                        </span>
                                    )}
                                </div>
                                {hasCoupon && couponLabel ? (
                                    <span className="text-xs font-bold text-white px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 bg-green-500">
                                        {couponLabel} Coupon
                                    </span>
                                ) : (hasDiscount && discountLabel && (
                                    <span className={`text-xs font-bold text-white px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${discountBadgeClass}`}>
                                        {discountLabel}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Action button */}
                        <div className="px-3 pb-3">
                            <motion.div
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="w-full py-2 bg-primary-button hover:bg-primary-button-hover dark:bg-primary-button-light dark:hover:bg-primary-button text-white text-center rounded-full font-medium shadow-sm transition-colors"
                            >
                                View Details
                            </motion.div>
                        </div>
                    </motion.div>
                </Link>
            </motion.div>
        );
    };

    // 渲染产品列表内容
    const renderProductList = (products: ComponentProduct[]) => (
        <AnimatePresence mode="wait">
            <motion.div
                key={`products-${searchParams.product_groups || 'all'}-${searchParams.page}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
            >
                <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                        Showing <span className="font-medium">{products.length}</span> of <span className="font-medium">{getTotalProducts()}</span> products

                    </p>
                    <div className="flex items-center gap-2">
                        <label htmlFor="sort" className="text-sm text-gray-600 dark:text-gray-400">
                            Sort by:
                        </label>
                        <select
                            id="sort"
                            className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none focus:ring-2 focus:ring-primary"
                            value={`${searchParams.sort_by}:${searchParams.sort_order}`}
                            onChange={(e) => {
                                const [sort_by, sort_order] = e.target.value.split(':');

                                setSearchParams(prev => ({
                                    ...prev,
                                    sort_by: sort_by as 'price' | 'discount' | 'created' | 'all',
                                    sort_order: sort_order as 'asc' | 'desc',
                                    page: 1
                                }));
                            }}
                        >
                            <option value="all:desc">Recommended</option>
                            <option value="price:asc">Price: Low to High</option>
                            <option value="price:desc">Price: High to Low</option>
                            <option value="discount:desc">Biggest Discount</option>
                            <option value="created:desc">Newest</option>
                        </select>
                    </div>
                </div>
                <ProductList
                    products={products}
                    renderProduct={renderProduct}
                    currentPage={searchParams.page}
                    totalPages={Math.ceil((getTotalProducts() / searchParams.limit))}
                    onPageChange={handlePageChange}
                />
            </motion.div>
        </AnimatePresence>
    );

    const skeletonIds = useMemo(() => Array.from({ length: 15 }, (_, index) => `skeleton-${index}`), []);

    // 渲染骨架屏
    const renderSkeletons = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {skeletonIds.map((id) => (
                <ProductSkeleton key={id} />
            ))}
        </div>
    );

    // 添加事件监听器来处理筛选器内部按钮点击
    useEffect(() => {
        const handleFilterButtonClick = (event: MouseEvent) => {
            // 检查点击的元素是否是按钮
            const target = event.target as HTMLElement;

            // 查找最近的按钮元素
            const button = target.closest('button');

            if (!button) return;

            // 判断点击的是否是"Apply Filters"按钮
            const isApplyButton = button.textContent?.trim() === 'Apply Filters';

            // 检查按钮是否在移动端或平板端筛选器内
            const isMobileFilter = !!button.closest('#mobile-filter');
            const isTabletFilter = !!button.closest('#tablet-filter');

            // 如果是在移动端或平板端筛选器内点击了"Apply Filters"按钮，则关闭抽屉
            if (isApplyButton && (isMobileFilter || isTabletFilter)) {
                // 给一点延时，确保筛选条件已更新
                setTimeout(closeDrawer, 100);
            }
        };

        // 添加事件监听器
        document.addEventListener('click', handleFilterButtonClick);

        // 清理函数
        return () => {
            document.removeEventListener('click', handleFilterButtonClick);
        };
    }, [closeDrawer]);// 添加closeDrawer依赖

    return (
        <div className="min-h-screen pb-20">
            <LiquidFilter />

            {/* 返回顶部按钮 */}
            <ScrollToTopButton />

            {/* 英雄区块与动画SVG插图 - 优化移动端显示 */}
            <section className="relative h-[30vh] md:h-[35vh] min-h-[300px] md:min-h-[400px] w-[100vw] left-[calc(-50vw+50%)] right-0 overflow-hidden bg-gradient-to-br from-[#1B5479] to-[#287EB7]">
                <motion.div
                    className="absolute inset-0 bg-[url('/images/dot-pattern.svg')] opacity-10"
                    animate={{
                        backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                        duration: 50,
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "reverse"
                    }}
                />

                <div className="container mx-auto h-full px-4 sm:px-6 md:px-8 lg:px-12 relative z-10 flex flex-col md:flex-row items-center justify-between py-8 md:py-12">
                    <motion.div
                        className="max-w-full md:max-w-2xl text-center md:text-left mt-8 md:mt-0"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 md:mb-4">Discover Premium Products</h1>
                        <p className="text-base sm:text-lg md:text-xl text-white mb-4 md:mb-8">Curated global selections for an exceptional shopping experience</p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-6 sm:px-8 py-2 sm:py-3 bg-[#0574F7] text-white font-semibold rounded-full shadow-lg hover:bg-[#0574F7]/90 transition-all duration-300"
                            onClick={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            Explore Now
                        </motion.button>
                    </motion.div>

                    <div className="hidden md:block h-full w-1/3 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <CategoryIllustration category={searchParams.product_groups || 'default'} />
                        </div>
                    </div>
                </div>
            </section>

            {/* 分类导航 - 设备响应式设计 */}
            <motion.header
                className="sticky top-0 z-[60] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-sm"
                style={{
                    opacity: headerOpacity,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="w-full relative bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                    <div className="container mx-auto relative">
                        {/* 移动端和平板端导航 - 左右滑动 */}
                        <div className="md:hidden">
                            {/* 左右滑动箭头 */}
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 flex items-center h-full">
                                <button
                                    className="h-full px-2 flex items-center justify-center bg-gradient-to-r from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 dark:to-transparent"
                                    onClick={() => {
                                        const scrollContainer = document.querySelector('.categories-scroll-container');

                                        if (scrollContainer) {
                                            scrollContainer.scrollLeft -= 150;
                                        }
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            </div>

                            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 flex items-center h-full">
                                <button
                                    className="h-full px-2 flex items-center justify-center bg-gradient-to-l from-white via-white to-transparent dark:from-gray-900 dark:via-gray-900 dark:to-transparent"
                                    onClick={() => {
                                        const scrollContainer = document.querySelector('.categories-scroll-container');

                                        if (scrollContainer) {
                                            scrollContainer.scrollLeft += 150;
                                        }
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* 滚动区域 */}
                            <div className="overflow-x-auto scrollbar-hide px-8 py-2 categories-scroll-container">
                                <ProductCategoryNav
                                    selectedCategory={searchParams.product_groups || ''}
                                    onCategorySelect={handleCategoryClick}
                                    displayMode="scroll"
                                />
                            </div>

                            {/* 滚动指示器 */}
                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-0.5 flex items-center justify-center space-x-1 mb-1">
                                <div className="w-6 h-0.5 bg-green-500 rounded-full" />
                                <div className="w-2 h-0.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
                                <div className="w-2 h-0.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
                            </div>
                        </div>

                        {/* 桌面端导航 - 展开收起 */}
                        <div className="hidden md:block px-4 py-2">
                            <ProductCategoryNav
                                selectedCategory={searchParams.product_groups || ''}
                                onCategorySelect={handleCategoryClick}
                                displayMode="expand"
                            />
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* 商品列表区域 - 响应式布局 */}
            <section ref={catalogRef} className="max-w-[1800px] mx-auto overflow-visible">
                <div ref={mainContentRef} className="flex relative">
                    {/* 桌面端左侧筛选器 */}
                    <div className="hidden lg:block w-[280px] flex-shrink-0">
                        <div
                            ref={sidebarRef}
                            className="w-[280px] bg-white dark:bg-gray-900 pb-4 shadow-sm border-r border-gray-100 dark:border-gray-800 scrollbar-hide z-[100] overscroll-contain"
                            style={{
                                maxHeight: 'calc(100vh - 80px)',
                                willChange: 'transform',
                                backfaceVisibility: 'hidden',
                                position: 'relative',
                                overflowAnchor: 'none'
                            }}
                        >
                            <div className="p-4 w-full h-full overflow-y-auto overscroll-contain">
                                <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">Filter</h2>
                                <ProductFilter
                                    onFilter={handleFilterChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 右侧商品列表区域 */}
                    <main className="flex-1 min-h-screen w-full px-4 py-6 md:py-12" ref={mainContentRef}>
                        {/* 移动端筛选器按钮 */}
                        <div className="lg:hidden mb-4">
                            <button
                                className="w-full py-3 px-4 sm:py-4 sm:rounded-xl bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-xl shadow-md flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                onClick={() => {
                                    setDrawerFilters({
                                        min_price: searchParams.min_price,
                                        max_price: searchParams.max_price,
                                        min_discount: searchParams.min_discount,
                                        brands: searchParams.brands,
                                        is_prime_only: searchParams.is_prime_only
                                    });

                                    const drawerElem = document.getElementById('mobile-filter-drawer');
                                    const overlayElem = document.getElementById('drawer-overlay');

                                    if (drawerElem && overlayElem) {
                                        drawerElem.classList.remove('translate-y-full');
                                        overlayElem.classList.remove('opacity-0');
                                        overlayElem.classList.add('opacity-70');
                                        overlayElem.classList.remove('pointer-events-none');
                                        document.body.classList.add('overflow-hidden');
                                    }
                                }}
                            >
                                <span className="font-medium">Filter Products</span>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        <ApiStateWrapper
                            isLoading={isLoading || isDirectLoading}
                            isError={!!isError && !directData}
                            isEmpty={!adaptedProducts?.length}
                            emptyMessage="No matching products found"
                            data={adaptedProducts}
                            loadingFallback={renderSkeletons()}
                        >
                            {(products) => (
                                <>
                                    {renderProductList(products)}
                                    {/* 分页区域作为滚动边界 */}
                                    <div ref={paginationRef} className="mt-8">
                                        {/* 分页组件 */}
                                        <div className="flex justify-center space-x-2">
                                            {/* ... 分页按钮 ... */}
                                        </div>
                                    </div>
                                </>
                            )}
                        </ApiStateWrapper>
                    </main>
                </div>
            </section>
            {/* 遮罩层 */}
            <div
                id="drawer-overlay"
                className="fixed inset-0 bg-black opacity-0 pointer-events-none transition-opacity duration-300 z-[998]"
                onClick={() => {
                    const drawerElem = document.getElementById('mobile-filter-drawer');
                    const overlayElem = document.getElementById('drawer-overlay');

                    if (drawerElem && overlayElem) {
                        drawerElem.classList.add('translate-y-full');
                        overlayElem.classList.remove('opacity-70');
                        overlayElem.classList.add('opacity-0');
                        overlayElem.classList.add('pointer-events-none');
                        document.body.classList.remove('overflow-hidden');
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        const drawerElem = document.getElementById('mobile-filter-drawer');
                        const overlayElem = document.getElementById('drawer-overlay');

                        if (drawerElem && overlayElem) {
                            drawerElem.classList.add('translate-y-full');
                            overlayElem.classList.remove('opacity-70');
                            overlayElem.classList.add('opacity-0');
                            overlayElem.classList.add('pointer-events-none');
                            document.body.classList.remove('overflow-hidden');
                        }
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label="Close filter drawer"
            />
            {/* 移动端筛选器抽屉 */}
            <div
                id="mobile-filter-drawer"
                className="fixed bottom-0 inset-x-0 z-[999] bg-white dark:bg-gray-800 rounded-t-2xl shadow-lg transform translate-y-full transition-transform duration-300 max-h-[90vh] overflow-y-auto"
            >
                {/* 抽屉头部 */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-4 py-3 border-b dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
                    <button
                        onClick={() => {
                            const drawerElem = document.getElementById('mobile-filter-drawer');
                            const overlayElem = document.getElementById('drawer-overlay');

                            if (drawerElem && overlayElem) {
                                drawerElem.classList.add('translate-y-full');
                                overlayElem.classList.remove('opacity-70');
                                overlayElem.classList.add('opacity-0');
                                overlayElem.classList.add('pointer-events-none');
                                document.body.classList.remove('overflow-hidden');
                            }
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {/* 抽屉内容 */}
                <div className="p-4">
                    <ProductFilter
                        onFilter={(newFilters) => {
                            setDrawerFilters(newFilters as DrawerFilters);
                            handleFilterChange(newFilters as DrawerFilters);

                            // 关闭抽屉
                            const drawerElem = document.getElementById('mobile-filter-drawer');
                            const overlayElem = document.getElementById('drawer-overlay');

                            if (drawerElem && overlayElem) {
                                drawerElem.classList.add('translate-y-full');
                                overlayElem.classList.remove('opacity-70');
                                overlayElem.classList.add('opacity-0');
                                overlayElem.classList.add('pointer-events-none');
                                document.body.classList.remove('overflow-hidden');
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
}