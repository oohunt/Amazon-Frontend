'use client';

import { Badge, Autocomplete, AutocompleteItem } from "@heroui/react";
import type { Editor } from '@tiptap/react';
import { Save, FileQuestion, ArrowLeft, AlertTriangle, Eye, Edit3, X } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback } from 'react';

import ContentRenderer from '@/components/cms/ContentRenderer';
import { RichTextEditor } from '@/components/cms/RichTextEditor';
import { useDashboardSave } from '@/components/dashboard/DashboardLayout';
import { cmsApi } from '@/lib/api/cms';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { generateSlug } from '@/lib/utils';
import type { ContentPageCreateRequest, ContentPageUpdateRequest, ContentCategory, ContentTag } from '@/types/cms';

import CoverImageUploader from './CoverImageUploader';


interface FormData {
    title: string;
    slug: string;
    content: string;
    excerpt: string;
    status: 'draft' | 'published' | 'archived';
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
}

/**
 * Content page editor component
 * For creating and editing content pages
 */
const PageEditorContent = () => {
    const router = useRouter();
    const params = useParams();
    const { data: session } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [loadingPage, setLoadingPage] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showSlugWarning, setShowSlugWarning] = useState(false);
    const [isPreviewActive, setIsPreviewActive] = useState(false);
    const editorInstance = useRef<Editor | null>(null);
    const { setSaveButton } = useDashboardSave();

    const [categories, setCategories] = useState<string[]>([]);
    const [tags, setTags] = useState<string[]>([]);
    const [featuredImage, setFeaturedImage] = useState('');
    const [availableCategories, setAvailableCategories] = useState<ContentCategory[]>([]);
    const [availableTags, setAvailableTags] = useState<ContentTag[]>([]);
    const [categorySearch, setCategorySearch] = useState('');
    const [tagSearch, setTagSearch] = useState('');

    // Page form status
    const [formData, setFormData] = useState<FormData>({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        status: 'draft',
        metaTitle: '',
        metaDescription: '',
        metaKeywords: ''
    });

    // Determine mode based on route parameters
    useEffect(() => {
        if (params?.id) {
            setMode('edit');
            loadPage(params.id as string);
        }
    }, [params]);

    // Load page data
    const loadPage = async (id: string) => {
        setLoadingPage(true);
        setLoadError(null);
        try {
            const response = await cmsApi.getPageById(id);

            // Adddetailed log output for debugging

            // Check response structure for enhanced robustness
            if (response?.data) {
                // Allow status code 200 or other success codes (2xx)
                const isSuccessStatus = response.data.status >= 200 && response.data.status < 300;

                if (isSuccessStatus && response.data.data) {
                    const pageData = response.data.data;

                    if (pageData) {
                        const newFormData: FormData = {
                            title: pageData.title || '',
                            slug: pageData.slug || '',
                            content: pageData.content || '',
                            excerpt: pageData.excerpt || '',
                            status: pageData.status || 'draft',
                            metaTitle: pageData.metaTitle || pageData.title || '',
                            metaDescription: pageData.metaDescription || pageData.excerpt || '',
                            metaKeywords: pageData.metaKeywords || ''
                        };

                        setFormData(newFormData);
                        setCategories(Array.isArray(pageData.categories) ? pageData.categories : []);
                        setTags(Array.isArray(pageData.tags) ? pageData.tags : []);
                        setFeaturedImage(pageData.featuredImage || '');
                    } else {
                        setLoadError('Failed to load page data - Page data format error');
                    }
                } else {
                    setLoadError(`Failed to load page data - API status code: ${response.data.status || 'Unknown'}, message: ${response.data.message || 'Not provided'}`);
                }
            } else {
                setLoadError('Failed to load page data - API response format error');
            }
        } catch (err) {
            setLoadError(`Failed to load page data - Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setLoadingPage(false);
        }
    };

    // Load available categories and tags
    useEffect(() => {
        const loadCategoriesAndTags = async () => {
            try {
                const [categoriesResponse, tagsResponse] = await Promise.all([
                    cmsApi.getCategories(),
                    cmsApi.getTags()
                ]);

                if (categoriesResponse.data?.data) {
                    setAvailableCategories(categoriesResponse.data.data.categories);
                }

                if (tagsResponse.data?.data) {
                    setAvailableTags(tagsResponse.data.data.tags);
                }
            } catch {
                // Silently handle error, does not affect main functionality
            }
        };

        loadCategoriesAndTags();
    }, []);

    // Wrap handleSubmit with useCallback to avoid unnecessary re-creation
    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        if (!formData.title) {
            showErrorToast({
                title: "Validation Error",
                description: "Please enter a page title",
            });

            return;
        }

        if (!formData.slug) {
            showErrorToast({
                title: "Validation Error",
                description: "Please enter a page URL path",
            });

            return;
        }

        setIsSubmitting(true);

        try {
            const pageData: ContentPageCreateRequest | ContentPageUpdateRequest = {
                title: formData.title,
                slug: formData.slug,
                content: formData.content,
                excerpt: formData.excerpt,
                status: formData.status,
                categories,
                tags,
                featuredImage,
                author: session?.user?.name || session?.user?.email || 'Unknown',
                metaTitle: formData.metaTitle || formData.title,
                metaDescription: formData.metaDescription || formData.excerpt,
                metaKeywords: formData.metaKeywords
            };

            if (formData.status === 'published') {
                pageData.publishedAt = new Date();
            }

            let response;

            if (params.id) {
                response = await cmsApi.updatePage(params.id as string, pageData as ContentPageUpdateRequest);
            } else {
                response = await cmsApi.createPage(pageData as ContentPageCreateRequest);
            }

            if (response.data?.status === 200) {
                // Show success toast
                showSuccessToast({
                    title: "Save Successful",
                    description: params.id ? "Page has been updated successfully" : "Page has been created successfully",
                });

                // Navigate back to page list
                router.push('/dashboard/cms/pages');
            } else {
                throw new Error(response.data?.message || 'Failed to save page');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

            showErrorToast({
                title: "Save Failed",
                description: errorMessage,
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, categories, tags, featuredImage, session, params, router]);

    // Use useEffect to set up top save button, independent of handleSubmit
    useEffect(() => {
        // Show save button only in non-preview mode when form data exists
        if (!isPreviewActive) {
            // create save button element
            const saveButtonElement = (
                <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting || loadingPage}
                    className={`inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors
                    ${(isSubmitting || loadingPage) ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    <Save size={16} className="mr-1.5" />
                    {isSubmitting ? 'save page...' : 'save page'}
                </button>
            );

            // Set up save button
            setSaveButton(saveButtonElement);
        } else {
            // remove save button in preview mode
            setSaveButton(null);
        }

        // Clear save button when component unmounts
        return () => {
            setSaveButton(null);
        };
    }, [isSubmitting, loadingPage, isPreviewActive, setSaveButton, handleSubmit]);

    // Prevent Enter key from submitting form
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
            if (e.target.type !== 'textarea') {
                e.preventDefault();
            }
        }
    };

    // Handle title change and auto-generate slug
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;

        setFormData(prev => ({ ...prev, title: newTitle }));

        if (mode === 'create' && !showSlugWarning) {
            const newSlug = generateSlug(newTitle);

            setFormData(prev => ({ ...prev, slug: newSlug }));
        }

        if (!formData.metaTitle) {
            setFormData(prev => ({ ...prev, metaTitle: newTitle }));
        }
    };

    // Handle slug change
    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSlug = e.target.value;

        if (!showSlugWarning && mode === 'create') {
            setShowSlugWarning(true);
        }

        const sanitizedSlug = newSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

        setFormData(prev => ({ ...prev, slug: sanitizedSlug }));
    };

    // Handle summary change and auto-update meta description
    const handleExcerptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newExcerpt = e.target.value;

        setFormData(prev => ({ ...prev, excerpt: newExcerpt }));

        if (!formData.metaDescription) {
            setFormData(prev => ({ ...prev, metaDescription: newExcerpt }));
        }
    };

    // Get editor instance
    const handleEditorReady = (editor: Editor) => {
        editorInstance.current = editor;
    };

    // Handle creating new category
    const handleCreateCategory = async (name: string): Promise<void> => {
        try {
            const response = await cmsApi.createCategory({ name, slug: generateSlug(name) });

            if (response.data?.status === 200 && response.data.data) {
                const newCategory = response.data.data;

                if (newCategory._id) {
                    setAvailableCategories(prev => [...prev, newCategory]);
                    setCategories(prev => [...prev, newCategory._id].filter((id): id is string => id !== undefined));
                }
            }
        } catch {
            // Silently handle error
        }
    };

    // Handle creating new tag
    const handleCreateTag = async (name: string): Promise<void> => {
        try {
            const response = await cmsApi.createTag({ name, slug: generateSlug(name) });

            if (response.data?.status === 200 && response.data.data) {
                const newTag = response.data.data;

                if (newTag._id) {
                    setAvailableTags(prev => [...prev, newTag]);
                    setTags(prev => [...prev, newTag._id].filter((id): id is string => id !== undefined));
                }
            }
        } catch {
            // Silently handle error
        }
    };

    // Render loading status
    if (mode === 'edit' && loadingPage) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                <p className="ml-2">Loading page data...</p>
            </div>
        );
    }

    // Render loading error
    if (mode === 'edit' && loadError) {
        return (
            <div className="text-center py-12">
                <FileQuestion size={48} className="mx-auto text-red-500" />
                <h2 className="text-xl font-semibold mt-4 mb-2">Loading Error</h2>
                <p className="text-gray-600">{loadError}</p>
                <button
                    onClick={() => router.push('/dashboard/cms/pages')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Back to Page List
                </button>
            </div>
        );
    }

    // Toggle preview mode
    const togglePreview = () => {
        // If new page and not saved, preview not allowed
        if (mode === 'create' && !params.id && !formData.slug) {
            showErrorToast({
                title: "Cannot preview",
                description: "Please save the page or at least set the URL path first",
            });

            return;
        }

        setIsPreviewActive(!isPreviewActive);
    };

    // Generate preview link
    const generatePreviewLink = () => {
        if (!formData.slug) {
            showErrorToast({
                title: "Failed to generate preview link",
                description: "Please set the page URL path first",
            });

            return;
        }

        // Build preview link using ?preview=true parameter
        const baseUrl = window.location.origin;
        const previewUrl = `${baseUrl}/blog/${formData.slug}?preview=true`;

        // copy link to clipboard
        navigator.clipboard.writeText(previewUrl)
            .then(() => {
                showSuccessToast({
                    title: "Preview link copied",
                    description: "You can share this link with others to preview the draft",
                });
            })
            .catch(() => {
                showErrorToast({
                    title: "copy failed",
                    description: "Unable to copy preview link to clipboard",
                });
            });

        return previewUrl;
    };

    // Render page preview
    const renderPreview = () => {
        if (!formData.content) {
            return (
                <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg p-10">
                    <p className="text-gray-500">No content to preview</p>
                </div>
            );
        }

        return (
            <div className="rounded-lg shadow bg-white">
                {/* Add 'view in new window' button — shown only when slug exists */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        {!formData.slug && (
                            <div className="text-amber-600 text-sm flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Please save with URL path to enable full page preview
                            </div>
                        )}
                    </div>
                    {formData.slug && (
                        <a
                            href={`/blog/${formData.slug}?preview=true`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 rounded-md border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Open in New Window
                        </a>
                    )}
                </div>
                <div className="p-8">
                    <h1 className="text-3xl font-bold mb-4">{formData.title}</h1>
                    {formData.excerpt && (
                        <p className="text-gray-600 mb-6">{formData.excerpt}</p>
                    )}
                    <div className="prose max-w-none">
                        <ContentRenderer content={formData.content} />
                    </div>
                </div>
            </div>
        );
    };

    // Render bottom save button
    const renderSaveButton = () => {
        return (
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                    <Save size={18} className="mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save Page'}
                </button>
            </div>
        );
    };

    return (
        <div className="mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button
                        onClick={() => router.push('/dashboard/cms/pages')}
                        className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
                        aria-label="Back to page list"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-bold">
                        {mode === 'create' ? 'Create New Blog Post' : 'Edit Blog Post'}
                    </h1>
                </div>
                <div className="flex space-x-2">
                    {/* Preview link button — shown only for pages with a slug */}
                    {formData.slug && (formData.status === 'draft' || mode === 'create') && (
                        <button
                            type="button"
                            onClick={generatePreviewLink}
                            className="flex items-center px-4 py-2 rounded-md border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                            </svg>
                            Get Preview Link
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={togglePreview}
                        className="flex items-center px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                    >
                        {isPreviewActive ? (
                            <>
                                <Edit3 size={18} className="mr-2" />
                                Back to Edit
                            </>
                        ) : (
                            <>
                                <Eye size={18} className="mr-2" />
                                Preview Post
                            </>
                        )}
                    </button>
                </div>
            </div>

            {isPreviewActive ? (
                renderPreview()
            ) : (
                <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Title and Editor */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Title input */}
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                Title
                            </label>
                            <input
                                type="text"
                                id="title"
                                value={formData.title}
                                onChange={handleTitleChange}
                                placeholder="Enter page title..."
                                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        {/* Content editor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Content
                            </label>
                            <RichTextEditor
                                value={formData.content}
                                onChange={(content: string) => setFormData(prev => ({ ...prev, content }))}
                                onEditorReady={handleEditorReady}
                                placeholder="Start editing page content..."
                                className="mb-6"
                            />
                        </div>
                    </div>

                    {/* Right Column: Sidebar Elements */}
                    <div className="md:col-span-1 space-y-6">
                        {/* Status selection */}
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                                Page Status
                            </label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
                                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        {/* URL path input */}
                        <div>
                            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                                URL Path
                            </label>
                            <div className="flex items-center">
                                <span className="bg-gray-100 px-3 py-2 border border-r-0 rounded-l-md text-gray-500">
                                    /
                                </span>
                                <input
                                    type="text"
                                    id="slug"
                                    value={formData.slug}
                                    onChange={handleSlugChange}
                                    placeholder="url-path"
                                    className="flex-1 px-4 py-2 border rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            {showSlugWarning && (
                                <div className="mt-1 flex items-center text-amber-600 text-sm">
                                    <AlertTriangle size={16} className="mr-1" />
                                    Modifying URL path may affect SEO and existing links
                                </div>
                            )}
                        </div>

                        {/* Featured image */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
                            <CoverImageUploader
                                currentImageUrl={featuredImage}
                                onImageUploaded={(url) => setFeaturedImage(url)}
                            />
                        </div>

                        {/* Category selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Categories</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {categories.map((categoryId) => {
                                    const category = availableCategories.find(c => c._id === categoryId);

                                    return category ? (
                                        <Badge key={categoryId} variant="solid" className="flex items-center gap-1">
                                            {category.name}
                                            <button
                                                type="button"
                                                onClick={() => setCategories(categories.filter(id => id !== categoryId))}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ) : null;
                                })}
                            </div>
                            <Autocomplete
                                placeholder="Search or create new category"
                                value={categorySearch}
                                onValueChange={setCategorySearch}
                                onSelectionChange={(key) => {
                                    if (key && typeof key === 'string') {
                                        const category = availableCategories.find(c => c._id === key);

                                        if (category && category._id && !categories.includes(category._id)) {
                                            setCategories([...categories, category._id]);
                                        }
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && categorySearch.trim() && !availableCategories.some(c => c.name.toLowerCase() === categorySearch.toLowerCase())) {
                                        handleCreateCategory(categorySearch.trim());
                                        setCategorySearch('');
                                    }
                                }}
                                aria-label="Search or create new category"
                            >
                                {availableCategories.map((category) => (
                                    <AutocompleteItem key={category._id || ''} textValue={category.name}>
                                        {category.name}
                                    </AutocompleteItem>
                                ))}
                            </Autocomplete>
                        </div>

                        {/* Tag selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Tags</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {tags.map((tagId) => {
                                    const tag = availableTags.find(t => t._id === tagId);

                                    return tag ? (
                                        <Badge key={tagId} variant="solid" className="flex items-center gap-1">
                                            {tag.name}
                                            <button
                                                type="button"
                                                onClick={() => setTags(tags.filter(id => id !== tagId))}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ) : null;
                                })}
                            </div>
                            <Autocomplete
                                placeholder="Search or create new tag"
                                value={tagSearch}
                                onValueChange={setTagSearch}
                                onSelectionChange={(key) => {
                                    if (key && typeof key === 'string') {
                                        const tag = availableTags.find(t => t._id === key);

                                        if (tag && tag._id && !tags.includes(tag._id)) {
                                            setTags([...tags, tag._id]);
                                        }
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && tagSearch.trim() && !availableTags.some(t => t.name.toLowerCase() === tagSearch.toLowerCase())) {
                                        handleCreateTag(tagSearch.trim());
                                        setTagSearch('');
                                    }
                                }}
                                aria-label="Search or create new tag"
                            >
                                {availableTags.map((tag) => (
                                    <AutocompleteItem key={tag._id || ''} textValue={tag.name}>
                                        {tag.name}
                                    </AutocompleteItem>
                                ))}
                            </Autocomplete>
                        </div>

                        {/* Summary input */}
                        <div>
                            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-1">
                                Excerpt (for SEO description)
                            </label>
                            <textarea
                                id="excerpt"
                                value={formData.excerpt}
                                onChange={handleExcerptChange}
                                placeholder="Enter a brief description of the page..."
                                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={3}
                            />
                        </div>

                        {/* SEO metadata section */}
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                            <h3 className="text-md font-medium mb-3">SEO Metadata Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="metaTitle" className="block text-sm font-medium text-gray-700 mb-1">
                                        Meta Title (for search engines)
                                    </label>
                                    <input
                                        type="text"
                                        id="metaTitle"
                                        value={formData.metaTitle || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                                        placeholder="Enter meta title..."
                                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Recommended: Within 60 characters, leave blank to use page title
                                    </p>
                                </div>
                                <div>
                                    <label htmlFor="metaDescription" className="block text-sm font-medium text-gray-700 mb-1">
                                        Meta Description
                                    </label>
                                    <textarea
                                        id="metaDescription"
                                        value={formData.metaDescription || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                                        placeholder="Enter meta description..."
                                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows={2}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Recommended: Within 160 characters, leave blank to use excerpt
                                    </p>
                                </div>
                                <div>
                                    <label htmlFor="metaKeywords" className="block text-sm font-medium text-gray-700 mb-1">
                                        Meta Keywords (comma separated)
                                    </label>
                                    <input
                                        type="text"
                                        id="metaKeywords"
                                        value={formData.metaKeywords || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, metaKeywords: e.target.value }))}
                                        placeholder="keyword1, keyword2, keyword3..."
                                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom save button - ensure inside grid and spanning columns */}
                    <div className="md:col-span-3 flex justify-end">
                        {renderSaveButton()}
                    </div>
                </form>
            )}
        </div>
    );
};

export default PageEditorContent;

