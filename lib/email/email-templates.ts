import clientPromise from '@/lib/mongodb';

import {
    EMAIL_TEMPLATE_TYPES,
    type EmailTemplateType,
    type TemplateVariables,
    type EmailTemplate
} from './email-template-types';

// Re-exports
export { EMAIL_TEMPLATE_TYPES };
export type { EmailTemplateType, TemplateVariables, EmailTemplate };

/**
 * Get an email template by template ID
 * @param templateId Template ID
 * @returns Email template data
 */
export async function getEmailTemplate(templateId: string): Promise<EmailTemplate | null> {
    try {
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const db = client.db(dbName);
        const collection = db.collection('email_templates');

        const template = await collection.findOne({ templateId });

        if (!template) {
            return null;
        }

        return {
            id: template._id.toString(),
            templateId: template.templateId,
            name: template.name,
            subject: template.subject,
            fromName: template.fromName,
            fromEmail: template.fromEmail,
            htmlContent: template.htmlContent,
            type: template.type || EMAIL_TEMPLATE_TYPES.SUBSCRIPTION_CONFIRMATION,
            isActive: template.isActive !== undefined ? template.isActive : true,
            updatedAt: template.updatedAt instanceof Date ? template.updatedAt.toISOString() : template.updatedAt,
            createdAt: template.createdAt instanceof Date ? template.createdAt.toISOString() : template.createdAt
        };
    } catch {

        return null;
    }
}

/**
 * Get an email template by template type
 * @param type Template type
 * @returns Email template data
 */
export async function getEmailTemplateByType(type: EmailTemplateType): Promise<EmailTemplate | null> {
    try {
        const client = await clientPromise;
        const dbName = process.env.MONGODB_DB || 'oohunt';
        const db = client.db(dbName);
        const collection = db.collection('email_templates');

        // Query for templates of the specified type that are active
        const template = await collection.findOne({ type, isActive: true });

        if (!template) {
            return null;
        }

        return {
            id: template._id.toString(),
            templateId: template.templateId,
            name: template.name,
            subject: template.subject,
            fromName: template.fromName,
            fromEmail: template.fromEmail,
            htmlContent: template.htmlContent,
            type: template.type,
            isActive: template.isActive,
            updatedAt: template.updatedAt instanceof Date ? template.updatedAt.toISOString() : template.updatedAt,
            createdAt: template.createdAt instanceof Date ? template.createdAt.toISOString() : template.createdAt
        };
    } catch {
        return null;
    }
}

/**
 * Replace template content with variables
 * @param content Template content
 * @param variables Variable object
 * @returns Content with variables replaced
 */
export function compileTemplate(content: string, variables: TemplateVariables): string {
    return content.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const value = variables[key.trim()];

        // If the variable is a Date object, format it as a string
        if (value instanceof Date) {
            return value.toLocaleDateString();
        }

        // If the variable exists, return its value; otherwise keep the placeholder as-is
        return value !== undefined ? String(value) : match;
    });
}

/**
 * Get and compile an email template
 * @param templateIdOrType Template ID or type
 * @param variables Template variables
 * @param isType Whether to query by type
 * @returns Processed template data
 */
export async function getCompiledEmailTemplate(
    templateIdOrType: string,
    variables: TemplateVariables,
    isType: boolean = false
): Promise<{
    success: boolean;
    subject?: string;
    html?: string;
    from?: string;
    error?: string;
}> {
    try {
        let template: EmailTemplate | null;

        if (isType) {
            // Query template by type
            template = await getEmailTemplateByType(templateIdOrType as EmailTemplateType);
        } else {
            // Query template by ID (maintain backward compatibility)
            template = await getEmailTemplate(templateIdOrType);
        }

        if (!template) {
            return {
                success: false,
                error: `template ${templateIdOrType} not found or not activated`
            };
        }

        // If the template is disabled, return an error
        if (!template.isActive) {
            return {
                success: false,
                error: `template ${templateIdOrType} is disabled`
            };
        }

        const compiledSubject = compileTemplate(template.subject, variables);
        const compiledHtml = compileTemplate(template.htmlContent, variables);
        const from = `${template.fromName} <${template.fromEmail}>`;

        return {
            success: true,
            subject: compiledSubject,
            html: compiledHtml,
            from
        };
    } catch {

        return {
            success: false,
        };
    }
} 