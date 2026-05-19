'use client';

import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    Input,
    Button,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter
} from '@heroui/react';
import { type Editor as EditorType } from '@tiptap/core';
import CharacterCount from '@tiptap/extension-character-count';
import Color from '@tiptap/extension-color';
import Dropcursor from '@tiptap/extension-dropcursor';
import Focus from '@tiptap/extension-focus';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import ListKeymap from '@tiptap/extension-list-keymap';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Typography from '@tiptap/extension-typography';
import Underline from '@tiptap/extension-underline';
import Youtube from '@tiptap/extension-youtube';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu, isNodeSelection } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold, Italic, List, ListOrdered,
    Link as LinkIcon, Image as ImageIcon, Heading1, Heading2,
    Strikethrough, Code, Quote, Highlighter, Palette, Minus
} from 'lucide-react';
import { useState, useEffect, useCallback, type MouseEvent } from 'react';

import { ColorPickerPopover } from './ColorPickerPopover';
import { ProductBlot, type ProductAttributes, PRODUCT_STYLES } from './ProductBlot';
import { ProductMetadataBlot } from './ProductMetadataBlot';
import { ProductSelector, type Product } from './ProductSelector';
import { EmailCollectionFormBlot } from './Template/email/EmailCollectionFormBlot';
import { TiptapToolbar } from './TiptapToolbar';

// Product command type definition
interface ProductCommands {
    insertProduct: (attributes: ProductAttributes) => boolean;
}

// Default character limit
const DEFAULT_CHAR_LIMIT = 10000;

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    editorClass?: string;
    onEditorReady?: (editor: EditorType) => void;
    charLimit?: number; // Add character limit attribute
}

