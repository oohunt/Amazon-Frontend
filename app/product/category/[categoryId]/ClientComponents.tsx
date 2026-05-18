"use client";

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import ProductsPage from '@/app/product/page';

// 客户端包装组件
export function CategoryPageWrapper({ categorySlug }: { categorySlug: string }) {
    const pathname = usePathname();

    // 强制确保URL一致性，防止被覆盖
    useEffect(() => {
        // 防止竞争条件：延迟执行以确保是最后一个执行的URL更新
        const timer = setTimeout(() => {
            const expectedPath = `/product/category/${encodeURIComponent(categorySlug)}`;

            // 只有当实际路径与预期路径不一致时才更新
            if (pathname !== expectedPath && categorySlug) {
                // 直接使用浏览器API更新URL
                window.history.replaceState(
                    null,
                    '',
                    expectedPath
                );
            }
        }, 100); // 100ms延迟，确保它是最后执行的操作

        return () => clearTimeout(timer);
    }, [pathname, categorySlug]);

    return <ProductsPage />;
} 