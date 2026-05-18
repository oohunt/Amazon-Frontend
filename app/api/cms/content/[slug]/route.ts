import { ObjectId } from 'mongodb';
import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

interface ProductInfo {
    id: string;
    title: string;
    price: number;
    image: string | null;
    rating: number;
    url: string;
}

interface FormattedPage {
    _id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    status: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    categories: string[];
    tags: string[];
    seoData?: {
        metaTitle?: string;
        metaDescription?: string;
        canonicalUrl?: string;
        ogImage?: string;
    };
    productIds?: string[];
    products?: ProductInfo[];
    isDraft?: boolean;
}

// 通过slug获取内容页面，支持预览草稿
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        // Await params before accessing slug, following the error message suggestion
        const resolvedParams = await params;
        const slug = resolvedParams.slug;

        // 检查是否是预览模式
        const isPreview = request.nextUrl.searchParams.has('preview');

        // 获取数据库连接
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_pages');

        // 构建查询条件，如果是预览模式，则不限制状态
        const query: { slug: string; status?: string } = { slug: slug };

        // 非预览模式下，只获取已发布的页面
        if (!isPreview) {
            query.status = 'published';
        }

        // 查询页面
        const page = await collection.findOne(query);

        if (!page) {
            return NextResponse.json(
                {
                    status: false,
                    message: '未找到页面或页面未发布'
                },
                { status: 404 }
            );
        }

        // 如果是预览且页面是草稿状态，添加预览标记
        const isDraft = page.status === 'draft';

        // 转换格式
        const formattedPage = {
            ...page,
            _id: page._id.toString(),
            createdAt: page.createdAt instanceof Date ? page.createdAt.toISOString() : page.createdAt,
            updatedAt: page.updatedAt instanceof Date ? page.updatedAt.toISOString() : page.updatedAt,
            publishedAt: page.publishedAt instanceof Date ? page.publishedAt.toISOString() : page.publishedAt,
            isDraft: isDraft && isPreview // 添加草稿标记
        };

        // 如果页面包含产品ID，获取产品信息
        if (page.productIds && page.productIds.length > 0) {
            const productsCollection = db.collection('products');

            // 将字符串ID转换为ObjectId
            const objectIds = page.productIds.map((id: string) => {
                return new ObjectId(id);
            });

            // 从products集合中获取相关产品信息
            const products = await productsCollection.find({
                _id: { $in: objectIds },
                status: 'published'
            }).toArray();

            // 添加产品信息到返回数据中
            const productInfoArray: ProductInfo[] = products.map(product => ({
                id: product._id.toString(),
                title: product.title,
                price: product.price || 0,
                image: product.image || product.primaryImage || product.images?.[0] || null,
                rating: product.rating || 0,
                url: `/product/${product.slug || product._id}`
            }));

            // 使用类型断言
            (formattedPage as FormattedPage).products = productInfoArray;
        }

        return NextResponse.json({
            status: true,
            data: formattedPage
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: '获取页面失败，请稍后再试',
                error: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
} 