import bcryptjs from 'bcryptjs';
import type { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Use bcryptjs (pure JavaScript implementation) instead of bcrypt to avoid native module loading issues

import { ensureTemplateExists } from '@/lib/email/email-template-init';
import { EMAIL_TEMPLATE_TYPES } from '@/lib/email/email-template-types';
import { getCompiledEmailTemplate } from '@/lib/email/email-templates';
import type { User } from '@/lib/models/User';
import { UserRole, isAdminAccount, isSuperAdminAccount } from '@/lib/models/UserRole';
import clientPromise from '@/lib/mongodb';

// Lazy-initialize Resend - only create the instance when actually sending emails
function getResend() {
    return new Resend(process.env.RESEND_API_KEY || 'placeholder');
}

export async function POST(request: Request) {
    try {
        // Parse the request body to get registration information
        const { name, email, password } = await request.json();

        // Basic validation
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Please provide all required fields' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters long' },
                { status: 400 }
            );
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Please provide a valid email address' },
                { status: 400 }
            );
        }

        // Get database connection
        const clientPromiseWithTimeout = Promise.race([
            clientPromise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database connection timeout')), 30000)
            )
        ]) as Promise<MongoClient>;

        const client = await clientPromiseWithTimeout;
        const db = client.db(process.env.MONGODB_DB || "oohunt");

        // Check if the email is already in use
        const existingUser = await db.collection('users').findOne({ email });

        if (existingUser) {
            return NextResponse.json(
                { error: 'This email is already registered' },
                { status: 409 }
            );
        }

        // Hash the password using bcryptjs
        const saltRounds = 10;
        const hashedPassword = await bcryptjs.hash(password, saltRounds);

        // Determine user role
        let role = UserRole.USER;

        // First check if this is a super admin account
        if (isSuperAdminAccount(email)) {
            role = UserRole.SUPER_ADMIN;
        }
        // Then check if this is a regular admin account
        else if (isAdminAccount(email)) {
            role = UserRole.ADMIN;
        }

        // Create user
        const newUser: Omit<User, '_id'> = {
            name,
            email,
            password: hashedPassword,
            role,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(newUser);

        // Send registration confirmation email
        try {
            // Attempt to fetch and compile the email template from the database by template type
            const templateResult = await getCompiledEmailTemplate(
                EMAIL_TEMPLATE_TYPES.USER_REGISTRATION,
                {
                    name,
                    email,
                    date: new Date()
                },
                true // Flag as query-by-type
            );

            // Prepare email sending configuration
            const emailConfig = {
                from: 'onboarding@resend.dev', // Default sender
                to: [email],
                subject: 'Welcome to OOHUNT! Account Registration',
                html: `<p>Hello ${name}, thank you for registering!</p>` // Default simple content
            };

            // If the template was retrieved successfully, use its content
            if (templateResult.success) {
                emailConfig.subject = templateResult.subject || emailConfig.subject;
                emailConfig.html = templateResult.html || emailConfig.html;

                // If the template specifies a sender and the environment is not development, use the template sender
                if (templateResult.from && process.env.NODE_ENV !== 'development') {
                    emailConfig.from = templateResult.from;
                }
            } else {
                // If the template does not exist or is not active, attempt to create the default template
                await ensureTemplateExists(EMAIL_TEMPLATE_TYPES.USER_REGISTRATION);
            }

            // Send the confirmation email using Resend
            await getResend().emails.send(emailConfig);
        } catch (emailError) {
            return NextResponse.json({
                success: false,
                message: 'Failed to send registration email',
                error: emailError instanceof Error ? emailError.message : 'Unknown error'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'User registered successfully',
            userId: result.insertedId,
            role
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Registration error:', error);

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message === 'Database connection timeout') {
                return NextResponse.json(
                    { error: 'Unable to connect to the database. Please try again later.' },
                    { status: 503 }
                );
            }

            if (error.message.includes('timed out after') || error.message.includes('ETIMEDOUT')) {
                return NextResponse.json(
                    { error: 'Database connection timed out. Please try again later.' },
                    { status: 503 }
                );
            }
        }

        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        );
    }
} 