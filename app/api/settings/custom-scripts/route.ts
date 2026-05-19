import { ObjectId } from 'mongodb';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { ScriptLocation, type CustomScript, type CustomScriptRequest } from '@/lib/models/CustomScript';
import clientPromise from '@/lib/mongodb';

// Completely disable route segment cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Validate script request data
 */
function validateScriptRequest(data: Partial<CustomScriptRequest>): CustomScriptRequest {
    // Validate data types and required fields
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid script data');
    }

    if (!data.name || typeof data.name !== 'string') {
        throw new Error('Script name is required');
    }

    if (!data.content || typeof data.content !== 'string') {
        throw new Error('Script content is required');
    }

    // Validate location field
    if (!data.location || !Object.values(ScriptLocation).includes(data.location)) {
        throw new Error('Invalid script location');
    }

    // return validated data
    return {
        _id: data._id || undefined,
        name: data.name,
        content: data.content,
        location: data.location as ScriptLocation,
        enabled: data.enabled === true, // Ensure enabled is boolean
    };
}

/**
 * GET /api/settings/custom-scripts - Fetch custom scripts list
 */
export async function GET(request: Request) {
    try {
        // Get URL query parameters
        const url = new URL(request.url);
        const enabledParam = url.searchParams.get('enabled');
        const locationParam = url.searchParams.get('location');

        // Connect to database
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'oohunt');
        const collection = db.collection('custom_scripts');

        // Build query conditions
        const query: Record<string, boolean | string> = {};

        // If enabled parameter specified, add to query conditions
        if (enabledParam !== null) {
            query.enabled = enabledParam === 'true';
        }

        // If location parameter specified, add to query conditions
        if (locationParam && Object.values(ScriptLocation).includes(locationParam as ScriptLocation)) {
            query.location = locationParam;
        }

        // Get script list
        const scripts = await collection.find(query).toArray();

        // Convert to response format
        const formattedScripts = scripts.map(script => ({
            ...script,
            _id: script._id.toString() // Convert ObjectId to string
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
 * PUT /api/settings/custom-scripts - Update custom script
 */
export async function PUT(request: Request) {
    try {
        // Parse request body
        const requestData = await request.json();

        // Validate data format - single script or script array
        let scriptsToUpdate: CustomScriptRequest[] = [];

        if (Array.isArray(requestData)) {
            // Handle script array
            scriptsToUpdate = requestData.map(validateScriptRequest);
        } else {
            // Handle individual script
            scriptsToUpdate = [validateScriptRequest(requestData)];
        }

        // Connect to database
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'oohunt');
        const collection = db.collection('custom_scripts');

        // Bulk update scripts
        const updateResults = await Promise.all(
            scriptsToUpdate.map(async script => {
                if (script._id) {
                    // update existing script
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
                    // create new script
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

        // Invalidate cache for related paths
        revalidatePath('/api/settings/custom-scripts');

        // return update result — do not cache PUT response
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
 * DELETE /api/settings/custom-scripts - Delete custom script
 */
export async function DELETE(request: Request) {
    try {
        // Get URL query parameters
        const url = new URL(request.url);
        const idParam = url.searchParams.get('id');

        if (!idParam) {
            return NextResponse.json(
                { error: 'Script ID is required' },
                { status: 400 }
            );
        }

        // Connect to database
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'oohunt');
        const collection = db.collection('custom_scripts');

        try {
            // delete script
            const result = await collection.deleteOne({ _id: new ObjectId(idParam) });

            if (result.deletedCount === 0) {
                return NextResponse.json(
                    { error: 'Script not found' },
                    { status: 404 }
                );
            }

            // Invalidate cache for related paths
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
                { error: 'Database operation failed', details: dbError instanceof Error ? dbError.message : String(dbError) },
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