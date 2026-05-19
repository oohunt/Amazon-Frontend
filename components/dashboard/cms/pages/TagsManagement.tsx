'use client';

import { Edit, Trash2, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';

import { cmsApi } from '@/lib/api';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { generateSlug } from '@/lib/utils';
import type { ContentTag } from '@/types/cms';

/**
 * Tag management component
 * For managing content tags
 */
const TagsManagement = () => {
    // State for tags list
    const [tags, setTags] = useState<ContentTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // State for tag form
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: ''
    });
    const [formErrors, setFormErrors] = useState({
        name: '',
        slug: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load tags
    useEffect(() => {
        const fetchTags = async () => {
            setLoading(true);
            try {
                const response = await cmsApi.getTags({
                    limit: 100,
                    sortBy: 'name',
                    sortOrder: 'asc'
                });

                if (response.data?.status && response.data.data?.tags) {
                    setTags(response.data.data.tags);
                } else {
                    showErrorToast({
                        title: "Load Failed",
                        description: "Failed to load tags",
                    });
                }
            } catch {
                showErrorToast({
                    title: "Load Failed",
                    description: "Error loading tags",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchTags();
    }, [refreshKey]);

    // Handle form input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-generate slug if name changes and user is not editing an existing tag
        if (name === 'name' && !isEditing) {
            setFormData(prev => ({
                ...prev,
                slug: generateSlug(value)
            }));
        }

        // Clear errors
        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Validate form
    const validateForm = () => {
        const errors = {
            name: '',
            slug: ''
        };

        if (!formData.name.trim()) {
            errors.name = 'Tag name is required';
        }

        if (!formData.slug.trim()) {
            errors.slug = 'Tag slug is required';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
        }

        // Check for duplicate slugs
        const existingTag = tags.find(
            tag => tag.slug === formData.slug && tag._id !== editingId
        );

        if (existingTag) {
            errors.slug = 'This slug is already in use';
        }

        setFormErrors(errors);

        return !errors.name && !errors.slug;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditing && editingId) {
                // Update existing tag
                const response = await cmsApi.updateTag(editingId, formData);

                if (response.data?.status) {
                    showSuccessToast({
                        title: "Update Successful",
                        description: "Tag has been updated",
                    });
                    resetForm();
                    setRefreshKey(prev => prev + 1);
                } else {
                    throw new Error(response.data?.message || 'Failed to update tag');
                }
            } else {
                // Create new tag
                const response = await cmsApi.createTag(formData);

                if (response.data?.status) {
                    showSuccessToast({
                        title: "Create Successful",
                        description: "New tag has been created",
                    });
                    resetForm();
                    setRefreshKey(prev => prev + 1);
                } else {
                    throw new Error(response.data?.message || 'Failed to create tag');
                }
            }
        } catch (error) {
            showErrorToast({
                title: "Action Failed",
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset form state
    const resetForm = () => {
        setFormData({
            name: '',
            slug: ''
        });
        setFormErrors({
            name: '',
            slug: ''
        });
        setIsEditing(false);
        setEditingId(null);
    };

    // Edit tag
    const handleEdit = (tag: ContentTag) => {
        setFormData({
            name: tag.name,
            slug: tag.slug
        });
        setIsEditing(true);
        setEditingId(tag._id || null);
    };

    // Delete tag
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this tag? Any content using this tag will be affected.')) {
            return;
        }

        try {
            const response = await cmsApi.deleteTag(id);

            if (response.data?.status) {
                showSuccessToast({
                    title: "Delete Successful",
                    description: "Tag has been deleted",
                });
                setRefreshKey(prev => prev + 1);
            } else {
                throw new Error(response.data?.message || 'Failed to delete tag');
            }
        } catch (error) {
            showErrorToast({
                title: "Delete Failed",
                description: error instanceof Error ? error.message : 'An unknown error occurred',
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold">Tags Management</h1>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium mb-4">
                    {isEditing ? 'Edit Tag' : 'Create New Tag'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Tag Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="e.g. Deals"
                        />
                        {formErrors.name && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                            URL Slug <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="slug"
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.slug ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="e.g. deals"
                        />
                        {formErrors.slug && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.slug}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Used in URLs. Must contain only lowercase letters, numbers, and hyphens.
                        </p>
                    </div>

                    <div className="flex justify-end space-x-3">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                disabled={isSubmitting}
                            >
                                <X className="w-4 h-4 mr-1 inline" />
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    {isEditing ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-1" />
                                    {isEditing ? 'Update Tag' : 'Create Tag'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Tags List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium">Tags List</h2>
                </div>

                {loading ? (
                    <div className="p-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                        <p className="mt-2 text-gray-500">Loading tags...</p>
                    </div>
                ) : tags.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-gray-500">No tags found. Create your first tag above.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Slug
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tags.map((tag) => (
                                    <tr key={tag._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{tag.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{tag.slug}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(tag)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                                title="Edit tag"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => tag._id && handleDelete(tag._id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete tag"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TagsManagement; 