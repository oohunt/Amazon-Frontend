/**
 * Email template type constants
 */
export const EMAIL_TEMPLATE_TYPES = {
    SUBSCRIPTION_CONFIRMATION: 'subscription_confirmation',
    USER_REGISTRATION: 'user_registration',
    PASSWORD_RESET: 'password_reset',
    ORDER_CONFIRMATION: 'order_confirmation'
} as const;

export type EmailTemplateType = typeof EMAIL_TEMPLATE_TYPES[keyof typeof EMAIL_TEMPLATE_TYPES];

/**
 * Email template interface definition
 */
export interface EmailTemplate {
    id: string;
    templateId: string;
    name: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    htmlContent: string;
    type: EmailTemplateType;
    isActive: boolean;
    updatedAt: string;
    createdAt: string;
}

/**
 * Template variable type
 */
export type TemplateVariables = Record<string, string | number | Date>; 