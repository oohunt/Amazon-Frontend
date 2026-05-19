import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Popover, PopoverTrigger, PopoverContent, Input, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Switch, Radio, RadioGroup } from '@heroui/react';
import type { Editor } from '@tiptap/core';
import type { RawCommands } from '@tiptap/react'; // Import RawCommands
import {
    Bold, Italic, Underline, Strikethrough, List, ListOrdered, Undo, Redo,
    Link as LinkIcon, Image as ImageIcon, Tag, Heading,
    AlignLeft, AlignCenter, AlignRight, Code, Quote,
    Trash2, Highlighter, Type, Palette,
    CornerDownLeft,
    Video as YoutubeIcon, // Use Video icon as replacement for deprecated Youtube icon
    Keyboard,
    Database,
    Upload,
    Mail,
    ArrowRight
} from 'lucide-react';
import { useState, useCallback, type MouseEvent } from 'react';

import type { ComponentProduct } from '@/types';

import { ColorPickerPopover } from './ColorPickerPopover';
import { ImageUploader } from './ImageUploader';
import type { ProductAttributes } from './ProductBlot'; // Import ProductAttributes
import type { ProductMetadataAttributes } from './ProductMetadataBlot';
import { ProductMetadataSelector } from './ProductMetadataSelector';
import ProductPickerModal from './ProductPickerModal';
import { type EmailFormAttributes } from './Template/email/EmailCollectionFormBlot';

// Interface for type assertion
interface ProductMetadataCommands {
    insertProductMetadata: (attributes: ProductMetadataAttributes) => boolean;
}

// Added: command interface for product card
interface ProductCardCommands {
    insertProduct: (attributes: ProductAttributes) => boolean;
}

// Added: command interface for email collection form
interface EmailFormCommands {
    insertEmailCollectionForm: (attributes: Partial<EmailFormAttributes>) => boolean;
}

