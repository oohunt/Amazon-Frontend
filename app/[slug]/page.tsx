import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';

import ContentRenderer from '@/components/cms/ContentRenderer';

// 假设你有一个函数或API客户端来获取页面数据
// 例如，从你的 API 路由 /api/cms/content/[slug] 获取
async function getPageData(slug: string): Promise<PageData | null> {
    // 在实际应用中，你需要替换成真实的 API 调用
    const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004'; // Use environment variable or default

    try {
        // 使用相对路径或绝对路径调用API
        // 对于服务器组件调用同一应用内的API，相对路径通常足够
        const res = await fetch(`${apiBaseUrl}/api/cms/content/${slug}`, { cache: 'no-store' }); // Example: no cache

        if (!res.ok) {
            if (res.status === 404) {
                return null; // 页面未找到
            }

            return null;
        }

        const json = await res.json();

        if (json.status && json.data) {
            return json.data as PageData; // 直接返回 data 部分
        } else {
            return null;
        }
    } catch {
        // Don't throw here, let the page component handle null and show 404
        // throw new Error('Failed to fetch page data due to network or parsing error');
        return null; // Return null on fetch error so page shows 404
    }

    /* --- 移除或注释掉模拟数据 --- 
    console.log(`Fetching mock data for slug: ${slug}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // 模拟网络延迟
    if (slug === 'test-page' || slug === 'test') { // 包含你之前测试的slug
        return {
            _id: '123',
            title: `测试页面 (${slug})`,
            slug: slug,
            content: `<p>这是一个 <strong>${slug}</strong> 的页面内容。</p><h2>二级标题</h2><p>更多内容...</p><img src="/images/placeholder.png" alt="Placeholder Image">`, // 添加图片示例
            excerpt: `测试页面 ${slug} 的简短描述`,
            status: 'published',
            author: 'Admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            categories: [],
            tags: [],
            seoData: { metaTitle: `测试页面 ${slug} SEO 标题`, metaDescription: `测试页面 ${slug} 元描述` },
            products: [] // 假设可以关联产品
        };
    }
    console.log(`Mock data not found for slug: ${slug}`);
    return null; // 模拟找不到页面
     --- 模拟数据结束 --- */
}

// 定义页面数据类型（需要与你的 API 返回匹配）
interface PageData {
    _id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    status: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    categories: string[];
    tags: string[];
    seoData?: {
        metaTitle?: string;
        metaDescription?: string;
        canonicalUrl?: string;
        ogImage?: string;
    };
    products?: unknown[]; // 调整为你的产品类型
}

// 生成页面元数据 (可选但推荐)
export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    // Await params before accessing slug
    const resolvedParams = await params;
    const page = await getPageData(resolvedParams.slug);

    if (!page) {
        return {
            title: '页面未找到'
        };
    }

    // 从页面数据生成元数据
    const previousImages = (await parent).openGraph?.images || [];

    return {
        title: page.seoData?.metaTitle || page.title,
        description: page.seoData?.metaDescription || page.excerpt,
        alternates: {
            canonical: page.seoData?.canonicalUrl || `/${resolvedParams.slug}`,
        },
        openGraph: {
            title: page.seoData?.metaTitle || page.title,
            description: page.seoData?.metaDescription || page.excerpt || '',
            url: `/${resolvedParams.slug}`,
            // 注意：确保 ogImage URL 是绝对路径或完整的 URL
            images: page.seoData?.ogImage ? [page.seoData.ogImage, ...previousImages] : previousImages,
        },
    };
}

// 页面组件
export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
    // Await params before accessing slug
    const resolvedParams = await params;
    const pageData: PageData | null = await getPageData(resolvedParams.slug);

    // 如果页面数据未找到，显示 404
    if (!pageData) {
        notFound();
    }

    return (
        <main className="container mx-auto px-4 py-8">
            <article className="prose lg:prose-xl max-w-none bg-white p-6 rounded shadow"> {/* 添加背景和阴影 */}
                <h1 className="mb-4">{pageData.title}</h1>

                <ContentRenderer content={pageData.content} />

                {pageData.products && pageData.products.length > 0 && (
                    <div className="mt-8 pt-4 border-t"> {/* 添加分隔线 */}
                        <h2 className="text-xl font-semibold mb-4">Related Products</h2>
                        {/* 在这里渲染产品列表 */}
                        <p className="text-gray-500">(Product rendering logic待实现)</p>
                    </div>
                )}

                <div className="mt-8 text-sm text-gray-500 pt-4 border-t"> {/* 添加页脚信息 */}
                    <span>Author: {pageData.author}</span> |
                    <span> Last Updated: {new Date(pageData.updatedAt).toLocaleDateString()}</span>
                </div>
            </article>
        </main>
    );
}

// 添加 revalidate 选项（可选）
// 这将使页面在指定秒数后重新生成（增量静态再生 ISR）
// export const revalidate = 60; // 每 60 秒重新验证一次 