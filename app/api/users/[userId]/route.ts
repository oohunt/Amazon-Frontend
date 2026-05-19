import { ObjectId } from 'mongodb';
import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { UserRole, isSuperAdmin } from '@/lib/models/UserRole';
import clientPromise from '@/lib/mongodb';

// Configure route options
export const dynamic = 'force-dynamic';

// Global route handler for debugging
export async function OPTIONS(_request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Allow': 'GET, DELETE, PATCH, OPTIONS'
        }
    });
}

// Fetch user details
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await context.params;

        // Validate permissions
        const session = await auth();

        if (!session?.user ||
            (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // Validate parameters
        if (!userId || !ObjectId.isValid(userId)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        // Database operation
        const client = await clientPromise;
        const db = client.db('oohunt');

        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0 } }
        );

        if (!user) {
            return NextResponse.json(
                { error: 'User does not exist' },
                { status: 404 }
            );
        }

        // Format response data
        const userData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || UserRole.USER,
            createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
            lastLogin: user.lastLogin ? user.lastLogin.toISOString() : undefined,
            image: user.image || undefined,
            status: user.status || 'active',
            provider: user.provider || 'credentials'
        };

        return NextResponse.json(userData);
    } catch {
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}

// Delete user
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await context.params;

        // Validate permissions
        const session = await auth();

        if (!session?.user ||
            (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
            return NextResponse.json(
                { error: 'No permission to delete user' },
                { status: 403 }
            );
        }

        // Validate parameters
        if (!userId || !ObjectId.isValid(userId)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        // Prevent deleting self
        if (session.user.id === userId) {
            return NextResponse.json(
                { error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        // Database operation
        const client = await clientPromise;
        const db = client.db('oohunt');
        const objectId = new ObjectId(userId);

        // Find user
        const user = await db.collection('users').findOne({ _id: objectId });

        if (!user) {
            return NextResponse.json(
                { error: 'User does not exist' },
                { status: 404 }
            );
        }

        // Check permission (only super admins can delete admins)
        if ((user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) &&
            !isSuperAdmin(session.user.role as UserRole)) {
            return NextResponse.json(
                { error: 'Regular admin cannot delete admin accounts' },
                { status: 403 }
            );
        }

        // Delete user
        const result = await db.collection('users').deleteOne({ _id: objectId });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: 'Failed to delete user' },
                { status: 500 }
            );
        }

        // delete associated data
        await db.collection('favorites').deleteMany({ userId });

        return NextResponse.json({
            message: 'User deleted successfully',
            id: userId
        });
    } catch {
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
}

// update user basic info
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await context.params;

        // Validate permissions
        const session = await auth();

        if (!session?.user ||
            (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
            return NextResponse.json(
                { error: 'No permission to update user information' },
                { status: 403 }
            );
        }

        // Validate parameters
        if (!userId || !ObjectId.isValid(userId)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        // Get request data
        const updates = await request.json();

        // Validate update data
        if (!updates || typeof updates !== 'object') {
            return NextResponse.json(
                { error: 'Invalid update data' },
                { status: 400 }
            );
        }

        // remove sensitive fields
        delete updates.password;
        delete updates.role;
        delete updates._id;
        delete updates.email;

        // Database operation
        const client = await clientPromise;
        const db = client.db('oohunt');
        const objectId = new ObjectId(userId);

        const result = await db.collection('users').updateOne(
            { _id: objectId },
            {
                $set: {
                    ...updates,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: 'User does not exist' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            message: 'User info updated successfully',
            id: userId
        });
    } catch {
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
} 