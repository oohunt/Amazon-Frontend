import { ObjectId } from 'mongodb';
import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';
import type { ContentPageUpdateRequest } from '@/types/cms';

// 获取单个内容页面
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    status: false,
                    message: '无效的页面ID'
                },
                { status: 400 }
            );
        }

        // 获取数据库连接
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_pages');

        // 查询页面
        const page = await collection.findOne({ _id: new ObjectId(id) });

        if (!page) {
            return NextResponse.json(
                {
                    status: false,
                    message: '未找到页面'
                },
                { status: 404 }
            );
        }

        // 转换格式
        const formattedPage = {
            ...page,
            _id: page._id.toString(),
            createdAt: page.createdAt instanceof Date ? page.createdAt.toISOString() : page.createdAt,
            updatedAt: page.updatedAt instanceof Date ? page.updatedAt.toISOString() : page.updatedAt,
            publishedAt: page.publishedAt instanceof Date ? page.publishedAt.toISOString() : page.publishedAt
        };

        return NextResponse.json({
            status: 200,
            success: true,
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

// 更新内容页面
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body: ContentPageUpdateRequest = await request.json();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    status: false,
                    message: '无效的页面ID'
                },
                { status: 400 }
            );
        }

        // 获取数据库连接
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_pages');

        // 检查页面是否存在
        const existingPage = await collection.findOne({ _id: new ObjectId(id) });

        if (!existingPage) {
            return NextResponse.json(
                {
                    status: false,
                    message: '未找到页面'
                },
                { status: 404 }
            );
        }

        // 如果更新了slug，检查它是否与其他页面冲突
        if (body.slug && body.slug !== existingPage.slug) {
            const slugExists = await collection.findOne({
                slug: body.slug,
                _id: { $ne: new ObjectId(id) }
            });

            if (slugExists) {
                return NextResponse.json(
                    {
                        status: false,
                        message: '该URL路径已被使用，请选择其他路径'
                    },
                    { status: 400 }
                );
            }
        }

        // 构建更新数据
        const updateData = {
            ...body,
            updatedAt: new Date()
        };

        // 如果状态变为已发布且未指定发布日期，则添加当前时间作为发布日期
        if (body.status === 'published' && body.publishedAt === undefined && existingPage.status !== 'published') {
            updateData.publishedAt = new Date();
        }

        // 更新数据
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: '未找到页面'
                },
                { status: 404 }
            );
        }

        // 获取更新后的页面
        const updatedPage = await collection.findOne({ _id: new ObjectId(id) });

        // 转换格式
        const formattedPage = {
            ...updatedPage,
            _id: updatedPage?._id.toString(),
            createdAt: updatedPage?.createdAt instanceof Date ? updatedPage.createdAt.toISOString() : updatedPage?.createdAt,
            updatedAt: updatedPage?.updatedAt instanceof Date ? updatedPage.updatedAt.toISOString() : updatedPage?.updatedAt,
            publishedAt: updatedPage?.publishedAt instanceof Date ? updatedPage.publishedAt.toISOString() : updatedPage?.publishedAt
        };

        return NextResponse.json({
            status: 200,
            success: true,
            message: '页面更新成功',
            data: formattedPage
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: '更新页面失败，请稍后再试',
                error: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}

// 删除内容页面
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    status: false,
                    message: '无效的页面ID'
                },
                { status: 400 }
            );
        }

        // 获取数据库连接
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_pages');

        // 删除页面
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: '未找到页面或删除失败'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: 200,
            success: true,
            message: '页面删除成功'
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: '删除页面失败，请稍后再试',
                error: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
} 