interface TiptapToolbarProps {
    editor: Editor | null;
    onAddProduct: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

// Helper function to generate Kbd tags
const ShortcutKey = ({ children }: { children: React.ReactNode }) => (
    <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-md">
        {children}
    </kbd>
);

export function TiptapToolbar({ editor }: TiptapToolbarProps) {
    const [isTypographyModalOpen, setIsTypographyModalOpen] = useState(false);
    const [isYoutubePopoverOpen, setIsYoutubePopoverOpen] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [youtubeWidth, setYoutubeWidth] = useState('640');
    const [youtubeHeight, setYoutubeHeight] = useState('480');
    // Added: link and image Popover state
    const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkOpenInNewTab, setLinkOpenInNewTab] = useState(false);
    const [isImagePopoverOpen, setIsImagePopoverOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    // Added: keyboard shortcut modal state
    const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
    const [_selectedProduct, _setSelectedProduct] = useState<ComponentProduct | null>(null);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [showMetadataSelector, setShowMetadataSelector] = useState(false);
    const [pickerMode, setPickerMode] = useState<string | null>(null);
    const [productForMetadata, setProductForMetadata] = useState<ComponentProduct | null>(null);
    const [showImageUploader, setShowImageUploader] = useState(false);
    // Add: Email subscription form modal state
    const [isEmailFormModalOpen, setIsEmailFormModalOpen] = useState(false);
    const [emailFormTitle, setEmailFormTitle] = useState('Subscribe to Get Latest Updates');
    const [emailFormDescription, setEmailFormDescription] = useState('Enter your email address to get the latest product information and discount offers.');
    const [emailInputPlaceholder, setEmailInputPlaceholder] = useState('your.email@example.com');
    const [emailSubmitButtonText, setEmailSubmitButtonText] = useState('Subscribe');
    const [emailSourceType, setEmailSourceType] = useState<'general' | 'blog'>('general');
    const [emailFormStyle, setEmailFormStyle] = useState<'default' | 'compact' | 'blog' | 'deals'>('default');

    // Added: toggle keyboard shortcut modal
    const toggleShortcutModal = useCallback(() => {
        setIsShortcutModalOpen(!isShortcutModalOpen);
    }, [isShortcutModalOpen]);

    // Clear formatting
    const clearFormatting = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().clearNodes().unsetAllMarks().run();
    }, [editor]);

    // Apply typography rules
    const applyTypography = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsTypographyModalOpen(true);
    }, []);

    // Insert or cancel forced line break (hard break)
    const toggleHardBreak = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().setHardBreak().run();
    }, [editor]);

    // Modified: handleYoutubeAdd only opens Popover
    const handleYoutubeAdd = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!editor) return;
        // When opening Popover, don't clear URL so user can edit previous input
        setIsYoutubePopoverOpen(true);
    }, [editor]);

    // Updated: apply YouTube URL with width and height
    const applyYoutubeUrl = useCallback(() => {
        if (!editor) return;
        const urlToApply = youtubeUrl.trim();
        const parsedWidth = parseInt(youtubeWidth, 10);
        const parsedHeight = parseInt(youtubeHeight, 10);
        const finalWidth = (!isNaN(parsedWidth) && parsedWidth > 0) ? parsedWidth : 640;
        const finalHeight = (!isNaN(parsedHeight) && parsedHeight > 0) ? parsedHeight : 480;

        if (urlToApply) {
            try {
                new URL(urlToApply);
                if (urlToApply.includes('youtube.com') || urlToApply.includes('youtu.be')) {
                    editor.chain().focus().setYoutubeVideo({
                        src: urlToApply,
                        width: finalWidth,
                        height: finalHeight
                    }).run();
                    setIsYoutubePopoverOpen(false);
                    setYoutubeUrl('');
                    setYoutubeWidth('640');
                    setYoutubeHeight('480');
                } else {
                    alert('Please enter a valid YouTube or YouTube Music URL.');
                }
            } catch {
                alert('Invalid URL.');
            }
        } else {
            setIsYoutubePopoverOpen(false);
            setYoutubeUrl('');
            setYoutubeWidth('640');
            setYoutubeHeight('480');
        }
    }, [editor, youtubeUrl, youtubeWidth, youtubeHeight]);

    // Added: handle cancel operation, reset state
    const handleYoutubeCancel = useCallback(() => {
        setIsYoutubePopoverOpen(false);
        setYoutubeUrl('');
        setYoutubeWidth('640');
        setYoutubeHeight('480');
    }, []);

    // Apply link URL
    const applyLinkUrl = useCallback(() => {
        if (!editor) return;
        const urlToSet = linkUrl.trim();

        if (urlToSet === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            if (!/^https?:\/\//i.test(urlToSet)) {
                alert('Please enter a valid URL (starting with http:// or https://)');

                return;
            }
            editor.chain().focus().extendMarkRange('link').setLink({
                href: urlToSet,
                target: linkOpenInNewTab ? '_blank' : null
            }).run();
        }
        setIsLinkPopoverOpen(false);
        setLinkUrl('');
        setLinkOpenInNewTab(false);
    }, [editor, linkUrl, linkOpenInNewTab]);

    // Remove link
    const handleLinkRemove = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        setIsLinkPopoverOpen(false);
        setLinkUrl('');
        setLinkOpenInNewTab(false);
    }, [editor]);

    // Apply image URL
    const applyImageUrl = useCallback(() => {
        if (!editor) return;
        const urlToApply = imageUrl.trim();

        if (urlToApply) {
            // Optional: add stricter URL validation
            try {
                new URL(urlToApply); // Basic validation
                editor.chain().focus().setImage({ src: urlToApply }).run();
                setIsImagePopoverOpen(false);
                setImageUrl(''); // Clear after success
            } catch {
                alert('Invalid image URL.');
            }
        } else {
            // If URL is empty, close or prompt user to enter
            setIsImagePopoverOpen(false);
        }
    }, [editor, imageUrl]);

    // Cancel image insertion
    const handleImageCancel = useCallback(() => {
        setIsImagePopoverOpen(false);
        setImageUrl(''); // Clear on cancel
    }, []);

    // Handle local image upload
    const handleLocalImageUpload = useCallback((url: string) => {
        if (!editor) return;
        editor.chain().focus().setImage({ src: url }).run();
    }, [editor]);

    // Added: handle product selection returned from ProductPickerModal
    const handleProductPicked = useCallback((product: ComponentProduct) => {
        if (!editor) return;

        if (pickerMode === 'product') {
            // Insert product card
            const attributes: ProductAttributes = {
                id: product.id || product.asin || '',
                title: product.title || 'Unnamed Product',
                price: product.price || 0,
                image: product.image || '/placeholder-product.jpg',
                asin: product.asin || '',
                style: 'card', // Default style, or get from elsewhere
                alignment: 'left', // Default alignment
                url: product.url || '',
                cj_url: product.cj_url || '',
                brand: product.brand ?? null,
                originalPrice: product.originalPrice ?? null,
                discount: product.discount ?? null,
                couponType: product.couponType as ProductAttributes['couponType'] ?? null,
                couponValue: product.couponValue ?? null,
                couponExpirationDate: product.couponExpirationDate ?? null,
                isPrime: product.isPrime ?? null,
                isFreeShipping: product.isFreeShipping ?? null,
                category: product.category || ''
            };

            try {
                // Ensure editor.commands.insertProduct exists
                // Assert editor command type
                const commands = editor.commands as unknown as Partial<RawCommands & ProductCardCommands>;

                if (commands.insertProduct) {
                    commands.insertProduct(attributes);
                } else {
                    alert('Error inserting product card: command not found.');
                }
            } catch {
                alert('Error inserting product card.');
            }
        } else if (pickerMode === 'metadata') {
            // Prepare to insert metadata
            setProductForMetadata(product);
            setShowMetadataSelector(true);
        }

        // Reset mode and close picker
        setPickerMode(null);
        setShowProductPicker(false);
    }, [editor, pickerMode]);

    // Handle metadata selection - rewritten
    const handleMetadataSelect = useCallback((fieldId: string) => {
        // Use productForMetadata
        if (!editor || !productForMetadata) return;

        try {
            const attributes: ProductMetadataAttributes = {
                productId: productForMetadata.id || productForMetadata.asin || '',
                fieldId,
                // value field is fetched internally by ProductMetadataBlot/View, no need to pass here
            };
            // Try calling commands directly in the actual editor
            // Assert to access custom commands
            const commands = editor.commands as unknown as Partial<RawCommands & ProductMetadataCommands>;

            if (commands.insertProductMetadata) {
                // Use direct method when plugin is correctly registered
                commands.insertProductMetadata(attributes);
            } else {
                // Fall back to chain call (if command is not properly extended)
                editor.chain().focus().insertContent({
                    type: 'productMetadata',
                    attrs: attributes
                }).run();
            }

        } catch {
            alert('Error inserting metadata, please try again later');
        } finally {
            // Close picker and reset state regardless of success or failure
            setShowMetadataSelector(false);
            setProductForMetadata(null); // Reset associated product
        }
    }, [editor, productForMetadata]); // Depends on productForMetadata

    // Handle add product click
    const handleAddProductClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setPickerMode('product');
        setShowProductPicker(true);
    }, []);

    // Handle add metadata click
    const handleAddMetadataClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setPickerMode('metadata');
        setShowProductPicker(true);
    }, []);

    // Handle product style change
    const _handleProductStyleChange = useCallback((style: string) => {
        if (editor && editor.isActive('product')) {
            editor.chain().focus().updateAttributes('product', { style }).run();
        }
    }, [editor]);

    // Added: open email form modal
    const handleEmailFormClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Reset form fields to default values
        setEmailFormTitle('Subscribe to Get Latest Updates');
        setEmailFormDescription('Enter your email address to get the latest product information and discount offers.');
        setEmailInputPlaceholder('your.email@example.com');
        setEmailSubmitButtonText('Subscribe');
        setEmailSourceType('general');
        setEmailFormStyle('default');
        // Open modal
        setIsEmailFormModalOpen(true);
    }, []);

    // Added: insert email collection form
    const insertEmailForm = useCallback(() => {
        if (!editor) return;

        try {
            // Build form attributes
            const attributes: Partial<EmailFormAttributes> = {
                formTitle: emailFormTitle,
                formDescription: emailFormDescription,
                inputPlaceholder: emailInputPlaceholder,
                submitButtonText: emailSubmitButtonText,
                sourceType: emailSourceType,
                formId: `form-${Date.now()}`, // Generate unique ID
                style: emailFormStyle
            };

            // Try using plugin command
            const commands = editor.commands as unknown as Partial<RawCommands & EmailFormCommands>;

            if (commands.insertEmailCollectionForm) {
                commands.insertEmailCollectionForm(attributes);
            } else {
                // Fall back to generic insert content method
                editor.chain().focus().insertContent({
                    type: 'emailCollectionForm',
                    attrs: attributes
                }).run();
            }

            // Close modal
            setIsEmailFormModalOpen(false);
        } catch {
            alert('Error inserting email collection form, please try again later');
        }
    }, [editor, emailFormTitle, emailFormDescription, emailInputPlaceholder, emailSubmitButtonText, emailSourceType, emailFormStyle]);

    if (!editor) {
        return null;
    }

    // Keyboard shortcut data (compiled based on enabled extensions and Tiptap documentation)
    // Note: Mod = Cmd (macOS) / Ctrl (Windows/Linux)
    const shortcuts = [
        {
            category: 'Basic Operations', items: [
                { action: 'Undo', win: 'Ctrl + Z', mac: 'Cmd + Z' },
                { action: 'Redo', win: 'Ctrl + Shift + Z', mac: 'Cmd + Shift + Z' },
                { action: 'Hard Break', win: 'Shift + Enter or Ctrl + Enter', mac: 'Shift + Enter or Cmd + Enter' },
                { action: 'Copy', win: 'Ctrl + C', mac: 'Cmd + C' },
                { action: 'Cut', win: 'Ctrl + X', mac: 'Cmd + X' },
                { action: 'Paste', win: 'Ctrl + V', mac: 'Cmd + V' },
                { action: 'Paste Without Formatting', win: 'Ctrl + Shift + V', mac: 'Cmd + Shift + V' },
            ]
        },
        {
            category: 'Text Formatting', items: [
                { action: 'Bold', win: 'Ctrl + B', mac: 'Cmd + B' },
                { action: 'Italic', win: 'Ctrl + I', mac: 'Cmd + I' },
                { action: 'Underline', win: 'Ctrl + U', mac: 'Cmd + U' },
                { action: 'Strikethrough', win: 'Ctrl + Shift + S', mac: 'Cmd + Shift + S' },
                { action: 'Code', win: 'Ctrl + E', mac: 'Cmd + E' },
                { action: 'Highlight', win: 'Ctrl + Shift + H', mac: 'Cmd + Shift + H' },
            ]
        },
        {
            category: 'Paragraph Formatting', items: [
                { action: 'Normal Text', win: 'Ctrl + Alt + 0', mac: 'Cmd + Alt + 0' },
                { action: 'Heading 1', win: 'Ctrl + Alt + 1', mac: 'Cmd + Alt + 1' },
                { action: 'Heading 2', win: 'Ctrl + Alt + 2', mac: 'Cmd + Alt + 2' },
                { action: 'Heading 3', win: 'Ctrl + Alt + 3', mac: 'Cmd + Alt + 3' },
                { action: 'Bullet List', win: 'Ctrl + Shift + 8', mac: 'Cmd + Shift + 8' },
                { action: 'Ordered List', win: 'Ctrl + Shift + 7', mac: 'Cmd + Shift + 7' },
                { action: 'Quote', win: 'Ctrl + Shift + B', mac: 'Cmd + Shift + B' },
                { action: 'Code Block', win: 'Ctrl + Alt + C', mac: 'Cmd + Alt + C' },
                { action: 'Align Left', win: 'Ctrl + Shift + L', mac: 'Cmd + Shift + L' },
                { action: 'Center', win: 'Ctrl + Shift + E', mac: 'Cmd + Shift + E' },
                { action: 'Align Right', win: 'Ctrl + Shift + R', mac: 'Cmd + Shift + R' },
            ]
        },
    ];

    // Detect operating system (simple method, may not be fully accurate)
    const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

    return (
        <div className="flex items-center flex-wrap gap-1 bg-white w-full">
            {/* Undo/Redo */}
            <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
                disabled={!editor.can().undo()}
            >
                <Undo size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo (Ctrl+Shift+Z)"
                disabled={!editor.can().redo()}
            >
                <Redo size={16} />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1" /> {/* Separator */}

            {/* Text formatting */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
                title="Bold (Ctrl+B)"
            >
                <Bold size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
                title="Italic (Ctrl+I)"
            >
                <Italic size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
                title="Underline (Ctrl+U)"
            >
                <Underline size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('strike') ? 'bg-gray-200' : ''}`}
                title="Strikethrough (Ctrl+Shift+S)"
            >
                <Strikethrough size={16} />
            </button>

            {/* Highlight color picker Popover */}
            <ColorPickerPopover
                editor={editor}
                mode="highlight"
                trigger={
                    <button
                        type="button"
                        className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('highlight') ? 'bg-blue-100 text-blue-600' : ''}`}
                        title="Highlight (Ctrl+Shift+H)"
                    >
                        <Highlighter size={16} />
                    </button>
                }
            />

            {/* Text color picker Popover */}
            <ColorPickerPopover
                editor={editor}
                mode="textColor"
                trigger={
                    <button
                        type="button"
                        className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('textStyle') ? 'bg-blue-100 text-blue-600' : ''}`}
                        title="Text Color"
                    >
                        <Palette size={16} />
                    </button>
                }
            />

            <button
                type="button"
                onClick={clearFormatting}
                className="p-1.5 rounded hover:bg-gray-100"
                title="Clear Formatting"
            >
                <Trash2 size={16} />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1" /> {/* Separator */}

            {/* Heading - changed to dropdown */}
            <Dropdown>
                <DropdownTrigger>
                    <Button
                        variant="light" // Or other preferred style
                        className="p-1.5 rounded hover:bg-gray-100 data-[hover=true]:bg-gray-100 min-w-0 h-auto" // Adjust style to fit button
                        title="Heading Level"
                    >
                        {/* Can show different content based on current level, or keep generic icon */}
                        <Heading size={16} />
                    </Button>
                </DropdownTrigger>
                <DropdownMenu
                    aria-label="Heading Levels"
                    onAction={(key) => {
                        const level = Number(String(key).split('-')[1]);

                        if (level === 0) {
                            editor.chain().focus().setParagraph().run();
                        } else if (level >= 1 && level <= 3) {
                            editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
                        }
                    }}
                    selectedKeys={editor.isActive('heading', { level: 1 }) ? ['h-1'] : editor.isActive('heading', { level: 2 }) ? ['h-2'] : editor.isActive('heading', { level: 3 }) ? ['h-3'] : ['h-0']} // Highlight current level
                    selectionMode="single"
                >
                    <DropdownItem key="h-0">Normal Text</DropdownItem>
                    <DropdownItem key="h-1">Heading 1</DropdownItem>
                    <DropdownItem key="h-2">Heading 2</DropdownItem>
                    <DropdownItem key="h-3">Heading 3</DropdownItem>
                </DropdownMenu>
            </Dropdown>

            <button
                type="button"
                onClick={applyTypography}
                className="p-1.5 rounded hover:bg-gray-100"
                title="Smart Typography (auto-converts special symbols)"
            >
                <Type size={16} />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1" /> {/* Separator */}

            {/* Text alignment */}
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}`}
                title="Align Left (Ctrl+Shift+L)"
            >
                <AlignLeft size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}`}
                title="Center (Ctrl+Shift+E)"
            >
                <AlignCenter size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}`}
                title="Align Right (Ctrl+Shift+R)"
            >
                <AlignRight size={16} />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1" /> {/* Separator */}

            {/* Lists */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                title="Bullet List (Ctrl+Shift+8)"
            >
                <List size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                title="Ordered List (Ctrl+Shift+7)"
            >
                <ListOrdered size={16} />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1" /> {/* Separator */}

            {/* Blockquote and code block */}
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
                title="Quote (Ctrl+Shift+B)"
            >
                <Quote size={16} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('codeBlock') ? 'bg-gray-200' : ''}`}
                title="Code Block (Ctrl+Alt+C)"
            >
                <Code size={16} />
            </button>
            <button
                type="button"
                onClick={toggleHardBreak}
                className="p-1.5 rounded hover:bg-gray-100"
                title="Hard Break (Shift+Enter)"
            >
                <CornerDownLeft size={16} />
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1" /> {/* Separator */}

            {/* Link, image, product, YouTube */}
            {/* Link Popover */}
            <Popover placement="bottom" isOpen={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
                <PopoverTrigger>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const attrs = editor?.getAttributes('link');
                            const currentUrl = attrs?.href || '';
                            const currentTarget = attrs?.target;

                            setLinkUrl(currentUrl);
                            setLinkOpenInNewTab(currentTarget === '_blank');
                            setIsLinkPopoverOpen(true);
                        }}
                        className={`p-1.5 rounded hover:bg-gray-100 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
                        title="Add/Edit Link"
                    >
                        <LinkIcon size={16} />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="p-3 w-72">
                    <div className="space-y-3">
                        <label htmlFor="toolbar-link-url-input" className="block text-sm font-medium text-gray-700 mb-1">
                            Link URL
                        </label>
                        <Input
                            id="toolbar-link-url-input"
                            placeholder="https://example.com"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            type="url"
                            size="sm"
                        />
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                            <label htmlFor="toolbar-link-new-tab" className="text-sm text-gray-600 select-none">
                                Open in new tab
                            </label>
                            <Switch
                                id="toolbar-link-new-tab"
                                isSelected={linkOpenInNewTab}
                                onValueChange={setLinkOpenInNewTab}
                                size="sm"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button size="sm" variant="bordered" onPress={handleLinkRemove}>
                                Remove
                            </Button>
                            <Button size="sm" color="primary" onPress={applyLinkUrl}>
                                Apply
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Image Popover */}
            <Popover placement="bottom" isOpen={isImagePopoverOpen} onOpenChange={setIsImagePopoverOpen}>
                <PopoverTrigger>
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setImageUrl('');
                            setIsImagePopoverOpen(true);
                        }}
                        className="p-1.5 rounded hover:bg-gray-100"
                        title="Insert Image"
                    >
                        <ImageIcon size={16} />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="p-3 w-72">
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                setIsImagePopoverOpen(false);
                                setShowImageUploader(true);
                            }}
                            className="w-full py-2 px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
                            type="button"
                        >
                            <Upload size={16} className="mr-2" /> Upload Local Image
                        </button>

                        <div className="relative flex items-center">
                            <div className="flex-grow border-t border-gray-300" />
                            <span className="mx-2 text-xs text-gray-500">Or add through URL</span>
                            <div className="flex-grow border-t border-gray-300" />
                        </div>

                        <div>
                            <label htmlFor="image-url-input" className="block text-sm font-medium text-gray-700 mb-1">
                                Image URL
                            </label>
                            <Input
                                id="image-url-input"
                                placeholder="https://example.com/image.jpg"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                type="url"
                                size="sm"
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button size="sm" variant="bordered" onPress={handleImageCancel}>
                                Cancel
                            </Button>
                            <Button size="sm" color="primary" onPress={applyImageUrl}>
                                Apply
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            {/* YouTube Popover */}
            <Popover placement="bottom" isOpen={isYoutubePopoverOpen} onOpenChange={setIsYoutubePopoverOpen}>
                <PopoverTrigger>
                    <button
                        type="button"
                        onClick={handleYoutubeAdd}
                        className="p-1.5 rounded hover:bg-gray-100"
                        title="Insert YouTube Video"
                    >
                        <YoutubeIcon size={16} />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="p-3 w-72">
                    <div className="space-y-3">
                        <label htmlFor="youtube-url-input" className="block text-sm font-medium text-gray-700 mb-1">
                            YouTube URL
                        </label>
                        <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            type="url"
                            size="sm"
                            id="youtube-url-input"
                            className=""
                        />
                        <div className="flex gap-3 mb-3">
                            <div className="flex-1">
                                <label htmlFor="youtube-width-input" className="block text-sm font-medium text-gray-700 mb-1">Width (px)</label>
                                <Input
                                    placeholder="640"
                                    value={youtubeWidth}
                                    onChange={(e) => setYoutubeWidth(e.target.value)}
                                    type="number"
                                    min="1"
                                    size="sm"
                                    id="youtube-width-input"
                                    className=""
                                />
                            </div>
                            <div className="flex-1">
                                <label htmlFor="youtube-height-input" className="block text-sm font-medium text-gray-700 mb-1">Height (px)</label>
                                <Input
                                    placeholder="480"
                                    value={youtubeHeight}
                                    onChange={(e) => setYoutubeHeight(e.target.value)}
                                    type="number"
                                    min="1"
                                    size="sm"
                                    id="youtube-height-input"
                                    className=""
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-4">
                            <Button size="sm" variant="bordered" onPress={handleYoutubeCancel}>
                                Cancel
                            </Button>
                            <Button size="sm" color="primary" onPress={applyYoutubeUrl}>
                                Apply
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            <button
                type="button"
                onClick={handleAddProductClick}
                className="p-1.5 rounded hover:bg-gray-100"
                title="Add Product"
            >
                <Tag size={16} />
            </button>
            <button
                type="button"
                onClick={handleAddMetadataClick}
                className="p-1.5 rounded hover:bg-gray-100"
                title="Insert Product Metadata"
            >
                <Database size={16} />
            </button>

            {/* Added: email collection form button */}
            <button
                type="button"
                onClick={handleEmailFormClick}
                className="p-1.5 rounded hover:bg-gray-100"
                title="Insert Email Subscription Form"
            >
                <Mail size={16} />
            </button>

            {/* Added: keyboard shortcut help button */}
            <button
                type="button"
                onClick={toggleShortcutModal}
                className="p-1.5 rounded hover:bg-gray-100 ml-auto" /* Use ml-auto to push to right */
                title="View Keyboard Shortcuts"
            >
                <Keyboard size={16} />
            </button>

            {/* Typography Explanation Modal */}
            <Modal isOpen={isTypographyModalOpen} onOpenChange={setIsTypographyModalOpen}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Smart Typography Rules</ModalHeader>
                            <ModalBody>
                                <p>When typing the following characters, they are automatically converted to typographically correct symbols:</p>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                    <li><code className="bg-gray-100 px-1 rounded">--</code> → — (em dash)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">...</code> → … (ellipsis)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">&lt;-</code> → ← (left arrow)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">-&gt;</code> → → (right arrow)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">(c)</code> → © (copyright)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">(r)</code> → ® (registered trademark)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">(tm)</code> → ™ (trademark)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">1/2</code> → ½ (one half)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">1/4</code> → ¼ (one quarter)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">3/4</code> → ¾ (three quarters)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">+/-</code> → ± (plus-minus)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">!=</code> → ≠ (not equal)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">&lt;&lt;</code> → « (left quotation)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">&gt;&gt;</code> → » (right quotation)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">2*3</code> or <code className="bg-gray-100 px-1 rounded">2x3</code> → 2×3 (multiplication)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">^2</code> → ² (superscript 2)</li>
                                    <li><code className="bg-gray-100 px-1 rounded">^3</code> → ³ (superscript 3)</li>
                                    <li>Smart quotes (&apos;, &quot;)</li>
                                </ul>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" onPress={onClose}>
                                    Close
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Added: keyboard shortcut help modal */}
            <Modal isOpen={isShortcutModalOpen} onOpenChange={setIsShortcutModalOpen} size="2xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex items-center gap-2">
                                <Keyboard size={18} /> Keyboard Shortcuts
                            </ModalHeader>
                            <ModalBody className="max-h-[70vh] overflow-y-auto">
                                <div className="space-y-4">
                                    {shortcuts.map((group) => (
                                        <div key={group.category}>
                                            <h4 className="text-sm font-semibold mb-2 text-gray-600">{group.category}</h4>
                                            <table className="w-full text-sm border-collapse">
                                                <tbody>
                                                    {group.items.map((item) => (
                                                        <tr key={item.action} className="border-b border-gray-100">
                                                            <td className="py-2 pr-4 text-gray-700">{item.action}</td>
                                                            <td className="py-2 pl-4 text-right">
                                                                <div className="flex justify-end items-center gap-1">
                                                                    {(isMac ? item.mac : item.win).split(' or ').map((combo, idx, arr) => (
                                                                        <span key={combo} className="flex items-center gap-1">
                                                                            {combo.split(' + ').map(key => <ShortcutKey key={key}>{key}</ShortcutKey>)}
                                                                            {idx < arr.length - 1 && <span className="text-gray-400 mx-1">or</span>}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ))}
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" onPress={onClose}>
                                    Close
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Product picker */}
            <ProductPickerModal
                isOpen={showProductPicker}
                onClose={() => setShowProductPicker(false)}
                onProductSelect={handleProductPicked}
            />

            {/* Metadata selector - improved logic */}
            <ProductMetadataSelector
                isOpen={showMetadataSelector}
                onClose={() => {
                    setShowMetadataSelector(false);
                    // Don't reset productForMetadata on close, handleMetadataSelect will handle it
                }}
                product={productForMetadata}
                onSelect={handleMetadataSelect}
            />

            {/* Image upload modal */}
            <ImageUploader
                isOpen={showImageUploader}
                onClose={() => setShowImageUploader(false)}
                onImageUpload={handleLocalImageUpload}
            />

            {/* Added: email collection form modal */}
            <Modal isOpen={isEmailFormModalOpen} onOpenChange={setIsEmailFormModalOpen}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Mail size={18} />
                                    Insert Email Subscription Form
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="email-form-title" className="block text-sm font-medium text-gray-700 mb-1">
                                            Form Title
                                        </label>
                                        <Input
                                            id="email-form-title"
                                            value={emailFormTitle}
                                            onChange={(e) => setEmailFormTitle(e.target.value)}
                                            placeholder="Subscription Newsletter"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email-form-description" className="block text-sm font-medium text-gray-700 mb-1">
                                            Form Description
                                        </label>
                                        <Input
                                            id="email-form-description"
                                            value={emailFormDescription}
                                            onChange={(e) => setEmailFormDescription(e.target.value)}
                                            placeholder="Enter your email to get the latest news"
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label htmlFor="email-input-placeholder" className="block text-sm font-medium text-gray-700 mb-1">
                                                Input Placeholder
                                            </label>
                                            <Input
                                                id="email-input-placeholder"
                                                value={emailInputPlaceholder}
                                                onChange={(e) => setEmailInputPlaceholder(e.target.value)}
                                                placeholder="your.email@example.com"
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <label htmlFor="email-submit-button" className="block text-sm font-medium text-gray-700 mb-1">
                                                Submit Button Text
                                            </label>
                                            <Input
                                                id="email-submit-button"
                                                value={emailSubmitButtonText}
                                                onChange={(e) => setEmailSubmitButtonText(e.target.value)}
                                                placeholder="Subscribe"
                                            />
                                        </div>
                                    </div>

                                    {/* Advanced settings - hidden in collapsible panel */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <details className="text-sm">
                                            <summary className="cursor-pointer text-gray-700 font-medium">Advanced Settings</summary>
                                            <div className="mt-3 pl-4 border-l-2 border-gray-200">
                                                <div className="mb-3">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Form Style
                                                    </label>
                                                    <RadioGroup
                                                        value={emailFormStyle}
                                                        onValueChange={(value) => setEmailFormStyle(value as 'default' | 'compact' | 'blog' | 'deals')}
                                                        orientation="horizontal"
                                                    >
                                                        <Radio value="default">
                                                            <div className="ml-2">Default (Blue gradient)</div>
                                                        </Radio>
                                                        <Radio value="compact">
                                                            <div className="ml-2">Compact (White)</div>
                                                        </Radio>
                                                        <Radio value="blog">
                                                            <div className="ml-2">Blog Style (Blue)</div>
                                                        </Radio>
                                                        <Radio value="deals">
                                                            <div className="ml-2">Deals Newsletter</div>
                                                        </Radio>
                                                    </RadioGroup>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Form Source Type (Only for backend identification)
                                                    </label>
                                                    <RadioGroup
                                                        value={emailSourceType}
                                                        onValueChange={(value) => setEmailSourceType(value as 'general' | 'blog')}
                                                        orientation="horizontal"
                                                    >
                                                        <Radio value="general">
                                                            <div className="ml-2">General Product Email</div>
                                                        </Radio>
                                                        <Radio value="blog">
                                                            <div className="ml-2">Blog Content Email</div>
                                                        </Radio>
                                                    </RadioGroup>
                                                </div>
                                            </div>
                                        </details>
                                    </div>

                                    {/* Form preview */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Form Preview:</p>
                                        <div className={`border border-gray-200 rounded-md p-4 ${emailFormStyle === 'default' ? 'bg-gradient-to-br from-[#1A5276] to-[#154360] text-white' :
                                            emailFormStyle === 'compact' ? 'bg-white text-gray-800' :
                                                emailFormStyle === 'blog' ? 'bg-gradient-to-r from-[#3282B7] to-[#1C567B] text-white' :
                                                    'bg-[#2E71A6] text-white'
                                            }`}>
                                            <div className="text-center mb-2">
                                                {emailFormStyle === 'default' && (
                                                    <div className="inline-flex items-center justify-center mb-1">
                                                        <Mail className="w-5 h-5 text-[#FFC107] mr-1.5" strokeWidth={1.5} />
                                                        <h3 className="text-lg font-semibold text-[#FFFFFF]">{emailFormTitle || 'Subscription Newsletter'}</h3>
                                                    </div>
                                                )}
                                                {emailFormStyle === 'compact' && (
                                                    <h3 className="text-lg font-medium">{emailFormTitle || 'Subscription Newsletter'}</h3>
                                                )}
                                                {emailFormStyle === 'blog' && (
                                                    <div className="inline-flex items-center justify-center mb-1">
                                                        <Mail className="w-5 h-5 text-[#FFC107] mr-1.5" strokeWidth={1.5} />
                                                        <h3 className="text-lg font-semibold text-[#FFFFFF]">{emailFormTitle || 'Subscription Newsletter'}</h3>
                                                    </div>
                                                )}
                                                {emailFormStyle === 'deals' && (
                                                    <h3 className="text-lg font-bold text-[#FFFFFF]">{emailFormTitle || 'Subscribe to Our Deals Newsletter'}</h3>
                                                )}
                                                <p className={`${emailFormStyle === 'default' ? 'text-white/90' :
                                                    emailFormStyle === 'compact' ? 'text-gray-600' :
                                                        'text-white/90'
                                                    } text-sm`}>
                                                    {emailFormStyle === 'deals' ?
                                                        (emailFormDescription || "Get the latest deals first-hand, don't miss any money-saving opportunity") :
                                                        (emailFormDescription || 'Enter your email address to get the latest product information and discount offers.')
                                                    }
                                                </p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                <div className={`flex-grow ${emailFormStyle === 'default' ? 'bg-white' :
                                                    emailFormStyle === 'compact' ? 'bg-gray-50' :
                                                        'bg-white'
                                                    } border ${emailFormStyle === 'default' ? 'border-transparent' :
                                                        emailFormStyle === 'compact' ? 'border-gray-300' :
                                                            'border-transparent'
                                                    } rounded-md px-3 py-2 text-sm text-gray-400`}>
                                                    <span className="flex items-center gap-2">
                                                        {(emailFormStyle !== 'deals') && <Mail size={14} />}
                                                        {emailInputPlaceholder || 'your.email@example.com'}
                                                    </span>
                                                </div>
                                                <div className={`px-3 py-2 ${emailFormStyle === 'default' ? 'bg-[#16A085]' :
                                                    emailFormStyle === 'compact' ? 'bg-blue-600' :
                                                        emailFormStyle === 'blog' ? 'bg-[#16A085]' :
                                                            'bg-[#4DB6AC]'
                                                    } text-white text-sm font-medium rounded-md flex items-center justify-center`}>
                                                    <span>{emailSubmitButtonText || 'Subscribe'}</span>
                                                    {(emailFormStyle === 'default' || emailFormStyle === 'blog') &&
                                                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                                    }
                                                </div>
                                            </div>
                                            {emailFormStyle === 'deals' && (
                                                <div className="mt-2 flex items-start gap-2 text-xs text-white/90">
                                                    <input type="checkbox" className="mt-0.5 h-3 w-3" checked readOnly />
                                                    <span>I agree to receive email communications from Oohunt as described in the
                                                        <a href="#" className="text-[#4DB6AC] hover:underline ml-1">Terms</a> &
                                                        <a href="#" className="text-[#4DB6AC] hover:underline ml-1">Privacy Policy</a></span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="default" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="primary" onPress={insertEmailForm}>
                                    Insert Form
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}