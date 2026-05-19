'use client';

import { Edit, Trash2, Search, Plus, Eye, FileCog, FileText, RefreshCcw, Tag, FolderOpen, FileText as FileTextIcon, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

import CategoriesManagement from '@/components/dashboard/cms/pages/CategoriesManagement';
import TagsManagement from '@/components/dashboard/cms/pages/TagsManagement';
import { cmsApi } from '@/lib/api/cms';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import type { ContentPage, ContentCategory, ContentTag } from '@/types/cms';


/**
 * Content page management component
 */
const CmsPagesContent = () => {
    const _router = useRouter();
    const { data: _session } = useSession();

    // TabsStatus
    const [activeTab, setActiveTab] = useState<'posts' | 'categories' | 'tags'>('posts');

    const [pages, setPages] = useState<ContentPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState('updatedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [refreshKey, setRefreshKey] = useState(0);
    const [availableCategories, setAvailableCategories] = useState<ContentCategory[]>([]);
    const [availableTags, setAvailableTags] = useState<ContentTag[]>([]);

    // Add new status for delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

    // Load page data
    useEffect(() => {
        if (activeTab !== 'posts') return;

        const fetchPages = async () => {
            setLoading(true);
            try {
                // Build query parameters
                const params: Record<string, string | number> = {
                    page: currentPage,
                    limit: 10,
                    sortBy: sortBy,
                    sortOrder: sortOrder
                };

                // Addsearch conditions
                if (search) {
                    params.search = search;
                }

                // Addstatus filtering
                if (statusFilter !== 'all') {
                    params.status = statusFilter;
                }

                const response = await cmsApi.getPages(params);

                if (response.data?.status && response.data?.data) {
                    setPages(response.data.data.pages);
                    setTotalPages(response.data.data.totalPages);
                } else {
                    showErrorToast({
                        title: "Load Failed",
                        description: "Failed to get page list",
                    });
                }
            } catch {
                showErrorToast({
                    title: "Load Failed",
                    description: "Error occurred while getting page list",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPages();
    }, [currentPage, search, statusFilter, sortBy, sortOrder, refreshKey, activeTab]);

    // Load category and tag data
    useEffect(() => {
        if (activeTab !== 'posts') return;

        const fetchCategoriesAndTags = async () => {
            try {
                const [categoriesRes, tagsRes] = await Promise.all([
                    cmsApi.getCategories({
                        limit: 100,
                        sortBy: 'name',
                        sortOrder: 'asc'
                    }),
                    cmsApi.getTags({
                        limit: 100,
                        sortBy: 'name',
                        sortOrder: 'asc'
                    })
                ]);

                if (categoriesRes.data?.status && categoriesRes.data.data?.categories) {
                    setAvailableCategories(categoriesRes.data.data.categories);
                }

                if (tagsRes.data?.status && tagsRes.data.data?.tags) {
                    setAvailableTags(tagsRes.data.data.tags);
                }
            } catch {
                // Silently handle error
            }
        };

        fetchCategoriesAndTags();
    }, [activeTab, refreshKey]);

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page
    };

    // Handle sort change
    const handleSortChange = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    // delete page — now only opens confirm dialog
    const handleDeletePage = (id: string) => {
        setDeletingPageId(id);
        setShowDeleteConfirm(true);
    };

    // confirm page deletion — actually execute delete operation
    const confirmDeletePage = async () => {
        if (!deletingPageId) return;

        try {
            const response = await cmsApi.deletePage(deletingPageId);

            if (response.data?.status) {
                showSuccessToast({
                    title: "Deletion Successful",
                    description: "The blog post has been successfully deleted.",
                });
                // refresh list
                setRefreshKey(prev => prev + 1);
            } else {
                showErrorToast({
                    title: "Deletion Failed",
                    description: response.data?.message || "An error occurred while deleting the blog post.",
                });
            }
        } catch {
            showErrorToast({
                title: "Deletion Failed",
                description: "An error occurred while deleting the blog post.",
            });
        } finally {
            setShowDeleteConfirm(false);
            setDeletingPageId(null);
        }
    };

    // Render status badge
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Published</span>;
            case 'draft':
                return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">Draft</span>;
            case 'archived':
                return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Archived</span>;
            default:
                return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    // Render sort icon
    const renderSortIcon = (field: string) => {
        if (sortBy !== field) return null;

        return sortOrder === 'asc'
            ? <span className="ml-1">↑</span>
            : <span className="ml-1">↓</span>;
    };

    // Format date in English format
    const formatDateInEnglish = (date: Date) => {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    // Render pagination
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        // If insufficient pages, adjust start page
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Addfirst page button
        if (startPage > 1) {
            pages.push(
                <button
                    key="first"
                    onClick={() => setCurrentPage(1)}
                    className="px-3 py-1 rounded text-blue-600 hover:bg-blue-50"
                >
                    1
                </button>
            );

            if (startPage > 2) {
                pages.push(<span key="ellipsis1" className="px-2">...</span>);
            }
        }

        // Addpage number button
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1 rounded ${i === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-600 hover:bg-blue-50'
                        }`}
                >
                    {i}
                </button>
            );
        }

        // Addlast page button
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pages.push(<span key="ellipsis2" className="px-2">...</span>);
            }

            pages.push(
                <button
                    key="last"
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-1 rounded text-blue-600 hover:bg-blue-50"
                >
                    {totalPages}
                </button>
            );
        }

        return (
            <div className="flex justify-center items-center space-x-1 mt-6">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded ${currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:bg-blue-50'
                        }`}
                >
                    Previous
                </button>

                {pages}

                <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded ${currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-blue-600 hover:bg-blue-50'
                        }`}
                >
                    Next
                </button>
            </div>
        );
    };

    // Render tab navigation
    const renderTabsNav = () => (
        <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`${activeTab === 'posts'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    Posts
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`${activeTab === 'categories'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Categories
                </button>
                <button
                    onClick={() => setActiveTab('tags')}
                    className={`${activeTab === 'tags'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                    <Tag className="h-4 w-4 mr-2" />
                    Tags
                </button>
            </nav>
        </div>
    );

    // Get category name by ID
    const getCategoryName = (categoryId: string) => {
        const category = availableCategories.find(cat => cat._id === categoryId);

        return category ? category.name : '';
    };

    // Get tag name by ID
    const getTagName = (tagId: string) => {
        const tag = availableTags.find(tag => tag._id === tagId);

        return tag ? tag.name : '';
    };

    // Render page content
    const renderPostsContent = () => (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Blog Post Management</h1>
                <div className="mt-4 md:mt-0">
                    <Link
                        href="/dashboard/blog/create"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={16} className="mr-2" />
                        Create New Post
                    </Link>
                </div>
            </div>

            {/* Filter and search */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                    <div className="flex-grow">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search posts..."
                                className="pl-10 pr-4 py-2 w-full border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={18} className="text-gray-400" />
                            </div>
                            <button type="submit" className="hidden">Search</button>
                        </form>
                    </div>

                    <div className="flex space-x-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="archived">Archived</option>
                        </select>

                        <button
                            onClick={() => setRefreshKey(prev => prev + 1)}
                            className="px-3 py-2 border rounded-md hover:bg-gray-50"
                            title="Refresh List"
                        >
                            <RefreshCcw size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Page list */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
                        <p className="mt-2 text-gray-500">Loading...</p>
                    </div>
                ) : pages.length === 0 ? (
                    <div className="p-8 text-center">
                        <FileText size={48} className="mx-auto text-gray-300" />
                        <p className="mt-2 text-gray-500">No pages found</p>
                        {(search || statusFilter !== 'all') && (
                            <p className="mt-1 text-sm text-gray-400">
                                Try clearing filters or create a new page
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Featured Image
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            onClick={() => handleSortChange('title')}
                                            className="font-medium flex items-center"
                                        >
                                            Title {renderSortIcon('title')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Categories
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tags
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            onClick={() => handleSortChange('updatedAt')}
                                            className="font-medium flex items-center"
                                        >
                                            Updated At {renderSortIcon('updatedAt')}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pages.map((page) => (
                                    <tr key={page._id} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {page.featuredImage ? (
                                                <div className="h-16 w-24 relative overflow-hidden rounded-md">
                                                    <Image
                                                        src={page.featuredImage}
                                                        alt={page.title}
                                                        width={96}
                                                        height={64}
                                                        className="object-cover h-full w-full"
                                                        unoptimized
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-16 w-24 bg-gray-100 flex items-center justify-center rounded-md">
                                                    <FileText size={24} className="text-gray-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{page.title}</div>
                                            <div className="text-xs text-gray-500 mt-1">/{page.slug}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {page.categories && page.categories.length > 0 ? (
                                                    page.categories.slice(0, 2).map((categoryId) => (
                                                        <span
                                                            key={categoryId}
                                                            className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700"
                                                        >
                                                            {getCategoryName(categoryId)}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-500">-</span>
                                                )}
                                                {page.categories && page.categories.length > 2 && (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                                        +{page.categories.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {page.tags && page.tags.length > 0 ? (
                                                    page.tags.slice(0, 2).map((tagId) => (
                                                        <span
                                                            key={tagId}
                                                            className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700"
                                                        >
                                                            {getTagName(tagId)}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-gray-500">-</span>
                                                )}
                                                {page.tags && page.tags.length > 2 && (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                                                        +{page.tags.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {renderStatusBadge(page.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{formatDateInEnglish(new Date(page.updatedAt))}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex space-x-2">
                                                <Link
                                                    href={`/dashboard/blog/edit/${page._id}`}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Edit post"
                                                >
                                                    <Edit size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDeletePage(page._id as string)}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="Delete post"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <Link
                                                    href={`/blog/${page.slug}${page.status === 'draft' ? '?preview=true' : ''}`}
                                                    target="_blank"
                                                    className="text-green-600 hover:text-green-800"
                                                    title={page.status === 'draft' ? "Preview draft post" : "View published post"}
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <Link
                                                    href={`/dashboard/blog/settings/${page._id}`}
                                                    className="text-gray-600 hover:text-gray-800"
                                                    title="Post settings"
                                                >
                                                    <FileCog size={18} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && pages.length > 0 && renderPagination()}
            </div>
        </>
    );

    return (
        <div className="space-y-6">
            {/* Tab navigation */}
            {renderTabsNav()}

            {/* Show different content based on currently selected tab */}
            {activeTab === 'posts' && renderPostsContent()}
            {activeTab === 'categories' && <CategoriesManagement />}
            {activeTab === 'tags' && <TagsManagement />}

            {/* Delete confirmation dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/35 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                        <div className="flex items-start">
                            <div className="mr-3 flex-shrink-0 bg-red-100 rounded-full p-2">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                                    Confirm Deletion
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Are you sure you want to delete this blog post? This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={confirmDeletePage}
                            >
                                Confirm Delete
                            </button>
                            <button
                                type="button"
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                                onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeletingPageId(null);
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CmsPagesContent; 