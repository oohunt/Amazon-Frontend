'use client';

import { Edit, Eye, PlusCircle, Save, X, Upload, Code, Trash2, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import type Quill from 'quill';
import { useEffect, useState, useRef } from 'react';

import { EMAIL_TEMPLATE_TYPES, type EmailTemplateType } from '@/lib/email/email-template-types';
import { showErrorToast, showSuccessToast } from '@/lib/toast';


// Import CSS — ensure styles display correctly in both edit and preview
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";

// Inline styles — ensure only one toolbar is shown
const inlineStyles = `
.ql-toolbar.ql-snow + .ql-toolbar.ql-snow {
  display: none !important;
}
`;

// Dynamically import QuillEditor component to avoid SSR errors
const QuillEditor = dynamic(
    async () => {
        const { default: Quill } = await import('quill');

        // create a helper function to clean IDs, ensuring they can be used as CSS selectors
        const sanitizeId = (id: string): string => {
            // remove all special characters from ID, keep only letters, numbers, and hyphens
            return `quill-${id.replace(/[^a-zA-Z0-9-]/g, "")}`;
        };

        const QuillEditorComponent = ({
            value,
            onChange,
            placeholder,
            modules,
            formats,
            theme = 'snow',
            className = '',
            onEditorReady,
            id = 'quill-editor'
        }: {
            value: string;
            onChange: (content: string) => void;
            placeholder?: string;
            modules?: Record<string, unknown>;
            formats?: string[];
            theme?: string;
            className?: string;
            onEditorReady?: (quill: Quill) => void;
            id?: string;
        }) => {
            const editorRef = useRef<HTMLDivElement>(null);
            const quillInstance = useRef<Quill | null>(null);
            // Ensure ID is a safe CSS selector
            const safeId = sanitizeId(id);
            // Addinitialization flag to ensure only initialized once
            const isInitialized = useRef(false);

            useEffect(() => {
                // Check if editor is already initialized to avoid creating duplicate instances
                if (editorRef.current && !isInitialized.current) {
                    // Check if DOM element already has Quill class to avoid re-initialization
                    if (editorRef.current.classList.contains('ql-container')) {
                        return;
                    }

                    isInitialized.current = true;

                    try {
                        // Use passed modules configuration directly without extra processing
                        quillInstance.current = new Quill(editorRef.current, {
                            modules,
                            placeholder,
                            theme,
                            formats
                        });

                        // Set initial content
                        if (value) {
                            quillInstance.current.clipboard.dangerouslyPasteHTML(value);
                        }

                        // Listen for content change events
                        quillInstance.current.on('text-change', () => {
                            const html = editorRef.current?.querySelector('.ql-editor')?.innerHTML || '';

                            onChange(html);
                        });

                        // Provide Quill instance to parent component
                        if (onEditorReady) {
                            onEditorReady(quillInstance.current);
                        }
                    } catch {
                        return
                    }
                }

                // Cleanup function
                return () => {
                    if (quillInstance.current) {
                        try {
                            quillInstance.current.off('text-change');
                            quillInstance.current = null;
                            isInitialized.current = false;
                        } catch {
                            return
                        }
                    }
                };
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, []);

            // Sync content when value updates via props
            useEffect(() => {
                if (quillInstance.current && value) {
                    const currentContent = editorRef.current?.querySelector('.ql-editor')?.innerHTML;

                    if (currentContent !== value) {
                        quillInstance.current.clipboard.dangerouslyPasteHTML(value);
                    }
                }
            }, [value]);

            return (
                <div className={`quill-container ${className}`} id={`${safeId}-container`}>
                    <div ref={editorRef} className="quill-editor" id={safeId} />
                </div>
            );
        };

        QuillEditorComponent.displayName = 'QuillEditor';

        return QuillEditorComponent;
    },
    {
        ssr: false,
        loading: () => <div className="h-96 border border-gray-300 rounded-md flex items-center justify-center text-gray-500">Loading editor...</div>
    }
);

// Template type definition
interface EmailTemplate {
    id: string;
    templateId: string;
    name: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    htmlContent: string;
    type: string;
    isActive: boolean;
    updatedAt: string;
    createdAt: string;
}

// Blank template
const EMPTY_TEMPLATE: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
    templateId: '',
    name: '',
    subject: '',
    fromName: '',
    fromEmail: '',
    htmlContent: '',
    type: EMAIL_TEMPLATE_TYPES.SUBSCRIPTION_CONFIRMATION,
    isActive: true,
};

// Formats supported by rich text editor
const EDITOR_FORMATS = [
    // Inline formatting
    'background', 'bold', 'color', 'font', 'code', 'italic', 'link',
    'size', 'strike', 'script', 'underline',

    // Block formatting
    'blockquote', 'header', 'indent', 'list', 'align', 'direction', 'code-block',

    // Embed format
    'formula', 'image', 'video'
];

// editor default configuration
const DEFAULT_QUILL_MODULES = {
    toolbar: [
        // Font-related
        [{ 'font': [] }],
        [{ 'size': ['small', false, 'large', 'huge'] }],

        // Text formatting
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'script': 'sub' }, { 'script': 'super' }],
        ['blockquote', 'code-block'],

        // Color-related
        [{ 'color': [] }, { 'background': [] }],

        // Text alignment and direction
        [{ 'align': [] }],
        [{ 'direction': 'rtl' }],

        // Lists and indentation
        [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],
        [{ 'indent': '-1' }, { 'indent': '+1' }],

        // Title
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        // Links, images, videos and formulas
        ['link', 'image', 'video', 'formula'],

        // Clear formatting
        ['clean']
    ],
    history: {
        delay: 1000,
        maxStack: 100,
        userOnly: true
    }
};

