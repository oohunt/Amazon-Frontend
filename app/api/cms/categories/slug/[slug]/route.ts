import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

// 通过slug获取分类
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {

        // 首先等待params解析完成
        const resolvedParams = await params;
        const slug = resolvedParams.slug;

        if (!slug) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Slug is required'
                },
                { status: 400 }
            );
        }

        // 获取数据库连接
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_categories');

        // 查询分类
        const category = await collection.findOne({ slug });


        if (!category) {
            return NextResponse.json(
                {
                    status: false,
                    message: 'Category not found'
                },
                { status: 404 }
            );
        }

        // 转换格式
        const formattedCategory = {
            ...category,
            _id: category._id.toString(),
            createdAt: category.createdAt instanceof Date ? category.createdAt.toISOString() : category.createdAt,
            updatedAt: category.updatedAt instanceof Date ? category.updatedAt.toISOString() : category.updatedAt
        };

        return NextResponse.json({
            status: true,
            data: formattedCategory
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: 'Failed to get category, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 