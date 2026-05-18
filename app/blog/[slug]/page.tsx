import type { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import ContentRenderer from '@/components/cms/ContentRenderer';
import { SafeImage } from '@/components/common/SafeImage';

// 获取文章数据
async function getPageData(slug: string, preview: boolean = false): Promise<PageData | null> {
    const apiBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3004';

    try {
        // 添加preview参数以支持草稿预览
        const url = preview
            ? `${apiBaseUrl}/api/cms/content/${slug}?preview=true`
            : `${apiBaseUrl}/api/cms/content/${slug}`;

        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) {
            if (res.status === 404) {
                return null;
            }

            return null;
        }

        const json = await res.json();

        if (json.status && json.data) {
            return json.data as PageData;
        } else {
            return null;
        }
    } catch {
        return null;
    }
}

// 定义文章数据类型
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
    products?: unknown[];
    featuredImage?: string;
    isDraft?: boolean; // 添加草稿标记
}

// 生成页面元数据
export async function generateMetadata(
    { params, searchParams }: { params: Promise<{ slug: string }>, searchParams?: Promise<{ [key: string]: string | string[] | undefined }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const isPreview = resolvedSearchParams?.preview !== undefined;
    const page = await getPageData(resolvedParams.slug, isPreview);

    if (!page) {
        return {
            title: 'Post Not Found'
        };
    }

    const previousImages = (await parent).openGraph?.images || [];

    return {
        title: `Oohunt - ${page.seoData?.metaTitle || page.title}`,
        description: page.seoData?.metaDescription || page.excerpt,
        alternates: {
            canonical: page.seoData?.canonicalUrl || `/blog/${resolvedParams.slug}`,
        },
        openGraph: {
            title: `Oohunt - ${page.seoData?.metaTitle || page.title}`,
            description: page.seoData?.metaDescription || page.excerpt || '',
            url: `/blog/${resolvedParams.slug}`,
            images: page.seoData?.ogImage ? [page.seoData.ogImage, ...previousImages] : previousImages,
        },
    };
}

// 格式化日期
function _formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// 页面组件
export default async function BlogPost({ params, searchParams }: {
    params: Promise<{ slug: string }>,
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const isPreview = resolvedSearchParams?.preview !== undefined;
    const pageData: PageData | null = await getPageData(resolvedParams.slug, isPreview);

    if (!pageData) {
        notFound();
    }

    // 计算阅读时长
    const wordCount = pageData.content.split(/\s+/).length;
    const _readingTime = Math.max(1, Math.ceil(wordCount / 200)); // 假设平均阅读速度为每分钟200词

    // 获取特色图片URL（优先使用featuredImage字段）
    const featuredImageUrl = pageData.featuredImage || pageData.seoData?.ogImage;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
            {/* 草稿模式提示条 */}
            {pageData.isDraft && (
                <div className="fixed top-0 left-0 w-full bg-amber-500 text-white py-2 px-4 text-center z-50">
                    <div className="container mx-auto">
                        <p className="font-medium">
                            Preview Mode: This is a draft post that has not been published yet. It can only be accessed via preview link.
                        </p>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 max-w-6xl">
                <article>
                    <header className="mb-12 text-center">
                        <Link href="/blog" className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-8 hover:bg-blue-100 transition-colors">
                            Back to Blog
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">{pageData.title}</h1>

                        {/* 草稿状态标签 */}
                        {pageData.isDraft && (
                            <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-4">
                                Draft
                            </div>
                        )}
                    </header>

                    {/* 添加特色图片显示 */}
                    {featuredImageUrl && (
                        <div className="mb-8 rounded-xl overflow-hidden shadow-md mx-auto max-w-full">
                            <div className="relative mx-auto">
                                <SafeImage
                                    src={featuredImageUrl}
                                    alt={pageData.title}
                                    width={1200}
                                    height={700}
                                    className="object-cover w-full"
                                    priority
                                />
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm p-8">
                        <div className="prose prose-lg max-w-none">
                            <ContentRenderer content={pageData.content} />
                        </div>

                        {pageData.tags && pageData.tags.length > 0 && (
                            <div className="mt-12 pt-6 border-t border-gray-100">
                                <h3 className="text-sm font-medium text-gray-500 mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {pageData.tags.map((tag: string) => (
                                        <Link
                                            key={tag}
                                            href={`/blog/tags/${tag}`}
                                            className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-blue-100 hover:text-blue-700 transition-colors"
                                        >
                                            {tag}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {pageData.products && pageData.products.length > 0 && (
                            <div className="mt-12 pt-6 border-t border-gray-100">
                                <h3 className="text-xl font-semibold mb-4">Related Products</h3>
                                <p className="text-gray-500">(Product display to be implemented)</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 text-center">
                        <Link
                            href="/blog"
                            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                            Back to All Posts
                        </Link>
                    </div>
                </article>
            </div>
        </div>
    );
} 