export function RichTextEditor({
    value,
    onChange,
    placeholder = 'Enter content here...',
    className = '',
    editorClass = '',
    onEditorReady,
    charLimit = DEFAULT_CHAR_LIMIT // Default 10000
}: RichTextEditorProps) {
    const [showProductSelector, setShowProductSelector] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [charactersCount, setCharactersCount] = useState(0);
    const [wordsCount, setWordsCount] = useState(0);
    const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showProductPicker] = useState(false);
    const [showMetadataSelector] = useState(false);
    const [showFloatingImageInput, setShowFloatingImageInput] = useState(false);

    // Client-side render detection
    useEffect(() => {
        setIsClient(true);

        // Add global styles to fix bubble menu width issue
        const style = document.createElement('style');

        style.innerHTML = `
            .tippy-box {
                width: auto !important;
                max-width: none !important;
            }
            .tippy-content {
                width: auto !important;
                max-width: none !important;
                white-space: nowrap !important;
            }
            
            /* Ensure modal is above editor floating menu */
            .modal-backdrop, .modal-content {
                z-index: 9999 !important; /* Use higher z-index value */
            }
            
            /* CSS selector targeting HeroUI Modal component */
            [data-overlay-container] [role="dialog"],
            [aria-labelledby="modal-title"] {
                z-index: 9999 !important;
            }
            [data-overlay-container] [data-backdrop],
            [data-backdrop] {
                z-index: 9998 !important;
            }
            div[role="presentation"][data-overlay] {
                z-index: 9999 !important;
            }
            /* Fix modal overlay issue */
            div[data-overlay-container="true"] {
                isolation: isolate;
            }
            
            /* New: CSS class to hide FloatingMenu */
            .floating-menu-hidden {
                opacity: 0 !important;
                visibility: hidden !important;
                pointer-events: none !important;
                transition: none !important; /* Ensure immediate hiding */
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // initialize editor
    const editor = useEditor({
        extensions: [
            // Load TextStyle and Color extensions first to ensure they initialize before other extensions
            // Text style extension — for colors etc.
            TextStyle,
            // Color extension
            Color.configure({
                types: ['textStyle'],
            }),
            // Then load other extensions
            StarterKit.configure({
                // Configure StarterKit options
                heading: false, // Disable heading extension bundled with StarterKit
                codeBlock: {
                    HTMLAttributes: {
                        class: 'bg-gray-100 rounded p-2 font-mono text-sm',
                    },
                },
                blockquote: {
                    HTMLAttributes: {
                        class: 'border-l-4 border-gray-300 pl-4 italic',
                    },
                },
                dropcursor: false
            }),
            // Configure Heading extension separately to support six heading levels
            Heading.configure({
                levels: [1, 2, 3, 4, 5, 6],
            }),
            Placeholder.configure({
                placeholder,
                emptyEditorClass: 'is-editor-empty',
            }),
            Image.configure({
                inline: true,
                allowBase64: false,
                HTMLAttributes: {
                    class: 'mx-auto rounded max-w-full',
                },
            }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                validate: href => /^https?:\/\//i.test(href),
                HTMLAttributes: {
                    class: 'text-blue-500 underline',
                    rel: 'noopener noreferrer',
                    target: '_blank',
                },
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
                alignments: ['left', 'center', 'right'],
                defaultAlignment: 'left',
            }),
            // Highlight plugin
            Highlight.configure({
                multicolor: true,
                HTMLAttributes: {
                    class: 'bg-yellow-200 px-1 rounded',
                },
            }),
            // Typography plugin
            Typography,
            Underline,
            ProductBlot,
            ProductMetadataBlot,
            EmailCollectionFormBlot,
            // Character count extension
            CharacterCount.configure({
                limit: charLimit, // Set character limit
                // Use more accurate word segmentation to count Chinese words
                wordCounter: (text) => {
                    // calculate after removing whitespace using Chinese/English word segmentation rules
                    const trimmedText = text.trim();

                    if (!trimmedText) return 0;

                    // Simple word segmentation for Chinese/English mixed text
                    // 1. English words separated by spaces
                    // 2. Each Chinese character is treated as part of a word
                    // 3. Split at Chinese-English boundaries

                    // Split text by spaces and process each part
                    const parts = trimmedText.split(/\s+/);
                    let wordCount = 0;

                    for (const part of parts) {
                        if (!part) continue;

                        // Check if it contains Chinese characters
                        const hasChinese = /[\u4e00-\u9fff]/.test(part);

                        if (hasChinese) {
                            // Chinese word segmentation: consecutive Chinese characters treated as one word
                            // Simple method: split at Chinese/English boundaries
                            const segments = part.split(/(?:(?<=[\u4e00-\u9fff])(?=[^\u4e00-\u9fff])|(?<=[^\u4e00-\u9fff])(?=[\u4e00-\u9fff]))/);

                            wordCount += segments.filter(segment => segment.length > 0).length;
                        } else {
                            // Non-Chinese (English, numbers, etc.)
                            wordCount += 1;
                        }
                    }

                    return wordCount;
                }
            }),
            Dropcursor,
            Focus.configure({ className: 'has-focus', mode: 'all' }),
            ListKeymap,
            Youtube.configure({
                // Add configuration as needed, for example:
                // width: 640,
                // height: 480,
                // nocookie: true,
                // controls: false,
                // allowFullscreen: false,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());

            // update character and word count
            if (editor.storage.characterCount) {
                setCharactersCount(editor.storage.characterCount.characters());
                setWordsCount(editor.storage.characterCount.words());
            }
        },
        editorProps: {
            attributes: {
                class: 'focus:outline-none prose max-w-none',
            },
            // Stop keyboard event bubbling from editor to form
            handleKeyDown: (view, event) => {
                // Block Ctrl+S or Cmd+S (save shortcut)
                if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                    event.preventDefault();

                    return true;
                }

                // Block standalone Enter key from bubbling to form (prevent form submission)
                if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey) {
                    // Do not prevent Enter inside editor, but stop propagation
                    event.stopPropagation();

                    return false; // Let Tiptap continue handling Enter key
                }

                return false;
            },
        },
        immediatelyRender: false, // Fix SSR hydration issue
    });

    // Call onEditorReady callback when editor initialization is complete
    useEffect(() => {
        if (editor && onEditorReady) {
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    // Calculate character limit progress
    const characterLimitProgress = editor && editor.storage.characterCount
        ? Math.min(100, Math.round((charactersCount / charLimit) * 100))
        : 0;

    // Check if it is approaching or exceeding the limit
    const isNearLimit = characterLimitProgress > 80 && characterLimitProgress < 100;
    const isOverLimit = characterLimitProgress >= 100;

    // Calculate remaining character count
    const remainingChars = Math.max(0, charLimit - charactersCount);

    // Notify parent component when character limit is exceeded
    useEffect(() => {
        // If editor is initialized and onEditorReady callback exists
        if (editor && onEditorReady) {
            // Pass editor instance and character limit status to parent component
            onEditorReady(editor);

            // Notify form via custom events or modifying DOM attributes
            if (editor.options.element) {
                // Set custom attribute on editor element, form can check this attribute to decide whether to allow submit
                const editorElement = editor.options.element as HTMLElement;

                editorElement.dataset.isOverLimit = String(isOverLimit);
            }
        }
    }, [editor, onEditorReady, isOverLimit]);

    // Handle product selection
    const handleProductSelect = (product: Product) => {
        if (!editor) return;

        // Use type assertion to handle insert product commands
        const commands = editor.commands as unknown as ProductCommands;

        commands.insertProduct({
            id: product.id || product.asin || '',
            title: product.title,
            price: product.price || 0,
            // Image handling: prefer main_image, fall back to image
            image: product.main_image || product.image_url || '/placeholder-product.jpg',
            // ASIN handling: use asin directly or default to empty string
            asin: product.asin || '',
            // Style handling: use product-provided style or default to card style
            style: product.style || 'card'
        });

        editor.commands.focus();
        setShowProductSelector(false);
    };

    // New: handle link Popover open/close
    const handleLinkOpenChange = useCallback((open: boolean) => {
        if (open && editor) {
            const currentUrl = editor.getAttributes('link').href || '';

            setLinkUrl(currentUrl);
        }
        setIsLinkPopoverOpen(open);
    }, [editor]);

    // Apply link
    const handleApplyLink = useCallback(() => {
        if (!editor) return;
        const urlToSet = linkUrl.trim();

        // Simple URL validation (or remove/enhance as needed)
        if (!urlToSet || !/^https?:\/\//i.test(urlToSet)) {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: urlToSet }).run();
        }
        setIsLinkPopoverOpen(false);
    }, [editor, linkUrl]);

    // remove link
    const handleRemoveLink = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        setIsLinkPopoverOpen(false);
    }, [editor]);

    // Handle highlighted text
    const handleHighlight = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        // Stop event bubbling to prevent triggering form submission
        e.preventDefault();
        e.stopPropagation();

        if (!editor) return;
        editor.chain().focus().toggleHighlight().run();
    }, [editor]);

    // Handle image add in FloatingMenu
    const handleFloatingImageAdd = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        // Stop event bubbling to prevent triggering form submission
        e.preventDefault();
        e.stopPropagation();

        if (!editor) return;

        // Immediately blur editor to ensure menu disappears
        editor.commands.blur();

        // No longer using native prompt, replaced with status-controlled modal or Popover
        // Restore direct status setting
        setShowFloatingImageInput(true);
    }, [editor]);

    // Handle image URL application
    const handleApplyImageUrl = useCallback((url: string) => {
        if (!editor || !url) return;

        if (url && url !== 'https://') {
            editor.chain().focus().setImage({ src: url }).run();
        }

        setShowFloatingImageInput(false);
    }, [editor]);

    // Callback to open product selector
    const _handleAddProductClick = useCallback((e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        // Immediately blur editor to ensure menu disappears
        editor?.commands.blur();

        // Restore direct status setting
        setShowProductSelector(true);
    }, [editor]);

    // Or you may need to create a new toolbar call wrapper
    const handleAddProductWrapper = () => {
        setShowProductSelector(true);
    };

    // Restore handleProductStyleChange as style buttons still need it
    const handleProductStyleChange = useCallback((style: string) => {
        if (editor && editor.isActive('product')) {
            editor.chain().focus().updateAttributes('product', { style }).run();
        }
    }, [editor]);

    // Ensure editor loses focus when any modal opens
    useEffect(() => {
        if (showProductSelector || showProductPicker || showMetadataSelector || showFloatingImageInput) {
            editor?.commands.blur();
        }
    }, [editor, showProductSelector, showProductPicker, showMetadataSelector, showFloatingImageInput]);

    // If not on client, return placeholder
    if (!isClient) {
        return <div className={className}><div className={editorClass}>Loading editor...</div></div>;
    }

    return (
        <div className={`rich-text-editor ${className} border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-150 flex flex-col h-[850px] ${isOverLimit ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500' : ''}`}>
            {/* Editor top toolbar — sticky positioning, prevents shrinking */}
            <div className="p-2 border-b border-gray-300 flex flex-wrap items-center gap-1 bg-white sticky top-0 z-50 shadow-sm flex-shrink-0">
                <TiptapToolbar editor={editor} onAddProduct={handleAddProductWrapper} />
            </div>

            {/* Editor content area — set as scrollable container */}
            <div className="relative flex-grow overflow-y-auto">
                <EditorContent
                    editor={editor}
                    className={`prose max-w-none p-4 ${editorClass}`}
                    translate="no"
                />

                {/* Add custom styles */}
                <style jsx global>{`
                    .ProseMirror h1 {
                        font-size: 2rem;
                        font-weight: 700;
                        margin-top: 1rem;
                        margin-bottom: 0.5rem;
                        color: #333;
                    }
                    .ProseMirror h2 {
                        font-size: 1.5rem;
                        font-weight: 600;
                        margin-top: 0.8rem;
                        margin-bottom: 0.4rem;
                        color: #333;
                    }
                    .ProseMirror h3 {
                        font-size: 1.25rem;
                        font-weight: 500;
                        margin-top: 0.6rem;
                        margin-bottom: 0.3rem;
                        color: #333;
                    }
                    .ProseMirror h4 {
                        font-size: 1.15rem;
                        font-weight: 500;
                        margin-top: 0.5rem;
                        margin-bottom: 0.3rem;
                        color: #333;
                    }
                    .ProseMirror h5 {
                        font-size: 1.05rem;
                        font-weight: 500;
                        margin-top: 0.5rem;
                        margin-bottom: 0.2rem;
                        color: #333;
                    }
                    .ProseMirror h6 {
                        font-size: 1rem;
                        font-weight: 500;
                        margin-top: 0.5rem;
                        margin-bottom: 0.2rem;
                        color: #333;
                    }
                    .ProseMirror p {
                        margin-bottom: 0.75rem;
                    }
                    .ProseMirror ul, .ProseMirror ol {
                        padding-left: 1.5rem;
                        margin-bottom: 0.75rem;
                    }
                    
                    /* Styles for disabling translation functionality */
                    .ProseMirror {
                        translate: no; /* Disable translation in modern browsers */
                        -webkit-translate: no; /* Safari-specific property */
                    }
                    
                    /* Modify text selection styles */
                    .ProseMirror ::selection {
                        background-color: rgba(59, 130, 246, 0.3);
                        color: inherit;
                    }

                    /* Fix bubble menu width issue */
                    .tippy-box {
                        width: auto !important;
                        max-width: none !important;
                        white-space: nowrap !important;
                    }
                    .tippy-content {
                        width: auto !important;
                        max-width: none !important;
                        white-space: nowrap !important;
                    }
                    
                    /* Ensure modal is above editor floating menu */
                    .modal-backdrop, .modal-content {
                        z-index: 9999 !important; /* Use higher z-index value */
                    }
                    
                    /* New: CSS class to hide FloatingMenu */
                    .floating-menu-hidden {
                        opacity: 0 !important;
                        visibility: hidden !important;
                        pointer-events: none !important;
                        transition: none !important; /* Ensure immediate hiding */
                    }
                `}</style>

                {/* Markdown shortcut hints */}
                {!editor?.getText() && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 text-center pointer-events-none">
                        <p className="mb-2">Markdown shortcuts available</p>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                            <div className="text-left"># H1 Title</div>
                            <div className="text-left">## H2 Title</div>
                            <div className="text-left">*italic*</div>
                            <div className="text-left">**bold**</div>
                            <div className="text-left">`code`</div>
                            <div className="text-left">&gt; quote</div>
                            <div className="text-left">- list item</div>
                            <div className="text-left">1. ordered list</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Character count and word count */}
            {editor && (
                <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                    {/* Character limit progress bar */}
                    <div className="h-1.5 w-full bg-gray-200 rounded-full mb-2">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-300 ease-in-out ${isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                            style={{ width: `${characterLimitProgress}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-4 text-gray-500">
                            <div>
                                Characters: <span className={`font-medium ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-600' : ''}`}>
                                    {charactersCount}
                                </span>
                                {charLimit ? (
                                    <span className="text-gray-400 ml-1">/ {charLimit}</span>
                                ) : null}
                            </div>
                            <div>
                                Words: <span className="font-medium">{wordsCount}</span>
                            </div>
                        </div>

                        {isNearLimit && !isOverLimit && (
                            <div className="text-yellow-600 font-medium">
                                Remaining: {remainingChars} characters
                            </div>
                        )}

                        {isOverLimit && (
                            <div className="text-red-500 font-medium animate-pulse">
                                Exceeded by {Math.abs(remainingChars)} characters
                            </div>
                        )}
                    </div>
                </div>
            )}

            {editor && (
                /* Bubble menu: add whitespace-nowrap and min-w-max classes to fix menu width not adapting to content */
                <BubbleMenu
                    editor={editor}
                    tippyOptions={{
                        duration: 100,
                        maxWidth: 'none', // Allow menu to fully expand to its content width
                        placement: 'top',
                        offset: [0, 10],
                        zIndex: 50,
                        animation: 'shift-away',
                        interactive: true,
                        appendTo: () => document.body,
                        // Ensure menu doesn't overflow viewport
                        popperOptions: {
                            modifiers: [
                                {
                                    name: 'preventOverflow',
                                    options: {
                                        boundary: 'viewport',
                                        padding: 5,
                                    },
                                },
                                {
                                    name: 'flip',
                                    options: {
                                        fallbackPlacements: ['bottom', 'right', 'left'],
                                        padding: 5,
                                    },
                                },
                                {
                                    name: 'sizeByReference', // Add modifier to ensure width adapts
                                    enabled: true,
                                    options: {
                                        width: 'auto',
                                    },
                                },
                            ],
                        },
                        onCreate: ({ popper }) => {
                            // Set popper style directly
                            if (popper && popper.firstElementChild) {
                                (popper.firstElementChild as HTMLElement).style.width = 'auto';
                                (popper.firstElementChild as HTMLElement).style.maxWidth = 'none';
                                (popper.firstElementChild as HTMLElement).style.whiteSpace = 'nowrap';
                            }
                        },
                        onShow: (instance) => {
                            // Prevent Google Translate from triggering
                            const selection = window.getSelection();

                            if (selection && selection.toString()) {
                                // Delay execution to let BubbleMenu show first
                                setTimeout(() => {
                                    // Temporarily clear selection then restore, interrupting Google Translate
                                    if (selection.rangeCount > 0) {
                                        const range = selection.getRangeAt(0);

                                        selection.removeAllRanges();
                                        setTimeout(() => {
                                            selection.addRange(range);
                                        }, 0);
                                    }
                                }, 0);
                            }

                            // Fix width issue
                            if (instance.popper && instance.popper.firstElementChild) {
                                (instance.popper.firstElementChild as HTMLElement).style.width = 'auto';
                                (instance.popper.firstElementChild as HTMLElement).style.maxWidth = 'none';
                                (instance.popper.firstElementChild as HTMLElement).style.whiteSpace = 'nowrap';
                            }
                        }
                    }}
                    className="bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 flex items-center gap-1.5 transition-opacity duration-150 whitespace-nowrap w-auto min-w-fit"
                    shouldShow={({ state }) => {
                        const { selection } = state;
                        const { $from, empty } = selection;

                        const isTextSelection = !empty && ($from.parent.type.name === 'paragraph' || $from.parent.type.name === 'heading');
                        const isProductNodeSelected = isNodeSelection(selection) && selection.node?.type.name === 'product';

                        return (isTextSelection || isProductNodeSelected) && !isLinkPopoverOpen;
                    }}
                >
                    {isNodeSelection(editor.state.selection) && editor.isActive('product') ? (
                        // --- Menu when product node is selected (style buttons only) ---
                        (() => {
                            const selection = editor.state.selection;
                            const currentNode = isNodeSelection(selection) ? selection.node : null;
                            const currentStyle = currentNode?.attrs.style;
                            // const currentAlignment = currentNode?.attrs.alignment || 'left'; // Alignment no longer needed here

                            return (
                                <div className="flex items-center gap-1.5 whitespace-nowrap min-w-max overflow-visible flex-shrink-0 flex-nowrap">
                                    {/* Style buttons — use nowrap, remove flex-wrap */}
                                    <span className="text-xs text-gray-500 mr-1 flex-shrink-0">layout:</span>
                                    <div className="flex items-center flex-shrink-0 flex-nowrap">
                                        {PRODUCT_STYLES.map((styleOption) => (
                                            <button
                                                key={styleOption.id}
                                                type="button"
                                                onClick={() => handleProductStyleChange(styleOption.id)}
                                                className={`px-1.5 py-0.5 rounded text-xs hover:bg-gray-100 transition-colors flex-shrink-0 ${currentStyle === styleOption.id ? 'bg-blue-100 text-blue-600' : 'text-gray-700'}`}
                                                title={styleOption.name}
                                            >
                                                {styleOption.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()
                    ) : (
                        // --- Text formatting tools (unchanged) ---
                        <>
                            <div className="flex items-center whitespace-nowrap min-w-max flex-shrink-0 flex-nowrap">
                                <button
                                    type="button"
                                    onClick={() => editor?.chain().focus().toggleBold().run()}
                                    className={`p-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 ${editor?.isActive('bold') ? 'bg-blue-100 text-blue-600' : ''}`}
                                    title="Bold"
                                >
                                    <Bold size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                                    className={`p-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 ${editor?.isActive('italic') ? 'bg-blue-100 text-blue-600' : ''}`}
                                    title="Italic"
                                >
                                    <Italic size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => editor?.chain().focus().toggleStrike().run()}
                                    className={`p-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 ${editor?.isActive('strike') ? 'bg-blue-100 text-blue-600' : ''}`}
                                    title="Strikethrough"
                                >
                                    <Strikethrough size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleHighlight}
                                    className={`p-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors flex-shrink-0 ${editor?.isActive('highlight') ? 'bg-blue-100 text-blue-600' : ''}`}
                                    title="Highlight text"
                                >
                                    <Highlighter size={16} />
                                </button>
                                <Popover placement="bottom" isOpen={isLinkPopoverOpen} onOpenChange={handleLinkOpenChange}>
                                    <PopoverTrigger>
                                        <div>
                                            <button
                                                type="button"
                                                className={`p-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors ${editor?.isActive('link') ? 'bg-blue-100 text-blue-600' : ''}`}
                                                title="Add/Edit link"
                                            >
                                                <LinkIcon size={16} />
                                            </button>
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-2 w-64">
                                        <div className="space-y-2">
                                            <Input
                                                type="url"
                                                placeholder="https://example.com"
                                                value={linkUrl}
                                                onChange={(e) => setLinkUrl(e.target.value)}
                                                className="w-full"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" onClick={handleApplyLink}>Apply</Button>
                                                <Button size="sm" onClick={handleRemoveLink}>Remove</Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <ColorPickerPopover
                                    editor={editor}
                                    trigger={
                                        <button
                                            type="button"
                                            className={`p-1.5 rounded-md text-gray-700 hover:bg-gray-100 transition-colors ${editor?.isActive('textStyle') ? 'bg-blue-100 text-blue-600' : ''}`}
                                            title="Text color"
                                        >
                                            <Palette size={16} />
                                        </button>
                                    }
                                />
                            </div>
                        </>
                    )}
                </BubbleMenu>
            )}

            {/* Only show floating menu when no modal is open */}
            {editor && (
                () => {
                    // Calculate whether modal is open status
                    const isModalOpen = showProductSelector || showFloatingImageInput || showMetadataSelector;

                    return (
                        <FloatingMenu
                            editor={editor}
                            tippyOptions={{
                                duration: 100,
                                appendTo: () => document.body, // Attach to body
                                placement: 'bottom-start',      // Initial position
                                popperOptions: {
                                    modifiers: [
                                        {
                                            name: 'flip',
                                            options: {
                                                fallbackPlacements: ['top-start', 'right-start', 'left-start'], // Flip order
                                                padding: 5, // Padding from viewport edge
                                            },
                                        },
                                        {
                                            name: 'preventOverflow',
                                            options: {
                                                boundary: 'viewport', // Prevent viewport overflow
                                                padding: 5, // Padding from viewport edge
                                            },
                                        },
                                        {
                                            name: 'offset',
                                            options: {
                                                offset: [0, 8], // Offset 8px downward
                                            },
                                        },
                                    ],
                                },
                            }}
                            // Dynamically add hide class
                            className={`bg-white border border-gray-200 p-1 rounded shadow-lg flex flex-col gap-0.5 z-[50] ${isModalOpen ? 'floating-menu-hidden' : ''}`}
                            shouldShow={({ state }) => {
                                const { $from } = state.selection;
                                const currentLineIsEmpty = $from.parent.content.size === 0;
                                const baseCondition = currentLineIsEmpty && $from.parent.type.name === 'paragraph';

                                // No longer checking modal status here, delegated to className
                                // const modalIsOpen = showProductSelector || showFloatingImageInput || showMetadataSelector;
                                // return baseCondition && !modalIsOpen; 
                                return baseCondition;
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 text-left text-sm"
                            >
                                <Heading1 size={16} /> H1 Title
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 text-left text-sm"
                            >
                                <Heading2 size={16} /> H2 Title
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 text-left text-sm"
                            >
                                <Heading2 size={15} /> H3 Title
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 text-left text-sm"
                            >
                                <Heading2 size={14} /> H4 Title
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 text-left text-sm"
                            >
                                <Heading2 size={13} /> H5 Title
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 text-left text-sm"
                            >
                                <Heading2 size={12} /> H6 Title
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 text-left text-sm"
                            >
                                <List size={16} /> Unordered List
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 text-left text-sm"
                            >
                                <ListOrdered size={16} /> Ordered List
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 text-left text-sm"
                            >
                                <Quote size={16} /> Quote
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 text-left text-sm"
                            >
                                <Code size={16} /> Code Block
                            </button>
                            <button
                                type="button"
                                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 text-left text-sm"
                            >
                                <Minus size={16} /> Horizontal Rule
                            </button>
                            <button
                                type="button"
                                onClick={handleFloatingImageAdd}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 text-left text-sm"
                            >
                                <ImageIcon size={16} /> Insert Image (URL)
                            </button>
                        </FloatingMenu>
                    );
                }
            )()}

            {showProductSelector && (
                <ProductSelector
                    isOpen={showProductSelector}
                    onClose={() => setShowProductSelector(false)}
                    onSelect={handleProductSelect}
                />
            )}

            {/* Image URL input modal */}
            {showFloatingImageInput && (
                <Modal
                    isOpen={showFloatingImageInput}
                    onClose={() => setShowFloatingImageInput(false)}
                    disableAnimation={false}
                    classNames={{
                        backdrop: "z-[9998]",
                        base: "z-[9999]",
                        wrapper: "z-[9999]"
                    }}
                >
                    <ModalContent className="max-w-md">
                        <ModalHeader>
                            <h3 className="text-lg font-medium">Insert Image</h3>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="image-url-input" className="block text-sm font-medium text-gray-700 mb-1">
                                        Image URL
                                    </label>
                                    <Input
                                        id="image-url-input"
                                        placeholder="https://example.com/image.jpg"
                                        defaultValue="https://"
                                        type="url"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const input = e.currentTarget as HTMLInputElement;

                                                handleApplyImageUrl(input.value);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button variant="light" onClick={() => setShowFloatingImageInput(false)}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onClick={() => {
                                    const input = document.getElementById('image-url-input') as HTMLInputElement;

                                    handleApplyImageUrl(input.value);
                                }}
                            >
                                Insert
                            </Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            )}
        </div>
    );
} 