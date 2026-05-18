import { ObjectId } from 'mongodb';
import { type NextRequest, NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';
import type { ContentCategoryUpdateRequest } from '@/types/cms';

// 获取单个分类
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
                    message: '无效的分类ID'
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
        const category = await collection.findOne({ _id: new ObjectId(id) });

        if (!category) {
            return NextResponse.json(
                {
                    status: false,
                    message: '未找到分类'
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
                message: '获取分类失败，请稍后再试',
                error: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}

// 更新分类
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body: ContentCategoryUpdateRequest = await request.json();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                {
                    status: false,
                    message: '无效的分类ID'
                },
                { status: 400 }
            );
        }

        // 获取数据库连接
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_categories');

        // 检查分类是否存在
        const existingCategory = await collection.findOne({ _id: new ObjectId(id) });

        if (!existingCategory) {
            return NextResponse.json(
                {
                    status: false,
                    message: '未找到分类'
                },
                { status: 404 }
            );
        }

        // 如果更新了slug，检查它是否与其他分类冲突
        if (body.slug && body.slug !== existingCategory.slug) {
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
                    message: '未找到分类'
                },
                { status: 404 }
            );
        }

        // 获取更新后的分类
        const updatedCategory = await collection.findOne({ _id: new ObjectId(id) });

        // 转换格式
        const formattedCategory = {
            ...updatedCategory,
            _id: updatedCategory?._id.toString(),
            createdAt: updatedCategory?.createdAt instanceof Date ? updatedCategory.createdAt.toISOString() : updatedCategory?.createdAt,
            updatedAt: updatedCategory?.updatedAt instanceof Date ? updatedCategory.updatedAt.toISOString() : updatedCategory?.updatedAt
        };

        return NextResponse.json({
            status: true,
            message: '分类更新成功',
            data: formattedCategory
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: '更新分类失败，请稍后再试',
                error: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
}

// 删除分类
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
                    message: '无效的分类ID'
                },
                { status: 400 }
            );
        }

        // 获取数据库连接
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const client = await clientPromise;
        const db = client.db(dbName);
        const collection = db.collection('cms_categories');
        const pagesCollection = db.collection('cms_pages');

        // 检查是否有页面使用此分类
        const pagesUsingCategory = await pagesCollection.countDocuments({
            categories: id
        });

        if (pagesUsingCategory > 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: `无法删除分类，有${pagesUsingCategory}个页面正在使用该分类`
                },
                { status: 400 }
            );
        }

        // 检查是否有子分类
        const childCategories = await collection.countDocuments({
            parentId: id
        });

        if (childCategories > 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: `无法删除分类，有${childCategories}个子分类依赖于该分类`
                },
                { status: 400 }
            );
        }

        // 删除分类
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                {
                    status: false,
                    message: '未找到分类或删除失败'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            status: true,
            message: '分类删除成功'
        });
    } catch (error) {

        return NextResponse.json(
            {
                status: false,
                message: '删除分类失败，请稍后再试',
                error: error instanceof Error ? error.message : '未知错误'
            },
            { status: 500 }
        );
    }
} 