import { ObjectId } from 'mongodb';
import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';
import type { ContentTagUpdateRequest } from '@/types/cms';

// 获取单个标签
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
                    message: '无效的标签ID'
                },
                { status: 400 }
            );
        }

        // 获取数据库连接
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_tags');

        // 查询标签
        const tag = await collection.findOne({ _id: new ObjectId(id) });

        if (!tag) {
            return NextResponse.json(
                {
                    status: false,
                    message: '未找到标签'
                },
                { status: 404 }
            );
        }

        // 转换格式
        const formattedTag = {
            ...tag,
            _id: tag._id.toString(),
            createdAt: tag.createdAt instanceof Date ? tag.createdAt.toISOString() : tag.createdAt,
            updatedAt: tag.updatedAt instanceof Date ? tag.updatedAt.toISOString() : tag.updatedAt
        };

        return NextResponse.json({
            status: true,
            data: formattedTag
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: '获取标签失败，请稍后再试',
                error: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}

// 更新标签
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body: ContentTagUpdateRequest = await request.json();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    status: false,
                    message: '无效的标签ID'
                },
                { status: 400 }
            );
        }

        // 获取数据库连接
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_tags');

        // 检查标签是否存在
        const existingTag = await collection.findOne({ _id: new ObjectId(id) });

        if (!existingTag) {
            return NextResponse.json(
                {
                    status: false,
                    message: '未找到标签'
                },
                { status: 404 }
            );
        }

        // 如果更新了slug，检查它是否与其他标签冲突
        if (body.slug && body.slug !== existingTag.slug) {
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

        // 更新数据
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: '未找到标签'
                },
                { status: 404 }
            );
        }

        // 获取更新后的标签
        const updatedTag = await collection.findOne({ _id: new ObjectId(id) });

        // 转换格式
        const formattedTag = {
            ...updatedTag,
            _id: updatedTag?._id.toString(),
            createdAt: updatedTag?.createdAt instanceof Date ? updatedTag.createdAt.toISOString() : updatedTag?.createdAt,
            updatedAt: updatedTag?.updatedAt instanceof Date ? updatedTag.updatedAt.toISOString() : updatedTag?.updatedAt
        };

        return NextResponse.json({
            status: true,
            message: '标签更新成功',
            data: formattedTag
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: false,
                message: '更新标签失败，请稍后再试',
                error: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}

// 删除标签
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
                    message: '无效的标签ID'
                },
                { status: 400 }
            );
        }

        // 获取数据库连接
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_tags');
        const pagesCollection = db.collection('cms_pages');

        // 检查是否有页面使用此标签
        const pagesUsingTag = await pagesCollection.countDocuments({
            tags: id
        });

        if (pagesUsingTag > 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: `无法删除标签，有${pagesUsingTag}个页面正在使用该标签`
                },
                { status: 400 }
            );
        }

        // 删除标签
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: '未找到标签或删除失败'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: true,
            message: '标签删除成功'
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: '删除标签失败，请稍后再试',
                error: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
} 