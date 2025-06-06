import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { ScriptLocation, type CustomScript, type CustomScriptRequest } from '@/lib/models/CustomScript';
import clientPromise from '@/lib/mongodb';

// 完全禁用路由段缓存
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 验证脚本请求数据
 */
function validateScriptRequest(data: Partial<CustomScriptRequest>): CustomScriptRequest {
    // 验证数据类型和必需字段
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid script data');
    }

    if (!data.name || typeof data.name !== 'string') {
        throw new Error('Script name is required');
    }

    if (!data.content || typeof data.content !== 'string') {
        throw new Error('Script content is required');
    }

    // 验证location字段
    if (!data.location || !Object.values(ScriptLocation).includes(data.location)) {
        throw new Error('Invalid script location');
    }

    // 返回验证后的数据
    return {
        _id: data._id || undefined,
        name: data.name,
        content: data.content,
        location: data.location as ScriptLocation,
        enabled: data.enabled === true, // 确保enabled为布尔值
    };
}

/**
 * GET /api/settings/custom-scripts - 获取自定义脚本列表
 */
export async function GET(request: Request) {
    try {
        // 获取URL查询参数
        const url = new URL(request.url);
        const enabledParam = url.searchParams.get('enabled');
        const locationParam = url.searchParams.get('location');

        // 连接数据库
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'oohunt');
        const collection = db.collection('custom_scripts');

        // 构建查询条件
        const query: Record<string, boolean | string> = {};

        // 如果指定了enabled参数，添加到查询条件
        if (enabledParam !== null) {
            query.enabled = enabledParam === 'true';
        }

        // 如果指定了location参数，添加到查询条件
        if (locationParam && Object.values(ScriptLocation).includes(locationParam as ScriptLocation)) {
            query.location = locationParam;
        }

        // 获取脚本列表
        const scripts = await collection.find(query).toArray();

        // 转换为响应格式
        const formattedScripts = scripts.map(script => ({
            ...script,
            _id: script._id.toString() // 转换ObjectId为字符串
        }));

        return NextResponse.json({
            items: formattedScripts,
            total: formattedScripts.length
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (error) {

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Get custom scripts failed' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/settings/custom-scripts - 更新自定义脚本
 */
export async function PUT(request: Request) {
    try {
        // 解析请求体
        const requestData = await request.json();

        // 验证数据格式 - 单个脚本或脚本数组
        let scriptsToUpdate: CustomScriptRequest[] = [];

        if (Array.isArray(requestData)) {
            // 处理脚本数组
            scriptsToUpdate = requestData.map(validateScriptRequest);
        } else {
            // 处理单个脚本
            scriptsToUpdate = [validateScriptRequest(requestData)];
        }

        // 连接数据库
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'oohunt');
        const collection = db.collection('custom_scripts');

        // 批量更新脚本
        const updateResults = await Promise.all(
            scriptsToUpdate.map(async script => {
                if (script._id) {
                    // 更新现有脚本
                    const result = await collection.updateOne(
                        { _id: new ObjectId(script._id) },
                        {
                            $set: {
                                name: script.name,
                                content: script.content,
                                location: script.location,
                                enabled: script.enabled,
                                updatedAt: new Date()
                            }
                        }
                    );

                    return { ...script, updated: result.modifiedCount > 0 };
                } else {
                    // 创建新脚本
                    const newScript: Omit<CustomScript, '_id'> = {
                        name: script.name,
                        content: script.content,
                        location: script.location,
                        enabled: script.enabled,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    const result = await collection.insertOne(newScript);

                    return {
                        ...script,
                        _id: result.insertedId.toString(),
                        created: true
                    };
                }
            })
        );

        // 使相关路径的缓存失效
        revalidatePath('/api/settings/custom-scripts');

        // 返回更新结果 - 不缓存PUT响应
        return NextResponse.json(updateResults, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            }
        });
    } catch (error) {

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Update custom scripts failed' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/settings/custom-scripts - 删除自定义脚本
 */
export async function DELETE(request: Request) {
    try {
        // 获取URL查询参数
        const url = new URL(request.url);
        const idParam = url.searchParams.get('id');

        if (!idParam) {
            return NextResponse.json(
                { error: 'Script ID is required' },
                { status: 400 }
            );
        }

        // 连接数据库
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'oohunt');
        const collection = db.collection('custom_scripts');

        try {
            // 删除脚本
            const result = await collection.deleteOne({ _id: new ObjectId(idParam) });

            if (result.deletedCount === 0) {
                return NextResponse.json(
                    { error: 'Script not found' },
                    { status: 404 }
                );
            }

            // 使相关路径的缓存失效
            revalidatePath('/api/settings/custom-scripts');

            return NextResponse.json({
                success: true,
                deleted: idParam
            }, {
                headers: {
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                }
            });
        } catch (dbError) {

            return NextResponse.json(
                { error: '数据库操作失败', details: dbError instanceof Error ? dbError.message : String(dbError) },
                { status: 500 }
            );
        }
    } catch (error) {

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Delete custom script failed' },
            { status: 500 }
        );
    }
} 