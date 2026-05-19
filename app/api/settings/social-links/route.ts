import { NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';
import type { SocialLinks } from '@/types/api';

// Configure route segment cache — cache for 10 minutes
export const revalidate = 600;

/**
 * GET /api/settings/social-links - Fetch social media link settings
 */
export async function GET() {
    try {
        // Connect to database
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'oohunt');
        const collection = db.collection('settings');

        // Get social media link settings
        const settings = await collection.findOne(
            { id: 'social_links' }
        );

        // If settings not found, return default empty settings
        if (!settings) {
            return NextResponse.json({
                twitter: '',
                facebook: '',
                instagram: '',
                youtube: '',
                linkedin: '',
                pinterest: '',
            }, {
                headers: {
                    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60'
                }
            });
        }

        // Ensure returned data format is correct
        const socialLinks: SocialLinks = {
            twitter: settings.twitter || '',
            facebook: settings.facebook || '',
            instagram: settings.instagram || '',
            youtube: settings.youtube || '',
            linkedin: settings.linkedin || '',
            pinterest: settings.pinterest || '',
        };

        return NextResponse.json(socialLinks, {
            headers: {
                'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=60'
            }
        });
    } catch {
        return NextResponse.json(
            { error: 'Get social links failed' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/settings/social-links - Update social media link settings
 */
export async function PUT(request: Request) {
    try {
        // Parse request body
        const data = await request.json() as SocialLinks;

        // Validate data
        const socialLinks: SocialLinks = {
            twitter: data.twitter || '',
            facebook: data.facebook || '',
            instagram: data.instagram || '',
            youtube: data.youtube || '',
            linkedin: data.linkedin || '',
            pinterest: data.pinterest || '',
        };

        // Connect to database
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'oohunt');
        const collection = db.collection('settings');

        // update or create settings
        await collection.updateOne(
            { id: 'social_links' },
            {
                $set: {
                    ...socialLinks,
                    id: 'social_links', // Ensure id field exists
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );

        // return updated data — do not cache PUT response
        return NextResponse.json(socialLinks, {
            headers: {
                'Cache-Control': 'no-store, must-revalidate'
            }
        });
    } catch {

        return NextResponse.json(
            { error: 'Update social links failed' },
            { status: 500 }
        );
    }
}
