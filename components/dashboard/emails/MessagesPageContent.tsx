'use client';

import { Download, MessageSquare, Search, X, Trash2, Eye, CheckCircle, XCircle, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';

import { useContactMessages } from '@/lib/hooks';
import { showErrorToast, showSuccessToast } from '@/lib/toast';
import type { ContactMessage } from '@/types/api';

// Tab type definition
type MessageTab = 'all' | 'pending' | 'contact' | 'general' | 'blog';

// Message Detail Dialog component
const MessageDetailDialog = ({
    message,
    isOpen,
    onClose
}: {
    message: ContactMessage | null;
    isOpen: boolean;
    onClose: () => void;
}) => {
    if (!isOpen || !message) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Message Details</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Basic Information</h4>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <p><span className="font-medium">Name: </span>{message.name}</p>
                                <p><span className="font-medium">Email: </span>{message.email}</p>
                                {message.phone && <p><span className="font-medium">Phone: </span>{message.phone}</p>}
                                <p><span className="font-medium">Date: </span>
                                    {new Date(message.createdAt).toLocaleString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </p>
                                <p><span className="font-medium">Status: </span>
                                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${message.isProcessed
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {message.isProcessed ? 'Processed' : 'Pending'}
                                    </span>
                                </p>
                                {message.processedAt && (
                                    <p><span className="font-medium">Processed Date: </span>
                                        {new Date(message.processedAt).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-sm font-medium text-gray-500 mb-1">Message Content</h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="whitespace-pre-wrap">{message.message}</p>
                            </div>
                        </div>

                        {message.notes && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-1">Processing Notes</h4>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="whitespace-pre-wrap">{message.notes}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Message Status Dialog component
const MessageStatusDialog = ({
    message,
    isOpen,
    onClose,
    onUpdate
}: {
    message: ContactMessage | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (id: string, isProcessed: boolean, notes: string) => Promise<void>;
}) => {
    const [isProcessed, setIsProcessed] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (message) {
            setIsProcessed(message.isProcessed);
            setNotes(message.notes || '');
        }
    }, [message]);

    if (!isOpen || !message) {
        return null;
    }

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onUpdate(message.id, isProcessed, notes);
            onClose();
        } catch {
            // Error is handled in the parent component
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Update Message Status</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500"
                        disabled={isSubmitting}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Processing Status</label>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setIsProcessed(true)}
                                className={`flex items-center px-3 py-2 rounded-md ${isProcessed
                                    ? 'bg-green-100 text-green-800 border-2 border-green-500'
                                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                                    }`}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Processed
                            </button>
                            <button
                                onClick={() => setIsProcessed(false)}
                                className={`flex items-center px-3 py-2 rounded-md ${!isProcessed
                                    ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-500'
                                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                                    }`}
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Pending
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Processing Notes</label>
                        <textarea
                            id="notes"
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add processing notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                Updating...
                            </>
                        ) : (
                            'Update Status'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Message Filter component
const MessageFilter = ({
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
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Messages</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            id="search"
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Search by name, email, or message content..."
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
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Processing Status</label>
                    <select
                        id="status"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="true">Processed</option>
                        <option value="false">Pending</option>
                    </select>
                </div>
                <div className="w-full md:w-auto flex items-end">
                    <button
                        onClick={onExport}
                        className="w-full md:w-auto px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </button>
                </div>
            </div>
        </div>
    );
};

// Main content component
const MessagesPageContent = () => {
    // Add tab state
    const [activeTab, setActiveTab] = useState<MessageTab>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, _setPageSize] = useState(10);
    const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'email'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [apiErrorDetails, setApiErrorDetails] = useState<string | null>(null);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Reset page and filters when tab changes
    useEffect(() => {
        setPage(1);
        setSearchTerm('');
        setStatusFilter('');
        setApiErrorDetails(null);
    }, [activeTab]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Build API parameters
    const getApiParams = () => {
        const params: Record<string, string | number | boolean | object | undefined> = {
            page,
            limit: pageSize,
            sort_by: sortBy,
            sort_order: sortOrder,
            search: debouncedSearchTerm
        };

        // Handle status filtering
        if (activeTab === 'pending') {
            params.is_processed = false;
        } else if (statusFilter) {
            params.is_processed = statusFilter === 'true';
        }

        // Handle source filtering
        if (activeTab === 'contact') {
            params.formSource = { $exists: false }; // Entries without formSource field are contact forms
        } else if (activeTab === 'general') {
            params.formSource = 'general'; // General product email subscription
        } else if (activeTab === 'blog') {
            params.formSource = 'blog'; // Blog content email subscription
        }

        return params;
    };

    // Get messages list data with tab filter
    const { data: messagesData, isLoading, isError, mutate = () => Promise.resolve() } = useContactMessages(getApiParams());

    // Set error details when error occurs
    useEffect(() => {
        if (isError) {
            if (isError instanceof Error) {
                setApiErrorDetails(isError.message);
            } else {
                setApiErrorDetails('Failed to load messages, please try again later or contact the system administrator');
            }
        } else {
            setApiErrorDetails(null);
        }
    }, [isError]);

    // Handle sorting
    const handleSort = (field: 'createdAt' | 'name' | 'email') => {
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

    // Get current tab name
    const getTabName = () => {
        switch (activeTab) {
            case 'all': return 'All Messages';
            case 'pending': return 'Pending Messages';
            case 'contact': return 'Contact Form Messages';
            case 'general': return 'Product Newsletter Subscriptions';
            case 'blog': return 'Blog Newsletter Subscriptions';
            default: return 'Messages';
        }
    };

    // Handle CSV export
    const handleExportCSV = () => {
        // Build export URL with current filters
        let exportUrl = '/api/contact/export';
        const params = new URLSearchParams();

        if (debouncedSearchTerm) {
            params.append('search', debouncedSearchTerm);
        }

        if (statusFilter) {
            params.append('is_processed', statusFilter);
        }

        // Addsource filter parameter
        if (activeTab === 'contact') {
            params.append('form_type', 'contact');
        } else if (activeTab === 'general') {
            params.append('form_source', 'general');
        } else if (activeTab === 'blog') {
            params.append('form_source', 'blog');
        }

        if (params.toString()) {
            exportUrl += `?${params.toString()}`;
        }

        // Open export link
        window.open(exportUrl, '_blank');

        showSuccessToast({
            title: "Export Started",
            description: "CSV file download has started",
        });
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

    // Render error message
    const renderError = () => (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
                <div className="text-red-500 text-xl mb-4">Failed to load messages</div>
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
                        <li>Page: {page}</li>
                        <li>Page Size: {pageSize}</li>
                        <li>Sort Field: {sortBy}</li>
                        <li>Sort Direction: {sortOrder}</li>
                        {debouncedSearchTerm && <li>Search Term: {debouncedSearchTerm}</li>}
                        {statusFilter && <li>Status Filter: {statusFilter === 'true' ? 'Processed' : 'Pending'}</li>}
                    </ul>
                </div>
            </div>
        </div>
    );

    // Render message list
    const renderMessagesList = () => {
        const items = messagesData?.items || [];
        const total = messagesData?.total || 0;

        return (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Stats */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="text-sm text-gray-700">
                        Total <span className="font-medium">{total}</span> {getTabName().toLowerCase()}
                        {debouncedSearchTerm && <span>, search results for <span className="font-medium">{debouncedSearchTerm}</span></span>}
                        {statusFilter && <span>, status: <span className="font-medium">{statusFilter === 'true' ? 'Processed' : 'Pending'}</span></span>}
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
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center">
                                        Name {getSortIcon('name')}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('email')}
                                >
                                    <div className="flex items-center">
                                        Email {getSortIcon('email')}
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <div className="flex items-center">
                                        Date {getSortIcon('createdAt')}
                                    </div>
                                </th>
                                {/* Source column — shown only on the 'All' tab */}
                                {activeTab === 'all' && (
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Source
                                    </th>
                                )}
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
                                    <td colSpan={activeTab === 'all' ? 6 : 5} className="px-6 py-4 text-center text-gray-500">
                                        No messages found
                                    </td>
                                </tr>
                            ) : (
                                items.map((item: ContactMessage) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            <div className="flex items-center">
                                                {item.formSource ?
                                                    <Mail className="mr-2 h-4 w-4 text-gray-400" /> :
                                                    <MessageSquare className="mr-2 h-4 w-4 text-gray-400" />
                                                }
                                                {item.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {item.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(item.createdAt).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        {/* Source column — shown only on the 'All' tab */}
                                        {activeTab === 'all' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {!item.formSource ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        Contact Form
                                                    </span>
                                                ) : item.formSource === 'general' ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Product Newsletter
                                                    </span>
                                                ) : item.formSource === 'blog' ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        Blog Newsletter
                                                    </span>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        {item.formSource}
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isProcessed
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {item.isProcessed ? 'Processed' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setSelectedMessage(item);
                                                    setIsDetailOpen(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedMessage(item);
                                                    setIsStatusOpen(true);
                                                }}
                                                className="text-green-600 hover:text-green-900 mr-4"
                                            >
                                                <CheckCircle className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMessage(item.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="h-4 w-4" />
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
                                No messages found
                            </div>
                        ) : (
                            items.map((item: ContactMessage) => (
                                <div key={item.id} className="px-4 py-4">
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                {item.formSource ?
                                                    <Mail className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" /> :
                                                    <MessageSquare className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                                                }
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.name}
                                                </div>
                                            </div>
                                            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isProcessed
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {item.isProcessed ? 'Processed' : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Email: {item.email}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Date: {new Date(item.createdAt).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                        {/* Source row — shown only on the 'All' tab */}
                                        {activeTab === 'all' && (
                                            <div className="text-sm text-gray-500">
                                                Source: {!item.formSource ? 'Contact Form' :
                                                    item.formSource === 'general' ? 'Product Newsletter' :
                                                        item.formSource === 'blog' ? 'Blog Newsletter' :
                                                            item.formSource}
                                            </div>
                                        )}
                                        <div className="mt-2 flex justify-end space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedMessage(item);
                                                    setIsDetailOpen(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-900 p-1"
                                            >
                                                <Eye className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedMessage(item);
                                                    setIsStatusOpen(true);
                                                }}
                                                className="text-green-600 hover:text-green-900 p-1"
                                            >
                                                <CheckCircle className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteMessage(item.id)}
                                                className="text-red-600 hover:text-red-900 p-1"
                                            >
                                                <Trash2 className="h-5 w-5" />
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
                                disabled={items.length < pageSize || (page * pageSize >= (messagesData?.total || 0))}
                                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${items.length < pageSize || (page * pageSize >= (messagesData?.total || 0))
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
                                    Showing <span className="font-medium">{items.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to <span className="font-medium">{Math.min(page * pageSize, messagesData?.total || 0)}</span> of <span className="font-medium">{messagesData?.total || 0}</span> results
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
                                    {Array.from({ length: Math.min(5, Math.ceil((messagesData?.total || 0) / pageSize)) }, (_, i) => {
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
                                        const maxPage = Math.ceil((messagesData?.total || 0) / pageSize);

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
                                        disabled={items.length < pageSize || (page * pageSize >= (messagesData?.total || 0))}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${items.length < pageSize || (page * pageSize >= (messagesData?.total || 0))
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

    // Handle delete message
    const handleDeleteMessage = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/contact/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Delete failed');
            }

            showSuccessToast({
                title: "Delete Successful",
                description: "The message has been deleted",
            });
            mutate();
        } catch (error) {
            showErrorToast({
                title: "Delete Failed",
                description: error instanceof Error ? error.message : 'Failed to delete message, please try again later',
            });
        }
    };

    // Handle status update
    const handleUpdateStatus = async (id: string, isProcessed: boolean, notes: string) => {
        try {
            const response = await fetch(`/api/contact/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isProcessed, notes }),
            });

            if (!response.ok) {
                throw new Error('Update failed');
            }

            showSuccessToast({
                title: "Update Success",
                description: `Message status has been updated to ${isProcessed ? 'Processed' : 'Pending'}`,
            });

            mutate();
        } catch (error) {
            showErrorToast({
                title: "Update Failed",
                description: error instanceof Error ? error.message : 'Failed to update status, please try again later',
            });
        }
    };

    return (
        <div className="space-y-6 max-w-full">

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex flex-wrap gap-2" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`${activeTab === 'all'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        All Messages
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`${activeTab === 'pending'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        Pending
                        {messagesData?.items.some(item => !item.isProcessed) && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                                New
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('contact')}
                        className={`${activeTab === 'contact'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Contact Form
                    </button>
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`${activeTab === 'general'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <Mail className="w-4 h-4 mr-1" />
                        Product Subscriptions
                    </button>
                    <button
                        onClick={() => setActiveTab('blog')}
                        className={`${activeTab === 'blog'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                    >
                        <Mail className="w-4 h-4 mr-1" />
                        Blog Subscriptions
                    </button>
                </nav>
            </div>

            <MessageFilter
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
                renderMessagesList()
            )}

            <MessageDetailDialog
                message={selectedMessage}
                isOpen={isDetailOpen}
                onClose={() => {
                    setSelectedMessage(null);
                    setIsDetailOpen(false);
                }}
            />

            <MessageStatusDialog
                message={selectedMessage}
                isOpen={isStatusOpen}
                onClose={() => {
                    setSelectedMessage(null);
                    setIsStatusOpen(false);
                }}
                onUpdate={handleUpdateStatus}
            />
        </div>
    );
};

export default MessagesPageContent;
