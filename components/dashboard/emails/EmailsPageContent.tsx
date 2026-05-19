"use client";

import { Download, Mail, Search, X, FileText, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import MessagesPageContent from '@/components/dashboard/emails/MessagesPageContent';
import { useEmailList, useContactMessages } from '@/lib/hooks';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import type { EmailItem } from '@/types/api';

// Tab type definition
type EmailTab = 'subscribers' | 'registered' | 'messages';

// Email Filter component
const EmailFilter = ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    onExport
}: {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    onExport: () => void;
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 relative">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Email</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="search"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Search by email address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setSearchTerm('')}
                            >
                                <X className="h-4 w-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="w-full md:w-48">
                    <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
                    <select
                        id="status-filter"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>
                <div className="w-full md:w-auto md:self-end">
                    <div className="flex gap-2">
                        <button
                            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
                            onClick={onExport}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </button>
                        <button
                            className="w-full md:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('');
                            }}
                        >
                            Reset Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main content component
const EmailsPageContent = () => {
    // Active tab state
    const [activeTab, setActiveTab] = useState<EmailTab>('subscribers');

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, _setPageSize] = useState(10);
    const [sortBy, setSortBy] = useState<'email' | 'subscribedAt'>('subscribedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // Add error message state
    const [apiErrorDetails, setApiErrorDetails] = useState<string | null>(null);

    // Only send request after user finishes typing
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Reset page when tab changes
    useEffect(() => {
        setPage(1);
        setSearchTerm('');
        setStatusFilter('');
        setApiErrorDetails(null); // Reset error message
    }, [activeTab]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Get email list data
    const { data: emailsData, isLoading, isError, mutate = () => Promise.resolve() } = useEmailList({
        page,
        limit: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
        search: debouncedSearchTerm,
        is_active: statusFilter ? statusFilter === 'true' : undefined,
        collection: activeTab === 'subscribers' ? 'email_subscription' : 'users'
    });

    // Get messages list data
    const { data: messagesData, isLoading: _isMessagesLoading, isError: _isMessagesError } = useContactMessages({
        page,
        limit: pageSize,
        sort_by: 'createdAt',
        sort_order: sortOrder,
        search: debouncedSearchTerm,
        is_processed: statusFilter ? statusFilter === 'true' : undefined
    });

    // Set detailed error information when an error occurs
    useEffect(() => {
        if (isError) {
            if (isError instanceof Error) {
                setApiErrorDetails(isError.message);
            } else {
                setApiErrorDetails('Failed to fetch email data, please try again later');
            }
        } else {
            setApiErrorDetails(null);
        }
    }, [isError]);

    // Handle sorting
    const handleSort = (field: 'email' | 'subscribedAt') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setPage(newPage);
    };

    // Handle CSV export
    const handleExportCSV = () => {
        // Build export URL with current filters
        let exportUrl = `/api/emails/export?collection=${activeTab === 'subscribers' ? 'email_subscription' : 'users'}`;
        const params = new URLSearchParams();

        if (debouncedSearchTerm) {
            params.append('search', debouncedSearchTerm);
        }

        if (statusFilter) {
            params.append('is_active', statusFilter);
        }

        if (params.toString()) {
            exportUrl += `&${params.toString()}`;
        }

        // Open export link
        window.open(exportUrl, '_blank');

        showSuccessToast({
            title: "Export Started",
            description: "CSV file download has started",
        });
    };

    // update subscription status
    const handleUpdateStatus = async (id: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/emails/${id}/status?collection=${activeTab === 'subscribers' ? 'email_subscription' : 'users'}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isActive }),
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            // Show success message
            showSuccessToast({
                title: "Status Updated",
                description: `Email status has been ${isActive ? 'activated' : 'deactivated'}`,
            });

            // Refresh data
            mutate();
        } catch (error) {
            // Show error message
            showErrorToast({
                title: "Update Failed",
                description: error instanceof Error ? error.message : 'Failed to update status, please try again later',
            });
        }
    };

    // Get sort icon
    const getSortIcon = (field: string) => {
        if (sortBy !== field) {
            return <span className="text-gray-400">⇅</span>;
        }

        return sortOrder === 'asc' ? <span className="text-blue-600">↑</span> : <span className="text-blue-600">↓</span>;
    };

    // Render skeleton loader
    const renderSkeleton = () => (
        <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded w-full mb-4" />
                <div className="h-16 bg-gray-200 rounded w-full mb-2" />
                <div className="h-16 bg-gray-200 rounded w-full mb-2" />
                <div className="h-16 bg-gray-200 rounded w-full mb-2" />
                <div className="h-16 bg-gray-200 rounded w-full mb-2" />
                <div className="h-10 bg-gray-200 rounded w-full mt-4" />
            </div>
        </div>
    );

    // Render detailed error message
    const renderError = () => (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
                <div className="text-red-500 text-xl mb-4">Failed to load email data</div>
                <p className="text-gray-700 mb-6">{apiErrorDetails || 'Please try again later or contact the system administrator'}</p>
                <div className="flex justify-center">
                    <button
                        onClick={() => {
                            setApiErrorDetails(null);
                            mutate();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Retry
                    </button>
                </div>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-700">
                    <h3 className="font-medium mb-2">Debug Information:</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Collection: {activeTab === 'subscribers' ? 'email_subscription' : 'users'}</li>
                        <li>Page: {page}</li>
                        <li>Page Size: {pageSize}</li>
                        <li>Sort Field: {sortBy}</li>
                        <li>Sort Order: {sortOrder}</li>
                        {debouncedSearchTerm && <li>Search Keyword: {debouncedSearchTerm}</li>}
                        {statusFilter && <li>Status Filter: {statusFilter}</li>}
                    </ul>
                </div>
            </div>
        </div>
    );

    // Render email list
    const renderEmailsList = () => {
        const items = emailsData?.items || [];
        const total = emailsData?.total || 0;

        return (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Stats */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="text-sm text-gray-700">
                        Total <span className="font-medium">{total}</span> email{total !== 1 ? 's' : ''}
                        {debouncedSearchTerm && <span>, containing <span className="font-medium">{debouncedSearchTerm}</span> in search results</span>}
                        {statusFilter && <span>, status: <span className="font-medium">{statusFilter === 'true' ? 'Active' : 'Inactive'}</span></span>}
                    </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('email')}
                                >
                                    <div className="flex items-center">
                                        Email Address {getSortIcon('email')}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('subscribedAt')}
                                >
                                    <div className="flex items-center">
                                        {activeTab === 'subscribers' ? 'Subscription Date' : 'Registration Date'} {getSortIcon('subscribedAt')}
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                                        No emails found matching your criteria
                                    </td>
                                </tr>
                            ) : (
                                items.map((item: EmailItem) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <div className="flex items-center">
                                                <Mail className="mr-2 h-4 w-4 text-gray-400" />
                                                {item.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(item.subscribedAt).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleUpdateStatus(item.id, !item.isActive)}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                {item.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden">
                    <div className="divide-y divide-gray-200">
                        {items.length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-500">
                                No emails found matching your criteria
                            </div>
                        ) : (
                            items.map((item: EmailItem) => (
                                <div key={item.id} className="px-4 py-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center">
                                            <Mail className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                                            <div className="text-sm font-medium text-gray-900 truncate flex-1">
                                                {item.email}
                                            </div>
                                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Date: {new Date(item.subscribedAt).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        <div className="mt-2 flex justify-end">
                                            <button
                                                onClick={() => handleUpdateStatus(item.id, !item.isActive)}
                                                className="text-sm text-blue-600 hover:text-blue-900 border border-blue-100 hover:border-blue-200 px-3 py-1 rounded"
                                            >
                                                {item.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${page === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={items.length < pageSize || (page * pageSize >= (emailsData?.total || 0))}
                                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${items.length < pageSize || (page * pageSize >= (emailsData?.total || 0))
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{items.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to <span className="font-medium">{Math.min(page * pageSize, emailsData?.total || 0)}</span> of <span className="font-medium">{emailsData?.total || 0}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${page === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="sr-only">Previous</span>
                                        &larr;
                                    </button>
                                    {/* Simplified page number logic */}
                                    {Array.from({ length: Math.min(5, Math.ceil((emailsData?.total || 0) / pageSize)) }, (_, i) => {
                                        let pageNum = i + 1;

                                        // If current page > 3, adjust visible page range
                                        if (page > 3 && i === 0) {
                                            pageNum = 1;
                                        } else if (page > 3 && i === 1) {
                                            return (
                                                <span
                                                    key="ellipsis-start"
                                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                                >
                                                    ...
                                                </span>
                                            );
                                        } else if (page > 3 && i >= 2) {
                                            pageNum = page + i - 2;
                                        }

                                        // Don't exceed max pages
                                        const maxPage = Math.ceil((emailsData?.total || 0) / pageSize);

                                        if (pageNum > maxPage) {
                                            return null;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handlePageChange(pageNum)}
                                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${page === pageNum
                                                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={items.length < pageSize || (page * pageSize >= (emailsData?.total || 0))}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${items.length < pageSize || (page * pageSize >= (emailsData?.total || 0))
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="sr-only">Next</span>
                                        &rarr;
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 max-w-full">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Email Management</h1>
                <Link
                    href="/dashboard/emails/templates"
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Manage Email Templates
                </Link>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('subscribers')}
                        className={`${activeTab === 'subscribers'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        Subscribers
                    </button>
                    <button
                        onClick={() => setActiveTab('registered')}
                        className={`${activeTab === 'registered'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        Registered Users
                    </button>
                    <button
                        onClick={() => setActiveTab('messages')}
                        className={`${activeTab === 'messages'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message Management
                        {messagesData?.items.some(item => !item.isProcessed) && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                                New
                            </span>
                        )}
                    </button>
                </nav>
            </div>

            {activeTab === 'messages' ? (
                <MessagesPageContent />
            ) : (
                <>
                    <EmailFilter
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        onExport={handleExportCSV}
                    />

                    {isLoading ? (
                        renderSkeleton()
                    ) : isError ? (
                        renderError()
                    ) : (
                        renderEmailsList()
                    )}
                </>
            )}
        </div>
    );
};

export default EmailsPageContent; 