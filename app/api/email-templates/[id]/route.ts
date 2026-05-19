import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

import clientPromise from '@/lib/mongodb';

// Get single template
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Handle querying by templateId
        const isObjectId = ObjectId.isValid(id);

        // Connect to MongoDB
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const db = client.db(dbName);
        const collection = db.collection('email_templates');

        // Query condition: can be _id or templateId
        const query = isObjectId
            ? { _id: new ObjectId(id) }
            : { templateId: id };

        const template = await collection.findOne(query);

        if (!template) {
            return NextResponse.json(
                { success: false, message: 'Email template not found' },
                { status: 404 }
            );
        }

        // return complete template including HTML content
        return NextResponse.json({
            success: true,
            data: {
                id: template._id.toString(),
                templateId: template.templateId,
                name: template.name,
                subject: template.subject,
                fromName: template.fromName,
                fromEmail: template.fromEmail,
                htmlContent: template.htmlContent,
                type: template.type,
                isActive: template.isActive !== undefined ? template.isActive : true,
                updatedAt: template.updatedAt,
                createdAt: template.createdAt
            }
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to fetch email templates, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// update template
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Validate ID format
        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid template ID format' },
                { status: 400 }
            );
        }

        // Get request body data
        const data = await request.json();
        const { name, subject, fromName, fromEmail, htmlContent, templateId, type, isActive } = data;

        // Data validation — improved to provide more detailed error message
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

        // Check templateId uniqueness (excluding currently updated document)
        const existingTemplate = await collection.findOne({
            templateId: templateId,
            _id: { $ne: new ObjectId(id) }
        });

        if (existingTemplate) {
            return NextResponse.json(
                { success: false, message: 'A template with the same type and activation already exists' },
                { status: 400 }
            );
        }

        // update template
        const result = await collection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    name,
                    subject,
                    fromName,
                    fromEmail,
                    htmlContent,
                    templateId,
                    type,
                    isActive: isActive !== undefined ? isActive : true,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Email template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Email template updated successfully'
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to update email template, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// delete template
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Validate ID format
        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: 'Invalid template ID format' },
                { status: 400 }
            );
        }

        // Connect to MongoDB
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const db = client.db(dbName);
        const collection = db.collection('email_templates');

        // delete template
        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, message: 'Email template not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Email template deleted successfully'
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: 'Failed to delete email template, please try again later',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 