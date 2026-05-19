import { NextResponse } from 'next/server';
import { Resend } from 'resend';

import clientPromise from '@/lib/mongodb';

// Lazy-init Resend — only instantiated when actually sending email
function getResend() {
    return new Resend(process.env.RESEND_API_KEY || 'placeholder');
}

// Check whether email notification is enabled (default: enabled)
const enableEmailNotification = process.env.ENABLE_CONTACT_EMAIL_NOTIFICATION !== 'false';

// Contact form submission API
export async function POST(request: Request) {
    try {
        const { name, email, subject, message, formSource, formId, phone } = await request.json();

        // Validate required fields
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { success: false, message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, message: 'Please provide a valid email address' },
                { status: 400 }
            );
        }

        // Connect to MongoDB
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const db = client.db(dbName);
        const collection = db.collection('contact_messages');

        // Save contact info to database
        await collection.insertOne({
            name,
            email,
            subject,
            message,
            phone,
            formSource,
            formId,
            createdAt: new Date(),
            read: false,
            isProcessed: false,
        });

        // If source is email subscription form, also add to subscription list
        if (formSource === 'general' || formSource === 'blog') {
            try {
                const subscriptionCollection = db.collection('subscriptions');

                // Check if email already exists
                const existingSubscription = await subscriptionCollection.findOne({ email });

                if (existingSubscription) {
                    // Update existing subscription
                    await subscriptionCollection.updateOne(
                        { email },
                        {
                            $set: {
                                updatedAt: new Date(),
                                lastFormId: formId || null,
                            },
                            $addToSet: {
                                sourceTypes: formSource
                            }
                        }
                    );
                } else {
                    // Create new subscription
                    await subscriptionCollection.insertOne({
                        email,
                        sourceTypes: [formSource],
                        formId: formId || null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        isActive: true
                    });
                }
            } catch {

                // Continue processing, does not affect main flow
            }
        }

        // Send notification email to admin (if enabled)
        if (enableEmailNotification && process.env.RESEND_API_KEY) {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@oohunt.com';

            try {
                await getResend().emails.send({
                    from: 'noreply@oohunt.com',
                    to: adminEmail,
                    subject: `New ${formSource ? `${formSource} form` : 'contact form'} message: ${subject}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                            <h1 style="color: #16A085;">New ${formSource ? `${formSource} form` : 'contact form'} message</h1>
                            <p><strong>Name:</strong> ${name}</p>
                            <p><strong>Email:</strong> ${email}</p>
                            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
                            <p><strong>Subject:</strong> ${subject}</p>
                            ${formSource ? `<p><strong>Form Source:</strong> ${formSource}</p>` : ''}
                            ${formId ? `<p><strong>Form ID:</strong> ${formId}</p>` : ''}
                            <p><strong>Message:</strong></p>
                            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                    `,
                });
            } catch {
                // Log email failure only, does not affect form submission success
            }
        }

        // Return different success message based on form source
        let successMessage = 'Your message has been sent successfully, we will reply to you as soon as possible!';

        if (formSource === 'general' || formSource === 'blog') {
            successMessage = 'Thank you for subscribing! You will receive the latest news and offers.';
        }

        return NextResponse.json(
            { success: true, message: successMessage },
            { status: 200 }
        );
    } catch {

        return NextResponse.json(
            { success: false, message: 'Failed to submit the form' },
            { status: 500 }
        );
    }
} 