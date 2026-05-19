import { NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

export async function GET(_request: Request) {
    try {
        // Connect to MongoDB
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const db = client.db(dbName);

        // Get email_templates collection
        const collection = db.collection('email_templates');

        // Query all templates
        const templates = await collection.find({}).toArray();

        // Format return result
        const formattedTemplates = templates.map(template => ({
            id: template._id.toString(),
            templateId: template.templateId,
            name: template.name,
            subject: template.subject,
            fromName: template.fromName,
            fromEmail: template.fromEmail,
            updatedAt: template.updatedAt,
            createdAt: template.createdAt
        }));

        return NextResponse.json({
            success: true,
            data: formattedTemplates
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to get email templates, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// create new template
export async function POST(request: Request) {
    try {
        // Get request body data
        const data = await request.json();
        const { name, subject, fromName, fromEmail, htmlContent, templateId, type, isActive } = data;

        // Data validation — provide detailed error message
        const missingFields = [];

        if (!name) missingFields.push('name');
        if (!subject) missingFields.push('subject');
        if (!fromName) missingFields.push('fromName');
        if (!fromEmail) missingFields.push('fromEmail');
        if (!htmlContent) missingFields.push('htmlContent');
        if (!templateId) missingFields.push('templateId');
        if (!type) missingFields.push('type');

        if (missingFields.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: `this field is required: ${missingFields.join(', ')}`,
                    missingFields
                },
                { status: 400 }
            );
        }

        // Connect to MongoDB
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const db = client.db(dbName);
        const collection = db.collection('email_templates');

        // Check templateId uniqueness
        const existingTemplate = await collection.findOne({ templateId });

        if (existingTemplate) {
            return NextResponse.json(
                { success: false, message: 'A template with the same type and activation already exists' },
                { status: 400 }
            );
        }

        // add create time and update time
        const now = new Date();
        const templateData = {
            name,
            subject,
            fromName,
            fromEmail,
            htmlContent,
            templateId,
            type,
            isActive: isActive !== undefined ? isActive : true,
            createdAt: now,
            updatedAt: now
        };

        // Insert new template
        const result = await collection.insertOne(templateData);

        if (!result.acknowledged) {
            return NextResponse.json(
                { success: false, message: 'Failed to create template, please try again later' },
                { status: 500 }
            );
        }

        // return newly created template ID
        return NextResponse.json({
            success: true,
            message: 'Email template created successfully',
            data: {
                id: result.insertedId.toString()
            }
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to create email template, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 