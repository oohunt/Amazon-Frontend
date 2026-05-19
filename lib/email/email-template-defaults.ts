import { type EmailTemplateType, EMAIL_TEMPLATE_TYPES } from './email-template-types';

/**
 * Default template configuration
 */
export interface DefaultTemplateConfig {
    templateId: string;
    name: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    htmlContent: string;
    type: EmailTemplateType;
    isActive: boolean;
}

/**
 * Default subscription confirmation template
 */
const subscriptionConfirmationTemplate: DefaultTemplateConfig = {
    templateId: 'subscription_confirmation',
    name: 'Subscription Confirmation Email',
    subject: 'Welcome to Oohunt!',
    fromName: 'Oohunt Team',
    fromEmail: 'noreply@Oohunt.com',
    type: EMAIL_TEMPLATE_TYPES.SUBSCRIPTION_CONFIRMATION,
    isActive: true,
    htmlContent: `
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16A085; margin: 0 0 10px;">Welcome to Oohunt!</h1>
            <p style="font-size: 16px; color: #666;">Thank you for subscribing.</p>
        </div>
        
        <div style="margin-bottom: 30px; line-height: 1.6;">
            <p>Hello <strong>{{email}}</strong>,</p>
            <p>Thank you for subscribing to our newsletter. You will now receive the latest deals and offers directly to your inbox.</p>
            <p>We're excited to share amazing deals with you soon!</p>
        </div>
        
        <div style="background-color: #16A085; padding: 15px; border-radius: 4px; text-align: center;">
            <a 
                href="https://example.com/deals" 
                style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;"
            >
                Check Out Today's Deals
            </a>
        </div>
        
        <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
            <p>If you didn't subscribe to our newsletter, you can ignore this email.</p>
            <p>
                © ${new Date().getFullYear()} Oohunt. All rights reserved.<br />
                Our company address, City, Country
            </p>
        </div>
    </div>
</div>
`
};

/**
 * Default user registration template
 */
const userRegistrationTemplate: DefaultTemplateConfig = {
    templateId: 'user_registration',
    name: 'User Registration Confirmation Email',
    subject: 'Welcome to Oohunt! Account Registration',
    fromName: 'Oohunt Team',
    fromEmail: 'noreply@Oohunt.com',
    type: EMAIL_TEMPLATE_TYPES.USER_REGISTRATION,
    isActive: true,
    htmlContent: `
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16A085; margin: 0 0 10px;">Welcome to Oohunt!</h1>
            <p style="font-size: 16px; color: #666;">Your account has been created successfully</p>
        </div>
        
        <div style="margin-bottom: 30px; line-height: 1.6;">
            <p>Hello <strong>{{name}}</strong>,</p>
            <p>Thank you for registering with us. Your account has been created successfully.</p>
            <p>You can now log in to access exclusive deals and offers!</p>
        </div>
        
        <div style="background-color: #16A085; padding: 15px; border-radius: 4px; text-align: center;">
            <a 
                href="https://example.com/login" 
                style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;"
            >
                Log In to Your Account
            </a>
        </div>
        
        <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
            <p>If you didn't create this account, please contact our support team.</p>
            <p>
                © ${new Date().getFullYear()} Oohunt. All rights reserved.<br />
                Our company address, City, Country
            </p>
        </div>
    </div>
</div>
`
};

/**
 * Default password reset template
 */
const passwordResetTemplate: DefaultTemplateConfig = {
    templateId: 'password_reset',
    name: 'Password Reset Email',
    subject: 'Reset Your Oohunt Password',
    fromName: 'Oohunt Team',
    fromEmail: 'noreply@Oohunt.com',
    type: EMAIL_TEMPLATE_TYPES.PASSWORD_RESET,
    isActive: true,
    htmlContent: `
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16A085; margin: 0 0 10px;">Reset Your Password</h1>
            <p style="font-size: 16px; color: #666;">We received a request to reset your password</p>
        </div>
        
        <div style="margin-bottom: 30px; line-height: 1.6;">
            <p>Hello,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
        </div>
        
        <div style="background-color: #16A085; padding: 15px; border-radius: 4px; text-align: center; margin-bottom: 30px;">
            <a 
                href="{{resetUrl}}" 
                style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;"
            >
                Reset Password
            </a>
        </div>
        
        <div style="line-height: 1.6; margin-bottom: 30px;">
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">{{resetUrl}}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request a password reset, you can ignore this email - your password will remain unchanged.</p>
        </div>
        
        <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
            <p>
                © ${new Date().getFullYear()} Oohunt. All rights reserved.<br />
                Our company address, City, Country
            </p>
        </div>
    </div>
</div>
`
};

/**
 * Default order confirmation template
 */
const orderConfirmationTemplate: DefaultTemplateConfig = {
    templateId: 'order_confirmation',
    name: 'Order Confirmation Email',
    subject: 'Your Oohunt Order Confirmation',
    fromName: 'Oohunt Team',
    fromEmail: 'orders@Oohunt.com',
    type: EMAIL_TEMPLATE_TYPES.ORDER_CONFIRMATION,
    isActive: true,
    htmlContent: `
<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 30px; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16A085; margin: 0 0 10px;">Order Confirmation</h1>
            <p style="font-size: 16px; color: #666;">Thank you for your order!</p>
        </div>
        
        <div style="margin-bottom: 30px; line-height: 1.6;">
            <p>Hello <strong>{{name}}</strong>,</p>
            <p>Thank you for your purchase. Your order has been confirmed and is being processed.</p>
            <p>Order Number: <strong>{{orderNumber}}</strong></p>
            <p>Order Date: <strong>{{orderDate}}</strong></p>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h2 style="color: #16A085; font-size: 18px; margin-bottom: 15px;">Order Summary</h2>
            <div style="border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden;">
                <div style="background-color: #f0f0f0; padding: 10px 15px; font-weight: bold; display: flex;">
                    <div style="flex: 3;">Product</div>
                    <div style="flex: 1; text-align: center;">Quantity</div>
                    <div style="flex: 1; text-align: right;">Price</div>
                </div>
                <div style="padding: 15px;">
                    {{orderItems}}
                </div>
                <div style="padding: 15px; border-top: 1px solid #e0e0e0; text-align: right;">
                    <p>Subtotal: {{subtotal}}</p>
                    <p>Shipping: {{shipping}}</p>
                    <p>Tax: {{tax}}</p>
                    <p style="font-weight: bold; font-size: 16px;">Total: {{total}}</p>
                </div>
            </div>
        </div>
        
        <div style="background-color: #16A085; padding: 15px; border-radius: 4px; text-align: center; margin-bottom: 30px;">
            <a 
                href="{{trackingUrl}}" 
                style="color: white; text-decoration: none; font-weight: bold; font-size: 16px;"
            >
                Track Your Order
            </a>
        </div>
        
        <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
            <p>If you have any questions about your order, please contact our customer service.</p>
            <p>
                © ${new Date().getFullYear()} Oohunt. All rights reserved.<br />
                Our company address, City, Country
            </p>
        </div>
    </div>
</div>
`
};

/**
 * Export all default templates
 */
export const DEFAULT_TEMPLATES: DefaultTemplateConfig[] = [
    subscriptionConfirmationTemplate,
    userRegistrationTemplate,
    passwordResetTemplate,
    orderConfirmationTemplate
];

/**
 * Get default template by type
 * @param type Template type
 * @returns Default template configuration
 */
export function getDefaultTemplateByType(type: EmailTemplateType): DefaultTemplateConfig | undefined {
    return DEFAULT_TEMPLATES.find(template => template.type === type);
} 