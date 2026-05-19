import clientPromise from '../mongodb';

import { DEFAULT_TEMPLATES } from './email-template-defaults';
import type { EmailTemplateType } from './email-template-types';

/**
 * Initialize default email templates
 * Checks if templates of each type already exist in the database; if not, creates the default templates
 */
export async function initializeEmailTemplates(): Promise<{
    success: boolean;
    created: number;
    error?: string;
}> {
    try {
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const db = client.db(dbName);
        const collection = db.collection('email_templates');

        // Count newly created templates
        let createdCount = 0;

        // Check and create each type of template
        for (const template of DEFAULT_TEMPLATES) {
            // Check if a template of this type already exists
            const existingTemplate = await collection.findOne({ type: template.type });

            if (!existingTemplate) {
                // Add creation and update timestamps
                const now = new Date();
                const templateData = {
                    ...template,
                    createdAt: now,
                    updatedAt: now,
                };

                // Insert the default template into the database
                await collection.insertOne(templateData);
                createdCount++;
            }
        }

        return {
            success: true,
            created: createdCount,
        };
    } catch (error) {

        return {
            success: false,
            created: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get the template of the specified type, creating a default template if it does not exist
 * Primarily used to ensure critical email functionality does not fail due to missing templates
 */
export async function ensureTemplateExists(type: EmailTemplateType): Promise<boolean> {
    try {
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const db = client.db(dbName);
        const collection = db.collection('email_templates');

        // Check if a template of this type already exists
        const existingTemplate = await collection.findOne({ type });

        if (!existingTemplate) {
            // Get the default template configuration for this type
            const defaultTemplate = DEFAULT_TEMPLATES.find(t => t.type === type);

            if (defaultTemplate) {
                // Add creation and update timestamps
                const now = new Date();
                const templateData = {
                    ...defaultTemplate,
                    createdAt: now,
                    updatedAt: now,
                };

                // Insert the default template into the database
                await collection.insertOne(templateData);

                return true;
            } else {

                return false;
            }
        }

        return true;
    } catch {

        return false;
    }
} 