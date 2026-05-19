'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
    Button,
    Input,
    Select,
    SelectItem,
    Textarea,
    Card,
    CardHeader,
    CardBody,
    Spinner,
    Autocomplete,
    AutocompleteItem
} from "@heroui/react";
import { X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useActionState, type Key, useRef } from 'react';
import { useFormStatus } from 'react-dom';

// import CMS-specific API client
import { cmsApi } from '@/lib/api/cms';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import type { ContentPage, ContentCategory, ContentTag } from '@/types/cms';

import { updatePageSettingsAction } from './actions';
import SettingsImageUploader from './SettingsImageUploader';

// Type guard to check for object with string _id
function isObjectWithId(item: unknown): item is { _id: string } {
    return typeof item === 'object' &&
        item !== null &&
        Object.prototype.hasOwnProperty.call(item, '_id') &&
        typeof (item as { _id: unknown })._id === 'string';
}

// Page settings component
export default function PageSettingsPage() {
    const params = useParams();
    const router = useRouter();
    const pageId = params.pageId as string;
    const { pending } = useFormStatus();

    const [pageData, setPageData] = useState<ContentPage | null>(null);
    const [categories, setCategories] = useState<ContentCategory[]>([]);
    const [tags, setTags] = useState<ContentTag[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
    const [excerpt, setExcerpt] = useState('');
    const [featuredImage, setFeaturedImage] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [canonicalUrl, setCanonicalUrl] = useState('');
    const [ogImage, setOgImage] = useState('');

    // State for Autocomplete inputs
    const [categorySearch, setCategorySearch] = useState('');
    const [tagSearch, setTagSearch] = useState('');

    // Use useRef to store the current action
    const actionRef = useRef(updatePageSettingsAction.bind(null, pageId, pageData?.slug));

    // Update actionRef when pageId or pageData.slug changes
    useEffect(() => {
        actionRef.current = updatePageSettingsAction.bind(null, pageId, pageData?.slug);
    }, [pageId, pageData?.slug]);

    const [actionState, formAction] = useActionState(actionRef.current, null);

    // Get initial data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [pageRes, catRes, tagRes] = await Promise.all([
                    cmsApi.getPageById(pageId),
                    cmsApi.getCategories({ limit: 1000 }), // Get all categories
                    cmsApi.getTags({ limit: 1000 }) // Get all tags
                ]);

                if (pageRes.data?.status && pageRes.data.data) {
                    setPageData(pageRes.data.data);
                } else {
                    throw new Error(pageRes.data?.message || 'Failed to get page data');
                }

                if (catRes.data?.status && catRes.data.data?.categories) {
                    setCategories(catRes.data.data.categories);
                } else {
                    throw new Error(catRes.data?.message || 'Failed to get category list');
                }

                if (tagRes.data?.status && tagRes.data.data?.tags) {
                    setTags(tagRes.data.data.tags);
                } else {
                    throw new Error(tagRes.data?.message || 'Failed to get tag list');
                }

            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while loading data';

                setError(errorMessage);
                showErrorToast({ title: "Loading Failed", description: errorMessage });
            } finally {
                setIsLoading(false);
            }
        };

        if (pageId) {
            fetchData();
        } else {
            setError('Page ID is undefined');
        }
    }, [pageId]);

    // Initialize form state with fetched data
    useEffect(() => {
        if (pageData) {
            setTitle(pageData.title || '');
            setSlug(pageData.slug || '');
            setStatus(pageData.status || 'draft');
            setExcerpt(pageData.excerpt || '');
            setFeaturedImage(pageData.featuredImage || '');
            setSelectedCategories(
                Array.isArray(pageData.categories)
                    ? pageData.categories.flatMap((c: unknown) => {
                        if (typeof c === 'string') return [c];
                        if (isObjectWithId(c)) return [c._id];

                        return [];
                    })
                    : []
            );
            setSelectedTags(
                Array.isArray(pageData.tags)
                    ? pageData.tags.flatMap((t: unknown) => {
                        if (typeof t === 'string') return [t];
                        if (isObjectWithId(t)) return [t._id];

                        return [];
                    })
                    : []
            );
            setMetaTitle(pageData.seoData?.metaTitle || '');
            setMetaDescription(pageData.seoData?.metaDescription || '');
            setCanonicalUrl(pageData.seoData?.canonicalUrl || '');
            setOgImage(pageData.seoData?.ogImage || '');
        }
    }, [pageData]);

    // Handle Action result
    useEffect(() => {
        if (actionState?.success) {
            showSuccessToast({ title: 'Save Successful', description: 'Page settings have been updated' });
            router.push('/dashboard/cms/pages');
        } else if (actionState?.error) {
            showErrorToast({ title: 'Save Failed', description: actionState.error });
        }
    }, [actionState, router]);

    const validateAndSubmit = async (formData: FormData) => {
        try {
            formAction(formData);
        } catch (err) {
            showErrorToast({
                title: 'Submission Error',
                description: err instanceof Error ? err.message : 'Unknown error during form submission'
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner size="lg" color="primary" />
                <p className="ml-3 text-gray-600">Loading page settings...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center text-red-700 bg-red-100 rounded-lg shadow-md max-w-md mx-auto mt-10">
                <p className="font-semibold mb-2">Failed to load page settings</p>
                <p className="text-sm mb-4">{error}</p>
                <Button
                    color="danger"
                    variant="bordered"
                    onClick={() => router.push('/dashboard/cms/pages')}
                    startContent={<ArrowLeftIcon className="h-4 w-4" />}
                >
                    Back to List
                </Button>
            </div>
        );
    }

    if (!pageData) {
        return (
            <div className="p-6 text-center text-gray-500">
                <p>Page data not found.</p>
            </div>
        );
    }

    return (
        <form action={validateAndSubmit} className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Page Settings: {pageData?.title}</h1>
                <Button
                    variant="light"
                    onClick={() => router.push('/dashboard/cms/pages')}
                    startContent={<ArrowLeftIcon className="h-5 w-5" />}
                >
                    Back to List
                </Button>
            </div>

            <Card shadow="sm">
                <CardHeader className="border-b border-gray-200 px-6 py-4">
                    <h3 className="text-xl font-semibold text-gray-800">Basic Information</h3>
                    <p className="text-sm text-gray-500 mt-1">Modify the basic properties of the page.</p>
                </CardHeader>
                <CardBody className="space-y-5 p-6">
                    <Input
                        id="title"
                        name="title"
                        label="Title"
                        labelPlacement="outside-left"
                        placeholder="Enter the main title of the page"
                        classNames={{
                            label: "mb-1",
                            inputWrapper: "bg-transparent shadow-none",
                            input: "focus:outline-none"
                        }}
                        value={title}
                        onValueChange={setTitle}
                        isRequired
                        fullWidth
                        variant="flat"
                    />
                    <Input
                        id="slug"
                        name="slug"
                        label="URL Path"
                        labelPlacement="outside-left"
                        placeholder="unique-url-path"
                        classNames={{
                            label: "mb-1",
                            inputWrapper: "bg-transparent shadow-none",
                            input: "focus:outline-none"
                        }}
                        value={slug}
                        onValueChange={setSlug}
                        description={`Public access path: /blog/${slug}`}
                        isRequired
                        fullWidth
                        variant="flat"
                    />
                    <Select
                        id="status"
                        name="status"
                        label="Status"
                        labelPlacement="outside-left"
                        placeholder="Select page status"
                        classNames={{
                            label: "mb-1",
                            trigger: "bg-transparent shadow-none border-none focus:outline-none",
                            value: "text-foreground"
                        }}
                        selectedKeys={[status]}
                        onSelectionChange={(keys) => setStatus(Array.from(keys)[0] as 'draft' | 'published' | 'archived')}
                        isRequired
                        variant="flat"
                    >
                        <SelectItem key="draft">Draft</SelectItem>
                        <SelectItem key="published">Published</SelectItem>
                        <SelectItem key="archived">Archived</SelectItem>
                    </Select>
                    <Textarea
                        id="excerpt"
                        name="excerpt"
                        label="Excerpt"
                        labelPlacement="outside-left"
                        classNames={{
                            label: "mb-1",
                            inputWrapper: "bg-transparent shadow-none",
                            input: "focus:outline-none"
                        }}
                        value={excerpt}
                        onValueChange={setExcerpt}
                        placeholder="A short description of the page for previews and SEO..."
                        fullWidth
                        variant="flat"
                        minRows={3}
                    />
                    <div className="flex items-center gap-2">
                        <Input
                            id="featuredImage"
                            name="featuredImage"
                            label="Featured Image URL"
                            labelPlacement="outside-left"
                            classNames={{
                                label: "mb-1",
                                inputWrapper: "bg-transparent shadow-none",
                                input: "focus:outline-none"
                            }}
                            value={featuredImage}
                            onValueChange={setFeaturedImage}
                            placeholder="https://example.com/image.jpg"
                            fullWidth
                            variant="flat"
                        />
                        <div className="w-40 flex-shrink-0">
                            <SettingsImageUploader
                                currentImageUrl={featuredImage}
                                onImageUploaded={setFeaturedImage}
                                label="Featured Image"
                                id="featured-image-uploader"
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card shadow="sm">
                <CardHeader className="border-b border-gray-200 px-6 py-4">
                    <h3 className="text-xl font-semibold text-gray-800">Categories & Tags</h3>
                    <p className="text-sm text-gray-500 mt-1">Manage page categories and tags.</p>
                </CardHeader>
                <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
                    <div className="space-y-3">
                        <Autocomplete
                            label="Categories"
                            labelPlacement="outside-left"
                            placeholder="Search or select categories"
                            items={categories}
                            inputValue={categorySearch}
                            onInputChange={setCategorySearch}
                            onSelectionChange={(key: Key | null) => {
                                if (key && typeof key === 'string' && !selectedCategories.includes(key)) {
                                    setSelectedCategories(prev => [...prev, key]);
                                }
                                setCategorySearch('');
                            }}
                            allowsCustomValue={false}
                            variant="flat"
                            classNames={{
                                base: "focus:outline-none",
                                listboxWrapper: "focus:outline-none",
                                popoverContent: "focus:outline-none"
                            }}
                        >
                            {(item) => (
                                <AutocompleteItem key={item._id || ''} textValue={item.name}>
                                    {item.name}
                                </AutocompleteItem>
                            )}
                        </Autocomplete>
                        <div className="flex flex-wrap gap-2 mt-2 min-h-[40px]">
                            {selectedCategories.map((categoryId) => {
                                const category = categories.find(c => c._id === categoryId);

                                return category ? (
                                    <div key={categoryId} className="relative flex items-center bg-primary text-white rounded-md pr-8 pl-3 py-1.5 mr-1 mb-1 text-sm">
                                        <span className="truncate max-w-[100px] inline-block" title={category.name}>{category.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedCategories(selectedCategories.filter(id => id !== categoryId))}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 hover:scale-110 transition-all"
                                            aria-label={`Remove ${category.name} category`}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : null;
                            })}
                        </div>
                        {selectedCategories.map(catId => (
                            <input type="hidden" name="categories" value={catId} key={`cat-hidden-${catId}`} />
                        ))}
                    </div>

                    <div className="space-y-3">
                        <Autocomplete
                            label="Tags"
                            labelPlacement="outside-left"
                            placeholder="Search or select tags"
                            items={tags}
                            inputValue={tagSearch}
                            onInputChange={setTagSearch}
                            onSelectionChange={(key: Key | null) => {
                                if (key && typeof key === 'string' && !selectedTags.includes(key)) {
                                    setSelectedTags(prev => [...prev, key]);
                                }
                                setTagSearch('');
                            }}
                            allowsCustomValue={false}
                            variant="flat"
                            classNames={{
                                base: "focus:outline-none",
                                listboxWrapper: "focus:outline-none",
                                popoverContent: "focus:outline-none"
                            }}
                        >
                            {(item) => (
                                <AutocompleteItem key={item._id || ''} textValue={item.name}>
                                    {item.name}
                                </AutocompleteItem>
                            )}
                        </Autocomplete>
                        <div className="flex flex-wrap gap-2 mt-2 min-h-[40px]">
                            {selectedTags.map((tagId) => {
                                const tag = tags.find(t => t._id === tagId);

                                return tag ? (
                                    <div key={tagId} className="relative flex items-center bg-secondary text-white rounded-md pr-8 pl-3 py-1.5 mr-1 mb-1 text-sm">
                                        <span className="truncate max-w-[100px] inline-block" title={tag.name}>{tag.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedTags(selectedTags.filter(id => id !== tagId))}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 hover:scale-110 transition-all"
                                            aria-label={`Remove ${tag.name} tag`}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : null;
                            })}
                        </div>
                        {selectedTags.map(tagId => (
                            <input type="hidden" name="tags" value={tagId} key={`tag-hidden-${tagId}`} />
                        ))}
                    </div>
                </CardBody>
            </Card>

            <Card shadow="sm">
                <CardHeader className="border-b border-gray-200 px-6 py-4">
                    <h3 className="text-xl font-semibold text-gray-800">SEO Settings</h3>
                    <p className="text-sm text-gray-500 mt-1">Optimize page performance in search engines.</p>
                </CardHeader>
                <CardBody className="space-y-5 p-6">
                    <Input
                        id="metaTitle"
                        name="metaTitle"
                        label="Meta Title"
                        labelPlacement="outside-left"
                        classNames={{
                            label: "mb-1",
                            inputWrapper: "bg-transparent shadow-none",
                            input: "focus:outline-none"
                        }}
                        value={metaTitle}
                        onValueChange={setMetaTitle}
                        placeholder="Title displayed in search engine results (recommend 60 chars)"
                        fullWidth
                        variant="flat"
                    />
                    <Textarea
                        id="metaDescription"
                        name="metaDescription"
                        label="Meta Description"
                        labelPlacement="outside-left"
                        classNames={{
                            label: "mb-1",
                            inputWrapper: "bg-transparent shadow-none",
                            input: "focus:outline-none"
                        }}
                        value={metaDescription}
                        onValueChange={setMetaDescription}
                        placeholder="Short SEO description of the page (recommend 160 chars)"
                        fullWidth
                        variant="flat"
                        minRows={2}
                    />
                    <Input
                        id="canonicalUrl"
                        name="canonicalUrl"
                        label="Canonical URL"
                        type="url"
                        labelPlacement="outside-left"
                        classNames={{
                            label: "mb-1",
                            inputWrapper: "bg-transparent shadow-none",
                            input: "focus:outline-none"
                        }}
                        value={canonicalUrl}
                        onValueChange={setCanonicalUrl}
                        placeholder="https://example.com/preferred-url (if content is duplicated)"
                        fullWidth
                        variant="flat"
                    />
                    <div className="flex items-center gap-2">
                        <Input
                            id="ogImage"
                            name="ogImage"
                            label=" Sharing Image URL"
                            type="url"
                            labelPlacement="outside-left"
                            classNames={{
                                label: "mb-1",
                                inputWrapper: "bg-transparent shadow-none",
                                input: "focus:outline-none"
                            }}
                            value={ogImage}
                            onValueChange={setOgImage}
                            placeholder="Image URL displayed when sharing on social media"
                            fullWidth
                            variant="flat"
                        />
                        <div className="w-40 flex-shrink-0">
                            <SettingsImageUploader
                                currentImageUrl={ogImage}
                                onImageUploaded={setOgImage}
                                label="Social Sharing Image"
                                id="og-image-uploader"
                            />
                        </div>
                    </div>
                </CardBody>
            </Card>

            <Card shadow="sm">
                <CardBody className="flex flex-col md:flex-row justify-between items-center p-6 gap-4">
                    <div className="text-sm text-gray-600 space-y-1 text-center md:text-left">
                        <p>Created: {pageData.createdAt ? new Date(pageData.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</p>
                        <p>Last Updated: {pageData.updatedAt ? new Date(pageData.updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</p>
                    </div>
                    <Button
                        type="submit"
                        color="primary"
                        size="lg"
                        isLoading={pending}
                        isDisabled={pending}
                        className="w-full md:w-auto"
                    >
                        {pending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardBody>
            </Card>

            {actionState?.error && (
                <p className="text-sm text-red-600 mt-4 text-center">{actionState.error}</p>
            )}
            {actionState?.success && !actionState.error && (
                <p className="text-sm text-green-600 mt-4 text-center">Page settings saved successfully!</p>
            )}
        </form>
    );
} 
