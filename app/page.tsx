"use client";

import { useState, useEffect, useRef } from "react";

import { NewsletterSubscribe } from "@/components/email/NewsletterSubscribe";
import { CategoryNavigation } from "@/components/ui/CategoryNavigation";
import { CategoryProducts } from "@/components/ui/CategoryProducts";
import { FeaturedDeals } from "@/components/ui/FeaturedDeals";
import { HeroSection } from "@/components/ui/HeroSection";
import { useCategoryStats } from "@/lib/hooks";

// 定义分类接口
interface Category {
    name: string;
    slug: string;
}

// 产品组到分类的映射 - kept in sync with CategoryNavigation
const productGroupToCategoryMapping: Record<string, { slug: string, name: string }> = {
    'Electronics': { slug: 'Electronics', name: 'Electronics' },
    'Clothing, Shoes & Jewelry': { slug: 'Clothing, Shoes & Jewelry', name: 'Clothing & Jewelry' },
    'Home & Kitchen': { slug: 'Home & Kitchen', name: 'Home & Kitchen' },
    'Sports & Outdoors': { slug: 'Sports & Outdoors', name: 'Sports & Outdoors' },
    'Beauty & Personal Care': { slug: 'Beauty & Personal Care', name: 'Beauty' },
    'Toys & Games': { slug: 'Toys & Games', name: 'Toys & Games' },
    'Books': { slug: 'Books', name: 'Books' },
    'Automotive': { slug: 'Automotive', name: 'Automotive' },
    'Health & Household': { slug: 'Health & Household', name: 'Health' },
    'Tools & Home Improvement': { slug: 'Tools & Home Improvement', name: 'Tools' },
    'Pet Supplies': { slug: 'Pet Supplies', name: 'Pet Supplies' },
    'Patio, Lawn & Garden': { slug: 'Patio, Lawn & Garden', name: 'Garden & Patio' },
    'Baby': { slug: 'Baby', name: 'Baby' },
    'Baby Products': { slug: 'Baby Products', name: 'Baby' },
    'Office Products': { slug: 'Office Products', name: 'Office' },
};

// 添加获取导航栏高度的函数
const getNavbarHeight = () => {
    return parseInt(
        getComputedStyle(document.documentElement)
            .getPropertyValue('--navbar-height')
            .slice(0, -2)
    );
};

export default function Home() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [processed, setProcessed] = useState(false);
    const catalogRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);
    const mainContentRef = useRef<HTMLDivElement>(null);
    const newsletterRef = useRef<HTMLDivElement>(null);
    const paginationRef = useRef<HTMLDivElement>(null);

    // 使用useCategoryStats钩子获取分类数据
    const { data: categoryStats, isLoading } = useCategoryStats({
        page: 1,
        page_size: 50,
        sort_by: 'count',
        sort_order: 'desc'
    });

    // 当分类数据加载完成后处理 - 仅在数据第一次加载或明确改变时处理
    useEffect(() => {
        // 如果正在加载或已经处理过数据，则跳过
        if (isLoading || processed || !categoryStats || !categoryStats.product_groups) {
            return;
        }

        try {
            // 转换product_groups数据为分类列表
            const productGroups = categoryStats.product_groups;

            // 将对象转换为数组，过滤数量大于50的分类，并按照数量排序
            const sortedCategories = Object.entries(productGroups)
                .filter(([_groupName, count]) => count > 50)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8) // 取前8个
                .map(([groupName]) => {
                    // 使用原始的groupName作为slug，确保与API参数一致
                    const slug = groupName;

                    // 从映射中获取显示名称，如果没有则使用原始分类名称
                    const displayName = productGroupToCategoryMapping[groupName]?.name || groupName;

                    return {
                        name: displayName,
                        slug: slug
                    };
                });

            setCategories(sortedCategories);
            // 标记为已处理
            setProcessed(true);
        }
        catch {
            // 出错时也标记为已处理，避免重复尝试
            setProcessed(true);
        }
    }, [isLoading, categoryStats, processed]);

    // Add scroll handling effect
    useEffect(() => {
        const handleScroll = () => {
            if (!sidebarRef.current || !mainContentRef.current || !catalogRef.current || !newsletterRef.current || !paginationRef.current) return;

            const sidebarElem = sidebarRef.current;
            const catalogRect = catalogRef.current.getBoundingClientRect();
            const mainContentRect = mainContentRef.current.getBoundingClientRect();
            const sidebarRect = sidebarElem.getBoundingClientRect();
            const newsletterRect = newsletterRef.current?.getBoundingClientRect();
            const paginationRect = paginationRef.current?.getBoundingClientRect();

            // 使用CSS变量获取导航栏高度
            const topOffset = getNavbarHeight();

            // 计算父容器的位置
            const containerTop = catalogRect.top + window.scrollY;
            const _newsletterTop = newsletterRect ? newsletterRect.top + window.scrollY : Infinity;
            const paginationTop = paginationRect ? paginationRect.top + window.scrollY : Infinity;

            // 计算侧边栏的高度和当前滚动位置
            const sidebarHeight = sidebarRect.height;
            const scrollY = window.scrollY;

            // 计算主内容区域的实际高度
            const mainContentHeight = mainContentRect.height;

            // 确保侧边栏不会超出主内容区域的底部和分页区域的顶部
            const BUFFER = 20; // 增加缓冲区到20px
            const maxTop = Math.min(
                mainContentHeight - sidebarHeight,
                paginationTop + window.scrollY - containerTop - topOffset - BUFFER
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

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden">
            <div className="flex max-w-[1800px] mx-auto w-full">
                {/* 左侧导航 */}
                <div className="hidden lg:block w-[240px] relative" ref={catalogRef}>
                    <div
                        ref={sidebarRef}
                        className="w-[240px] bg-white shadow-sm border-r border-gray-100 z-40"
                        style={{
                            minHeight: 'calc(100vh - 64px)',
                            willChange: 'transform'
                        }}
                    >
                        <div className="p-4">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
                            <CategoryNavigation useAnchorLinks={true} />
                        </div>
                    </div>
                </div>

                {/* 右侧主内容区域 */}
                <main ref={mainContentRef} className="flex-1 min-h-screen w-full">
                    <div className="px-2 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">
                        {/* 顶部英雄区域 */}
                        <HeroSection />

                        {/* 限时特惠区域 */}
                        <FeaturedDeals />

                        {/* 分隔线 */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="px-4 text-sm text-gray-500 bg-white">
                                    Recommended for you
                                </span>
                            </div>
                        </div>

                        {/* 添加各个分类区域 - 使用从API获取的分类数据 */}
                        {categories.map((category) => (
                            <CategoryProducts
                                key={category.slug}
                                id={`category-${category.slug}`}
                                title={category.name}
                                slug={category.slug}
                                className="mb-8"
                            />
                        ))}

                        {/* 分页区域 */}
                        <div ref={paginationRef} className="mb-8">
                            {/* 分隔线 */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-4 text-sm text-gray-500 bg-white">
                                        End of products
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 邮箱订阅组件 */}
                        <div ref={newsletterRef}>
                            <NewsletterSubscribe />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
} 