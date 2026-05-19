'use client';

import { Edit, Trash2, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';

import { cmsApi } from '@/lib/api';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import { generateSlug } from '@/lib/utils';
import type { ContentCategory } from '@/types/cms';

/**
 * Category management component
 * For managing content categories
 */
const CategoriesManagement = () => {
    // State for categories list
    const [categories, setCategories] = useState<ContentCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // State for category form
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: ''
    });
    const [formErrors, setFormErrors] = useState({
        name: '',
        slug: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load categories
    useEffect(() => {
        const fetchCategories = async () => {
            setLoading(true);
            try {
                const response = await cmsApi.getCategories({
                    limit: 100,
                    sortBy: 'name',
                    sortOrder: 'asc'
                });

                if (response.data?.status && response.data.data?.categories) {
                    setCategories(response.data.data.categories);
                } else {
                    showErrorToast({
                        title: "Load Failed",
                        description: "Failed to load categories",
                    });
                }
            } catch {
                showErrorToast({
                    title: "Load Failed",
                    description: "Error loading categories",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [refreshKey]);

    // Handle form input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        setFormData(prev => ({ ...prev, [name]: value }));

        // Auto-generate slug if name changes and user is not editing an existing category
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
            errors.name = 'Category name is required';
        }

        if (!formData.slug.trim()) {
            errors.slug = 'Category slug is required';
        } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
            errors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
        }

        // Check for duplicate slugs
        const existingCategory = categories.find(
            cat => cat.slug === formData.slug && cat._id !== editingId
        );

        if (existingCategory) {
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
                // Update existing category
                const response = await cmsApi.updateCategory(editingId, formData);

                if (response.data?.status) {
                    showSuccessToast({
                        title: "Update Successful",
                        description: "Category has been updated",
                    });
                    resetForm();
                    setRefreshKey(prev => prev + 1);
                } else {
                    throw new Error(response.data?.message || 'Failed to update category');
                }
            } else {
                // Create new category
                const response = await cmsApi.createCategory(formData);

                if (response.data?.status) {
                    showSuccessToast({
                        title: "Create Successful",
                        description: "New category has been created",
                    });
                    resetForm();
                    setRefreshKey(prev => prev + 1);
                } else {
                    throw new Error(response.data?.message || 'Failed to create category');
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
            slug: '',
            description: ''
        });
        setFormErrors({
            name: '',
            slug: ''
        });
        setIsEditing(false);
        setEditingId(null);
    };

    // Edit category
    const handleEdit = (category: ContentCategory) => {
        setFormData({
            name: category.name,
            slug: category.slug,
            description: category.description || ''
        });
        setIsEditing(true);
        setEditingId(category._id || null);
    };

    // Delete category
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this category? Any content using this category will be affected.')) {
            return;
        }

        try {
            const response = await cmsApi.deleteCategory(id);

            if (response.data?.status) {
                showSuccessToast({
                    title: "Delete Successful",
                    description: "Category has been deleted",
                });
                setRefreshKey(prev => prev + 1);
            } else {
                throw new Error(response.data?.message || 'Failed to delete category');
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
                <h1 className="text-xl font-semibold">Categories Management</h1>
            </div>

            {/* Form Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium mb-4">
                    {isEditing ? 'Edit Category' : 'Create New Category'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Category Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="e.g. Product Reviews"
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
                            placeholder="e.g. product-reviews"
                        />
                        {formErrors.slug && (
                            <p className="mt-1 text-sm text-red-600">{formErrors.slug}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Used in URLs. Must contain only lowercase letters, numbers, and hyphens.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            placeholder="Optional description of this category"
                        />
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
                                    {isEditing ? 'Update Category' : 'Create Category'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Categories List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium">Categories List</h2>
                </div>

                {loading ? (
                    <div className="p-6 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                        <p className="mt-2 text-gray-500">Loading categories...</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className="text-gray-500">No categories found. Create your first category above.</p>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {categories.map((category) => (
                                    <tr key={category._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{category.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{category.slug}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500 truncate max-w-xs">{category.description || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                                title="Edit category"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => category._id && handleDelete(category._id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete category"
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

export default CategoriesManagement; 