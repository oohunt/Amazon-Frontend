import { ObjectId } from 'mongodb';
import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { UserRole, isSuperAdmin } from '@/lib/models/UserRole';
import clientPromise from '@/lib/mongodb';

// Configure route options
export const dynamic = 'force-dynamic';

// Update user role
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ userId: string }> }
) {
    try {
        // Validate permissions
        const session = await auth();

        if (!session?.user || !isSuperAdmin(session.user.role as UserRole)) {
            return NextResponse.json(
                { error: 'Only super admins can change user roles' },
                { status: 403 }
            );
        }

        // Validate parameters
        const { userId } = await context.params;

        if (!userId || !ObjectId.isValid(userId)) {
            return NextResponse.json(
                { error: 'Invalid user ID' },
                { status: 400 }
            );
        }

        // Get request data
        const { role } = await request.json();

        if (!role || !Object.values(UserRole).includes(role as UserRole)) {
            return NextResponse.json(
                { error: 'Invalid user role' },
                { status: 400 }
            );
        }

        // Prevent modifying own role
        if (session.user.id === userId) {
            return NextResponse.json(
                { error: 'Cannot modify your own role' },
                { status: 400 }
            );
        }

        // Database operation
        const client = await clientPromise;
        const db = client.db('oohunt');
        const objectId = new ObjectId(userId);

        const result = await db.collection('users').updateOne(
            { _id: objectId },
            {
                $set: {
                    role: role as UserRole,
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
            message: 'User role updated successfully',
            id: userId,
            role
        });
    } catch {
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
} 