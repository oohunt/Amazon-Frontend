import { NextResponse, type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { UserRole } from '@/lib/models/UserRole';
import clientPromise from '@/lib/mongodb';

// Ensure API routes are properly registered
export const dynamic = 'force-dynamic';

// Fetch user list
export async function GET(_request: NextRequest) {
    try {
        // Validate if current user is admin
        const session = await auth();

        if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
            return NextResponse.json(
                { error: 'No permission to access user list' },
                { status: 403 }
            );
        }

        // Connect to database
        const client = await clientPromise;
        const db = client.db('oohunt');

        // Fetch user list (excluding password fields)
        const users = await db.collection('users')
            .find({})
            .project({ password: 0 })
            .sort({ createdAt: -1 })
            .toArray();

        // Handle returned data format
        const formattedUsers = users.map(user => ({
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || UserRole.USER,
            createdAt: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
            lastLogin: user.lastLogin ? user.lastLogin.toISOString() : undefined,
            image: user.image || undefined,
            status: user.status || 'active',
            provider: user.provider || 'credentials'
        }));

        return NextResponse.json({
            message: 'User list fetched successfully',
            data: formattedUsers
        });
    } catch {
        return NextResponse.json(
            { error: 'Server error' },
            { status: 500 }
        );
    }
} 