import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';

import { EmailCollectionFormView } from './EmailCollectionFormView';

// Form attribute type interface
export interface EmailFormAttributes {
    formTitle: string;
    formDescription: string;
    inputPlaceholder: string;
    submitButtonText: string;
    sourceType: 'general' | 'blog';
    formId: string;
    style: 'default' | 'compact' | 'blog' | 'deals';
}

// Extend commands type
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        emailCollectionForm: {
            /**
             * Insert email collection form
             */
            insertEmailCollectionForm: (attributes?: Partial<EmailFormAttributes>) => ReturnType;
        };
    }
}

// Define Email Collection Form node extension
export const EmailCollectionFormBlot = Node.create<{
    HTMLAttributes: Record<string, string | number | boolean | null | undefined>;
}>({
    name: 'emailCollectionForm', // Node name
    group: 'block',              // Block-level node
    atom: true,                  // As an indivisible atomic node
    isolating: true,             // Isolate content

    // Define attributes and default values
    addAttributes() {
        return {
            formTitle: {
                default: 'Subscribe to get the latest news',
            },
            formDescription: {
                default: 'Enter your email address to get the latest product information and discount offers.',
            },
            inputPlaceholder: {
                default: 'your.email@example.com',
            },
            submitButtonText: {
                default: 'Subscribe',
            },
            sourceType: {
                default: 'general',
                parseHTML: (element) => element.getAttribute('data-source-type') || 'general',
                renderHTML: (attributes) => {
                    return {
                        'data-source-type': attributes.sourceType,
                    };
                },
            },
            formId: {
                default: () => `form-${Date.now()}`, // Generate unique ID
                parseHTML: (element) => element.getAttribute('data-form-id') || `form-${Date.now()}`,
                renderHTML: (attributes) => {
                    return {
                        'data-form-id': attributes.formId,
                    };
                },
            },
            style: {
                default: 'default',
                parseHTML: (element) => element.getAttribute('data-style') || 'default',
                renderHTML: (attributes) => {
                    return {
                        'data-style': attributes.style,
                    };
                },
            },
        };
    },

    // Define HTML parsing rules
    parseHTML() {
        return [
            {
                tag: 'div[data-type="email-collection-form"]',
            },
        ];
    },

    // Define HTML rendering rules
    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(
                {
                    'data-type': 'email-collection-form',
                    'data-form-title': HTMLAttributes.formTitle,
                    'data-form-description': HTMLAttributes.formDescription,
                    'data-input-placeholder': HTMLAttributes.inputPlaceholder,
                    'data-submit-button-text': HTMLAttributes.submitButtonText,
                    'data-source-type': HTMLAttributes.sourceType,
                    'data-form-id': HTMLAttributes.formId,
                    'data-style': HTMLAttributes.style
                },
                HTMLAttributes
            ),
            '', // Empty content, actual content rendered by React component
        ];
    },

    // Addnode view renderer
    addNodeView() {
        return ReactNodeViewRenderer(EmailCollectionFormView);
    },

    // Addcommands
    addCommands() {
        return {
            insertEmailCollectionForm: (attributes = {}) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: attributes,
                });
            },
        };
    },
}); 