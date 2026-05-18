import type { MetadataRoute } from 'next';

// 设置为动态生成
export const dynamic = 'force-dynamic';
export const revalidate = 86400; // 每24小时重新验证一次

// 定义API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.oohunt.com';

// 获取分类数据的函数
async function getCategoryStats() {
    try {
        // 使用正确的API路径 - 修正为/api/categories/stats
        const response = await fetch(`${API_BASE_URL}/api/categories/stats?sort_by=count&sort_order=desc&page_size=100`, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(process.env.NEXT_PUBLIC_API_KEY && {
                    'X-API-Key': process.env.NEXT_PUBLIC_API_KEY
                })
            },
            // 设置缓存策略
            next: {
                revalidate: 3600 // 缓存1小时
            }
        });

        if (!response.ok) {
            return { product_groups: {} };
        }

        const result = await response.json();
        // 处理可能的嵌套数据结构
        const data = result.data || result;

        return data;

    } catch {
        return { product_groups: {} };
    }
}

// 网站地图生成函数
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 当前日期作为静态页面的最后修改日期
    const currentDate = new Date().toISOString();

    // 静态路由列表
    const staticRoutes = [
        '',
        '/about-us',
        '/contact-us',
        '/terms-of-use',
        '/privacy-policy',
        '/cookies-policy',
        '/disclaimer',
        '/affiliate-disclosure',
        '/deals',
        '/favorites',
        '/categories',
    ].map(route => ({
        url: `${SITE_URL}${route}`,
        lastModified: currentDate,
        changeFrequency: 'monthly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    try {
        // 获取分类数据
        const categoryStats = await getCategoryStats();
        const categoryRoutes: MetadataRoute.Sitemap = [];

        if (categoryStats && categoryStats.product_groups) {
            // 将对象转换为数组，过滤数量大于50的分类 这里可以控制筛选在站点地图中显示分类的数量
            const categories = Object.entries(categoryStats.product_groups)
                .filter(([_groupName, count]) => (count as number) > 1)
                .map(([groupName]) => groupName);

            // 为每个分类创建路由
            for (const category of categories) {
                categoryRoutes.push({
                    url: `${SITE_URL}/product/category/${encodeURIComponent(category)}`,
                    lastModified: currentDate,
                    changeFrequency: 'daily' as const,
                    priority: 0.7,
                });
            }
        }

        // 合并静态路由和分类路由
        return [...staticRoutes, ...categoryRoutes];
    } catch {
        // 发生错误时仍返回静态路由
        return staticRoutes;
    }
} 