// Main component
const TemplatesPageContent = () => {
    // State management
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editorContent, setEditorContent] = useState('');
    const [formData, setFormData] = useState(EMPTY_TEMPLATE);
    const [previewMode, setPreviewMode] = useState(false);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const activeQuillInstance = useRef<Quill | null>(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // AddHTML code edit mode status variable
    const [isHtmlMode, setIsHtmlMode] = useState(false);
    // status management for delete functionality
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<EmailTemplate | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Variable selector options
    const availableVariables = [
        { label: 'Email Address', value: '{{email}}' },
        { label: 'Date', value: '{{date}}' },
        { label: 'Name', value: '{{name}}' },
    ];

    // Template type options
    const templateTypeOptions = [
        { value: EMAIL_TEMPLATE_TYPES.SUBSCRIPTION_CONFIRMATION, label: 'Subscription Confirmation Email' },
        { value: EMAIL_TEMPLATE_TYPES.USER_REGISTRATION, label: 'User Registration Email' },
        { value: EMAIL_TEMPLATE_TYPES.PASSWORD_RESET, label: 'Password Reset Email' },
        { value: EMAIL_TEMPLATE_TYPES.ORDER_CONFIRMATION, label: 'Order Confirmation Email' },
    ];

    // Load template list
    useEffect(() => {
        fetchTemplates();
    }, []);

    // Get template data
    const fetchTemplates = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/email-templates');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch template list');
            }

            setTemplates(data.data);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch template list, please try again later');
        } finally {
            setIsLoading(false);
        }
    };

    // Get single template details
    const fetchTemplateDetails = async (id: string) => {
        try {
            setIsLoading(true);

            const response = await fetch(`/api/email-templates/${id}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch template details');
            }

            setSelectedTemplate(data.data);
            setFormData({
                templateId: data.data.templateId,
                name: data.data.name,
                subject: data.data.subject,
                fromName: data.data.fromName,
                fromEmail: data.data.fromEmail,
                htmlContent: data.data.htmlContent,
                type: data.data.type,
                isActive: data.data.isActive !== undefined ? data.data.isActive : true,
            });
            setEditorContent(data.data.htmlContent);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch template details, please try again later');
            showErrorToast({
                title: "Fetch Failed",
                description: error instanceof Error ? error.message : 'Failed to fetch template details, please try again later',

            });
        } finally {
            setIsLoading(false);
        }
    };

    // save template
    const saveTemplate = async () => {
        try {
            setIsLoading(true);

            // Get content based on current edit mode
            let htmlContent = editorContent;

            // If in rich text mode, get content from Quill instance
            if (!isHtmlMode && activeQuillInstance.current) {
                htmlContent = activeQuillInstance.current.root.innerHTML;
            }
            // If in HTML code mode, use editorContent directly

            // Validate if editor content is empty
            if (!htmlContent || htmlContent.trim() === '') {
                throw new Error('Email content cannot be empty');
            }

            // Ensure form data is complete
            if (!formData.name || !formData.templateId || !formData.subject || !formData.fromName || !formData.fromEmail) {
                throw new Error('Please fill in all required fields');
            }

            // Validate if type field is a valid enum value
            if (!Object.values(EMAIL_TEMPLATE_TYPES).includes(formData.type as EmailTemplateType)) {
                throw new Error('Please select a valid template type');
            }

            // update complete form data — use final HTML content
            const updatedData = {
                ...formData,
                htmlContent: htmlContent
            };

            let response;
            let successMessage;

            if (isCreatingNew) {
                // create new template
                response = await fetch('/api/email-templates', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedData),
                });
                successMessage = "Email template has been created successfully";
            } else {
                // update existing template
                if (!selectedTemplate) return;

                response = await fetch(`/api/email-templates/${selectedTemplate.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedData),
                });
                successMessage = "Email template has been updated successfully";
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to save template');
            }

            // update success notification
            showSuccessToast({
                title: "Save Successful",
                description: successMessage,
            });

            // refresh data
            await fetchTemplates();

            // If newly created template, get its ID and load details
            if (isCreatingNew && data.data && data.data.id) {
                // Addbrief delay to ensure API completes data update
                await new Promise(resolve => setTimeout(resolve, 1000));
                await fetchTemplateDetails(data.data.id);
                setIsCreatingNew(false);
            } else if (selectedTemplate) {
                // Addbrief delay to ensure API completes data update
                await new Promise(resolve => setTimeout(resolve, 1000));
                await fetchTemplateDetails(selectedTemplate.id);
            }

            // Exit edit mode
            setIsEditing(false);
        } catch (error) {
            // Get more detailed error message
            let errorMessage = 'Failed to save template, please try again later';

            if (error instanceof Error) {
                errorMessage = error.message;
            }

            setError(errorMessage);
            showErrorToast({
                title: "Save Failed",
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Handle delete template
    const handleDeleteClick = (template: EmailTemplate, e?: React.MouseEvent) => {
        // If clicked from list, prevent bubbling to trigger template selection
        if (e) {
            e.stopPropagation();
        }

        // Set template to delete and open confirm dialog
        setTemplateToDelete(template);
        setIsDeleteDialogOpen(true);
    };

    // confirm delete template
    const confirmDelete = async () => {
        if (!templateToDelete) return;

        try {
            setIsDeleting(true);

            const response = await fetch(`/api/email-templates/${templateToDelete.id}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete template');
            }

            // deleted successfully notification
            showSuccessToast({
                title: "Delete Successful",
                description: "Email template has been deleted successfully",
            });

            // refresh template list
            await fetchTemplates();

            // If deleted template is currently selected, reset selection status
            if (selectedTemplate && selectedTemplate.id === templateToDelete.id) {
                setSelectedTemplate(null);
                setFormData(EMPTY_TEMPLATE);
                setEditorContent('');
            }

            // close dialog
            setIsDeleteDialogOpen(false);
            setTemplateToDelete(null);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete template, please try again later';

            setError(errorMessage);
            showErrorToast({
                title: "Delete Failed",
                description: errorMessage,
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // CancelDelete
    const cancelDelete = () => {
        setIsDeleteDialogOpen(false);
        setTemplateToDelete(null);
    };

    // Handle form input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle editor content change
    const handleEditorChange = (content: string) => {
        setEditorContent(content);
        // Also update htmlContent field in formData
        setFormData(prev => ({
            ...prev,
            htmlContent: content
        }));
    };

    // Handle editor instance ready event
    const handleEditorReady = (quill: Quill) => {
        activeQuillInstance.current = quill;
    };

    // Insert variable into editor
    const insertVariable = async (variable: string) => {
        // Ensure execute on client side only
        if (typeof window === 'undefined') return;

        try {
            // Operate directly using the saved Quill instance
            if (!activeQuillInstance.current) {
                showErrorToast({
                    title: "Operation Failed",
                    description: "Editor not ready, please try again later",
                });

                return;
            }

            // Get current selection
            const range = activeQuillInstance.current.getSelection(true);

            if (range) {
                // Insert variable text at current selection
                activeQuillInstance.current.insertText(range.index, variable);
                // update selection position
                activeQuillInstance.current.setSelection(range.index + variable.length);

                // Give user feedback
                showSuccessToast({
                    title: "Variable Inserted",
                    description: `${variable} has been inserted into the editor`,
                });
            } else {
                // If no selection, insert at end of editor
                const length = activeQuillInstance.current.getLength();

                activeQuillInstance.current.insertText(length - 1, variable);
                activeQuillInstance.current.setSelection(length - 1 + variable.length);

                showSuccessToast({
                    title: "Variable Inserted",
                    description: `${variable} has been inserted at the end of the editor`,
                });
            }
        } catch {
            showErrorToast({
                title: "Variable Insertion Failed",
                description: "Error occurred while inserting variable, please try again",
            });
        }
    };

    // remove manual sync button, replace with auto-sync
    const syncEditorContent = () => {
        if (activeQuillInstance.current) {
            const content = activeQuillInstance.current.root.innerHTML;

            // update status and form data
            setEditorContent(content);
            setFormData(prev => ({
                ...prev,
                htmlContent: content
            }));

            return true;
        }

        return false;
    };

    // ensure content is synced before saving
    const handleSave = () => {
        // Sync editor content first
        syncEditorContent();
        // Then save template
        saveTemplate();
    };

    // Handle adding new template
    const handleAddTemplate = () => {
        // Reset form to blank template
        setFormData(EMPTY_TEMPLATE);
        // reset editor content
        setEditorContent('');
        // Mark as create new template
        setIsCreatingNew(true);
        // cancel current template selection
        setSelectedTemplate(null);
        // Enter edit mode
        setIsEditing(true);
        // Exit preview mode
        setPreviewMode(false);
    };

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;

        if (!files || files.length === 0) return;

        const file = files[0];

        // Check file type
        if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
            showErrorToast({
                title: 'just upload html file',
                description: 'Please upload a .html file',
            });

            return;
        }

        try {
            setUploadLoading(true);
            const formData = new FormData();

            formData.append('file', file);

            const response = await fetch('/api/email-templates/upload-html', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Upload HTML file failed');
            }

            // update editor content and form data
            setEditorContent(result.data.htmlContent);
            setFormData(prev => ({
                ...prev,
                htmlContent: result.data.htmlContent,
            }));

            showSuccessToast({
                title: 'HTML file uploaded successfully',
                description: `Successfully loaded ${file.name} file content`,
            });
        } catch (error) {
            showErrorToast({
                title: 'Upload Failed',
                description: error instanceof Error ? error.message : 'Upload HTML file failed, please try again',
            });
        } finally {
            setUploadLoading(false);
            // reset file input to allow uploading the same file again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Trigger file selection dialog
    const triggerFileUpload = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Render template list
    const renderTemplateList = () => {
        if (templates.length === 0) {
            return (
                <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600">No email templates yet</p>
                    <button
                        onClick={handleAddTemplate}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Create First Template
                    </button>
                </div>
            );
        }

        return (
            <div className="divide-y divide-gray-200">
                {templates.map(template => (
                    <div
                        key={template.id}
                        className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${selectedTemplate?.id === template.id ? 'bg-blue-50' : ''}`}
                        onClick={() => {
                            fetchTemplateDetails(template.id);
                            setPreviewMode(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                fetchTemplateDetails(template.id);
                                setPreviewMode(false);
                            }
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center">
                                    <h3 className="text-md font-medium text-gray-900">{template.name}</h3>
                                    {template.isActive === false && (
                                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                                            Inactive
                                        </span>
                                    )}
                                    {template.isActive && (
                                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-1">ID: {template.templateId}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Type: {templateTypeOptions.find(opt => opt.value === template.type)?.label || template.type}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Last updated: {new Date(template.updatedAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    className="text-blue-600 hover:text-blue-800"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fetchTemplateDetails(template.id);
                                        setIsEditing(true);
                                        setPreviewMode(false);
                                    }}
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button
                                    className="text-red-600 hover:text-red-800"
                                    onClick={(e) => handleDeleteClick(template, e)}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Render edit form
    const renderEditForm = () => {
        return (
            <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-medium">{isCreatingNew ? "Create New Template" : "Edit Template"}</h2>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                            onClick={handleSave}
                            disabled={isLoading}
                        >
                            <Save className="w-4 h-4 mr-1" />
                            Save
                        </button>
                        <button
                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                            onClick={() => {
                                setIsEditing(false);
                                setIsCreatingNew(false);
                                // Reset to original data only when selectedTemplate exists
                                if (selectedTemplate) {
                                    setFormData({
                                        templateId: selectedTemplate.templateId,
                                        name: selectedTemplate.name,
                                        subject: selectedTemplate.subject,
                                        fromName: selectedTemplate.fromName,
                                        fromEmail: selectedTemplate.fromEmail,
                                        htmlContent: selectedTemplate.htmlContent,
                                        type: selectedTemplate.type,
                                        isActive: selectedTemplate.isActive !== undefined ? selectedTemplate.isActive : true,
                                    });
                                    setEditorContent(selectedTemplate.htmlContent);
                                }
                            }}
                        >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., Subscription Confirmation"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template ID</label>
                            <input
                                type="text"
                                name="templateId"
                                value={formData.templateId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., subscription_confirmation"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Welcome to our newsletter!"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sender Name</label>
                            <input
                                type="text"
                                name="fromName"
                                value={formData.fromName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., OOHUNT Team"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sender Email</label>
                            <input
                                type="email"
                                name="fromEmail"
                                value={formData.fromEmail}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., newsletter@example.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                {templateTypeOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                The template type determines how the system automatically uses this template
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Template Status</label>
                            <div className="mt-2">
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={(e) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                isActive: e.target.checked
                                            }));
                                        }}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Active</span>
                                </label>
                                <p className="mt-1 text-xs text-gray-500">
                                    Disabled templates will not be automatically used by the system
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-3">
                            <label htmlFor="html-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                HTML Content
                            </label>
                            <div className="flex items-center space-x-2">
                                {/* Variable selector */}
                                <select
                                    className="text-sm border border-gray-300 rounded-md p-1.5 bg-white dark:bg-gray-800 dark:border-gray-600"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            insertVariable(e.target.value);
                                            e.target.value = ''; // Reset selection
                                        }
                                    }}
                                    disabled={!activeQuillInstance.current}
                                >
                                    <option value="">Insert variable...</option>
                                    {availableVariables.map((variable) => (
                                        <option key={variable.value} value={variable.value}>
                                            {variable.label}
                                        </option>
                                    ))}
                                </select>

                                {/* HTML file upload button */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    accept=".html"
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={triggerFileUpload}
                                    disabled={uploadLoading}
                                    className={`flex items-center p-1.5 text-sm rounded-md ${uploadLoading
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                        }`}
                                    title="Upload HTML File"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span className="ml-1.5">{uploadLoading ? 'Uploading...' : 'Upload HTML'}</span>
                                </button>

                                {/* HTML code mode toggle button */}
                                <button
                                    type="button"
                                    onClick={handleModeToggle}
                                    className={`flex items-center p-1.5 text-sm rounded-md ${isHtmlMode
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                    title={isHtmlMode ? "Switch to Rich Text Mode" : "Switch to HTML Code Mode"}
                                >
                                    <Code className="w-4 h-4" />
                                    <span className="ml-1.5">{isHtmlMode ? "Rich Text" : "HTML Code"}</span>
                                </button>

                                {/* Preview toggle button */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        // Sync content first
                                        if (!isHtmlMode && activeQuillInstance.current) {
                                            // Get content from rich text editor
                                            const newContent = activeQuillInstance.current.root.innerHTML;

                                            setEditorContent(newContent);
                                            setFormData(prev => ({
                                                ...prev,
                                                htmlContent: newContent
                                            }));
                                        }
                                        // Toggle preview mode
                                        setPreviewMode(!previewMode);
                                    }}
                                    className={`flex items-center p-1.5 text-sm rounded-md ${previewMode
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                    title={previewMode ? "Back to Edit Mode" : "Preview HTML"}
                                >
                                    <Eye className="w-4 h-4" />
                                    <span className="ml-1.5">{previewMode ? "Back to Edit" : "Preview"}</span>
                                </button>
                            </div>
                        </div>

                        <div className="border rounded-md">
                            {!isHtmlMode ? (
                                // Rich text editor mode
                                <QuillEditor
                                    theme="snow"
                                    value={editorContent}
                                    onChange={handleEditorChange}
                                    modules={DEFAULT_QUILL_MODULES}
                                    formats={EDITOR_FORMATS}
                                    placeholder="Edit your email HTML content here..."
                                    className="h-96"
                                    onEditorReady={handleEditorReady}
                                    id={`editor-${selectedTemplate?.id || 'new-template'}`}
                                />
                            ) : (
                                // HTML code edit mode
                                <textarea
                                    value={editorContent}
                                    onChange={(e) => handleEditorChange(e.target.value)}
                                    className="w-full h-96 p-3 font-mono text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 border-0 resize-none"
                                    placeholder="<!-- Edit your HTML code here -->"
                                    spellCheck="false"
                                    style={{
                                        lineHeight: '1.5',
                                        tabSize: 2,
                                    }}
                                />
                            )}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-500">
                                {isHtmlMode
                                    ? "You are in HTML code editing mode. Changes will be reflected in the rich text editor when you switch back."
                                    : "Content will be automatically synchronized when saved. You can use variables like {{email}} to dynamically replace content."
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render template details
    const renderTemplateDetails = () => {
        // If creating new template or editing, show edit form
        if (isEditing) {
            return renderEditForm();
        }

        // If no template selected and not in create new template mode, show toast
        if (!selectedTemplate) {
            return (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Please select a template from the list</p>
                </div>
            );
        }

        if (previewMode) {
            return (
                <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-medium">Preview Mode</h2>
                        <div className="flex gap-2">
                            <button
                                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                onClick={() => setPreviewMode(false)}
                            >
                                Back
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4">
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p><strong>Subject:</strong> {selectedTemplate.subject}</p>
                            <p><strong>From:</strong> {selectedTemplate.fromName} &lt;{selectedTemplate.fromEmail}&gt;</p>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <div className="p-1 bg-gray-100 border-b">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <div className="flex-1 text-center text-xs text-gray-500">Email Preview</div>
                                </div>
                            </div>
                            <div
                                className="p-4 ql-editor"
                                dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        // Normal view mode
        return (
            <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-medium">{selectedTemplate.name}</h2>
                    <div className="flex gap-2">
                        <button
                            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                            onClick={() => setIsEditing(true)}
                        >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                        </button>
                        <button
                            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                            onClick={() => setPreviewMode(true)}
                        >
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                        </button>
                        <button
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                            onClick={() => handleDeleteClick(selectedTemplate)}
                        >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Basic Information</h3>
                            <div className="space-y-2">
                                <p><strong>Template ID:</strong> {selectedTemplate.templateId}</p>
                                <p>
                                    <strong>Type:</strong> {templateTypeOptions.find(opt => opt.value === selectedTemplate.type)?.label || selectedTemplate.type}
                                </p>
                                <p>
                                    <strong>Status:</strong> {' '}
                                    {selectedTemplate.isActive ? (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Active</span>
                                    ) : (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">Inactive</span>
                                    )}
                                </p>
                                <p><strong>Created:</strong> {new Date(selectedTemplate.createdAt).toLocaleString()}</p>
                                <p><strong>Last Updated:</strong> {new Date(selectedTemplate.updatedAt).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Email Settings</h3>
                            <div className="space-y-2">
                                <p><strong>Subject:</strong> {selectedTemplate.subject}</p>
                                <p><strong>From:</strong> {selectedTemplate.fromName} &lt;{selectedTemplate.fromEmail}&gt;</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-500 mb-2">Email HTML Content Preview</h3>
                        <div className="border rounded-lg p-4 mt-2 bg-white max-h-96 overflow-auto">
                            <div className="ql-editor" dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Ensure editor instance resets when edit mode changes
    useEffect(() => {
        // Clean up editor instance when exiting edit mode
        if (!isEditing) {
            activeQuillInstance.current = null;
        }
    }, [isEditing]);

    // Clean up when component unmounts
    useEffect(() => {
        return () => {
            activeQuillInstance.current = null;
        };
    }, []);

    // Add editor global change event listener
    useEffect(() => {
        // Ensure editor instance exists and is in edit mode
        const quillInstance = activeQuillInstance.current;

        if (!quillInstance || !isEditing) return;

        // Listen for all editor change events
        quillInstance.on('editor-change', (eventName) => {
            if (eventName === 'text-change' && quillInstance) {
                const html = quillInstance.root.innerHTML;

                // Synchronously update status and form data
                setEditorContent(html);
                setFormData(prev => ({
                    ...prev,
                    htmlContent: html
                }));
            }
        });

        // Cleanup function
        return () => {
            quillInstance.off('editor-change');
        };
    }, [isEditing]); // Depend only on edit state — avoid frequent re-subscriptions caused by reference types

    // Addmode switch handler
    const handleModeToggle = () => {
        // If in rich text mode, sync content before switching to HTML mode
        if (!isHtmlMode && activeQuillInstance.current) {
            // Get latest rich text content
            const htmlContent = activeQuillInstance.current.root.innerHTML;

            setEditorContent(htmlContent);
            setFormData(prev => ({
                ...prev,
                htmlContent: htmlContent
            }));
        }

        // Toggle mode
        setIsHtmlMode(!isHtmlMode);
    };

    // Main rendering
    return (
        <div className="space-y-6 max-w-full">
            {/* Add inline styles */}
            <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Email Template Management</h1>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex flex-col lg:flex-row min-h-[600px]">
                    {/* Left template list */}
                    <div className="w-full lg:w-1/3 border-r border-gray-200">
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="font-medium">Template List</h2>
                            <button
                                className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
                                onClick={handleAddTemplate}
                            >
                                <PlusCircle className="w-4 h-4 mr-1" />
                                Add Template
                            </button>
                        </div>
                        {isLoading && !selectedTemplate ? (
                            <div className="p-6 text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
                                <p className="mt-2 text-gray-500">Loading...</p>
                            </div>
                        ) : (
                            renderTemplateList()
                        )}
                    </div>

                    {/* Right-side template details/edit */}
                    <div className="w-full lg:w-2/3 min-h-[600px]">
                        {isLoading && selectedTemplate ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                                <p className="ml-2 text-gray-500">Loading template content...</p>
                            </div>
                        ) : (
                            renderTemplateDetails()
                        )}
                    </div>
                </div>
            </div>

            {/* Delete confirmation dialog */}
            {isDeleteDialogOpen && templateToDelete && (
                <div className="fixed inset-0 z-50 overflow-auto bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
                        <div className="flex items-center mb-4 text-red-600">
                            <AlertCircle className="w-6 h-6 mr-2" />
                            <h3 className="text-lg font-medium">Confirm Delete</h3>
                        </div>

                        <p className="mb-4">
                            Are you sure you want to delete the template <strong>&ldquo;{templateToDelete.name}&rdquo;</strong>? This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-2">
                            <button
                                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                onClick={cancelDelete}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4 mr-1" />
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplatesPageContent; 