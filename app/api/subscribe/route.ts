import { NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

// Resend init deferred — reserved for welcome email sending
// const resend = new Resend(process.env.RESEND_API_KEY);

// Default email template — used only when no database template is available
const _DEFAULT_EMAIL_TEMPLATE = `
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16A085; margin: 0 0 10px;">Welcome to OOHUNT!</h1>
            <p style="font-size: 16px; color: #666;">Thank you for subscribing.</p>
        </div>

        <div style="margin-bottom: 30px; line-height: 1.6;">
            <p>Hello <strong>{{email}}</strong>,</p>
            <p>Thank you for subscribing to our newsletter. You will now receive the latest deals and offers directly to your inbox.</p>
            <p>We&apos;re excited to share amazing deals with you soon!</p>
        </div>

        <div style="background-color: #16A085; padding: 15px; border-radius: 4px; text-align: center;">
            <a
                href="https://example.com/deals"
                style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;"
            >
                Check Out Today&apos;s Deals
            </a>
        </div>

        <div style="margin-top: 30px; font-size: 12px; color: #3999; text-align: center;">
            <p>If you didn&apos;t subscribe to our newsletter, you can ignore this email.</p>
            <p>
                © 2025 OOHUNT. All rights reserved.<br />
                Our company address, City, Country
            </p>
        </div>
    </div>
</div>
`;

// Email validation
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
}

// Source type validation
function isValidSourceType(sourceType: string): boolean {
    return ['general', 'blog'].includes(sourceType);
}

// Handle subscription request
export async function POST(request: Request) {
    try {
        // Parse request body
        const body = await request.json();
        const { email, sourceType = 'general', formId } = body;

        // Validate email
        if (!email || !isValidEmail(email)) {
            return NextResponse.json({
                success: false,
                message: 'Please provide a valid email address'
            }, { status: 400 });
        }

        // Validate source type
        if (!isValidSourceType(sourceType)) {
            return NextResponse.json({
                success: false,
                message: 'Invalid source type'
            }, { status: 400 });
        }

        // Connect to database
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB || 'oohunt');
        const collection = db.collection('subscriptions');

        // Check if email already exists
        const existingSubscription = await collection.findOne({ email });

        if (existingSubscription) {
            // Update existing subscription
            await collection.updateOne(
                { email },
                {
                    $set: {
                        updatedAt: new Date(),
                        lastFormId: formId || null,
                    },
                    $addToSet: {
                        sourceTypes: sourceType
                    }
                }
            );

            return NextResponse.json({
                success: true,
                message: 'Your subscription has been updated!',
                isUpdate: true
            });
        }

        // Create new subscription
        await collection.insertOne({
            email,
            sourceTypes: [sourceType],
            formId: formId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
        });

        // Return success response
        return NextResponse.json({
            success: true,
            message: 'Thank you for subscribing! We will send the latest news to your inbox.'
        });

    } catch {

        return NextResponse.json({
            success: false,
            message: 'An error occurred while processing your request, please try again later'
        }, { status: 500 });
    }
}
