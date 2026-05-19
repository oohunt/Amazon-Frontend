'use client';

import { AnimatePresence, motion } from 'framer-motion';
import debounce from 'lodash/debounce';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FaTrash, FaSearch, FaSort, FaSortUp, FaSortDown, FaTimes, FaChevronDown, FaChevronUp, FaEdit } from 'react-icons/fa';

import { productsApi } from '@/lib/api';
import { useProducts, useProductSearch } from '@/lib/hooks';
import { UserRole } from '@/lib/models/UserRole';
import type { Product } from '@/types/api';

const SKELETON_KEYS = ['sk1', 'sk2', 'sk3', 'sk4', 'sk5'];

const ProductsPageContent = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [renderedRowCount, setRenderedRowCount] = useState(100); // Change initial render row count to 100
    const [error, setError] = useState<string | null>(null);
    const [screenSize, setScreenSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('xl');
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const tableRef = useRef<HTMLDivElement>(null);
    const rowObserverRef = useRef<IntersectionObserver | null>(null);
    const lastRowRef = useRef<HTMLTableRowElement | null>(null);

    // Add new variables for batch loading
    const [batchLoading, setBatchLoading] = useState(false); // Whether next batch is loading
    const [_loadedBatches, setLoadedBatches] = useState(1); // Loaded batches
    const [allBatchesLoaded, setAllBatchesLoaded] = useState(false); // Whether all batches have been loaded
    const [batchedProducts, setBatchedProducts] = useState<Product[]>([]); // Combined product list from all batches

    // Add new status variable
    const [searchMode, setSearchMode] = useState<'browse' | 'search'>('browse');
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
    const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
    const [minDiscount, setMinDiscount] = useState<number | undefined>(undefined);
    const [isPrimeOnly, setIsPrimeOnly] = useState<boolean | undefined>(undefined);
    const [apiProvider, setApiProvider] = useState<string | undefined>(undefined);
    const [searchParams, setSearchParams] = useState({
        keyword: '',
        page: 1,
        page_size: 100, // Fixed at 100
        sort_by: sortField as 'relevance' | 'price' | 'discount' | 'created' | undefined,
        sort_order: 'desc' as 'asc' | 'desc',
        min_price: undefined as number | undefined,
        max_price: undefined as number | undefined,
        min_discount: undefined as number | undefined,
        is_prime_only: undefined as boolean | undefined,
        product_groups: undefined as string | undefined,
        brands: undefined as string | undefined,
        api_provider: apiProvider,
    });

    // create a debounced search function
    const debouncedSearchRef = useRef(
        debounce((term: string, currentKeyword: string, setParams: React.Dispatch<React.SetStateAction<typeof searchParams>>, setPage: React.Dispatch<React.SetStateAction<number>>, setMode: React.Dispatch<React.SetStateAction<'browse' | 'search'>>) => {
            if (term.trim() && term.trim() !== currentKeyword) {
                setParams(prev => ({ ...prev, keyword: term.trim(), page: 1 }));
                setPage(1); // Reset page number
                setMode('search');
            } else if (!term.trim()) {
                setMode('browse');
            }
        }, 500)
    );

    // Wrap function to correctly pass current parameters
    const handleSearch = useCallback((term: string) => {
        debouncedSearchRef.current(term, searchParams.keyword, setSearchParams, setCurrentPage, setSearchMode);
    }, [searchParams.keyword]);

    // Use hooks to load data
    // Browse mode — use original useProducts hook but always limit to max 100 per request
    const { data: productsData, isLoading: browseLoading, mutate: mutateBrowseData } = useProducts({
        page: currentPage,
        limit: 100, // Always set to 100 regardless of itemsPerPage
        api_provider: apiProvider,
        sort_by: sortField as 'price' | 'discount' | 'created' | 'all' | undefined,
        sort_order: sortDirection
    });

    // Search mode — use new useProductSearch hook, also limit to max 100 per request
    const { data: searchData, isLoading: searchLoading, mutate: mutateSearchData } = useProductSearch(
        searchMode === 'search' ? { ...searchParams, page_size: 100 } : { keyword: '' }
    );

    // Determine which data source to use
    const loading = searchMode === 'search' ? searchLoading : browseLoading;
    const initialProducts = useMemo(() =>
        searchMode === 'search'
            ? (searchData?.items || [])
            : (productsData?.items || [])
        , [searchMode, searchData?.items, productsData?.items]);
    const products = batchedProducts.length > 0
        ? batchedProducts
        : initialProducts;
    const totalPages = Math.ceil((searchMode === 'search'
        ? (searchData?.total || 0)
        : (productsData?.total || 0)) / itemsPerPage);
    const totalProducts = searchMode === 'search'
        ? (searchData?.total || 0)
        : (productsData?.total || 0);
    const mutate = searchMode === 'search' ? mutateSearchData : mutateBrowseData;

    // Completely rewrite loadNextBatch function to correctly batch load when user selects large items per page
    const loadNextBatch = useCallback(async () => {
        // If currently loading, all batches loaded, or batch loading not needed, return directly
        if (batchLoading || allBatchesLoaded || itemsPerPage <= 100) return;

        // If loaded count reaches or exceeds display count per page, no need to load more
        if (batchedProducts.length >= itemsPerPage) {
            setAllBatchesLoaded(true);

            return;
        }

        setBatchLoading(true);

        try {
            // Calculate next batch page number to load
            const nextBatchPage = Math.floor(batchedProducts.length / 100) + 1;
            const maxBatches = Math.ceil(itemsPerPage / 100);

            // If all batches already loaded, stop
            if (nextBatchPage > maxBatches) {
                setAllBatchesLoaded(true);
                setBatchLoading(false);

                return;
            }


            let newItems: Product[] = [];

            // Select correct API call based on current mode
            if (searchMode === 'search') {
                // use searchProducts API in search mode
                const searchBatchParams = {
                    ...searchParams,
                    page: nextBatchPage,
                    page_size: 100 // Fixed 100 per page
                };

                try {
                    const response = await productsApi.searchProducts(searchBatchParams);

                    // Handle response data, ensure access via correct type structure
                    if (response?.data?.data) {
                        if (Array.isArray(response.data.data.items)) {
                            newItems = response.data.data.items;
                        } else if (Array.isArray(response.data.data)) {
                            newItems = response.data.data;
                        }
                    }
                } catch {
                    return;
                }
            } else {
                // Use getProducts API in browse mode
                const browseBatchParams = {
                    page: nextBatchPage,
                    limit: 100, // Fixed 100 per page
                    api_provider: apiProvider,
                    sort_by: sortField as 'price' | 'discount' | 'created' | 'all' | undefined,
                    sort_order: sortDirection
                };

                try {
                    const response = await productsApi.getProducts(browseBatchParams);

                    // Handle response data, ensure access via correct type structure
                    if (response?.data?.data) {
                        if (Array.isArray(response.data.data.items)) {
                            newItems = response.data.data.items;
                        } else if (Array.isArray(response.data.data)) {
                            newItems = response.data.data;
                        }
                    }
                } catch {
                    return;
                }
            }

            // Merge new data into loaded product list
            if (newItems.length > 0) {

                // update loaded product list
                setBatchedProducts(prev => {
                    // Ensure not exceeding user-set items per page count
                    const combinedItems = [...prev, ...newItems];

                    return combinedItems.slice(0, itemsPerPage);
                });

                // Check if enough data has been loaded
                if (batchedProducts.length + newItems.length >= itemsPerPage) {
                    setAllBatchesLoaded(true);
                }
            } else {
                // If no new data fetched, indicates no more data to load
                setAllBatchesLoaded(true);
            }
        } catch {
            setError('Failed to load more products. Please try again later.');
        } finally {
            setBatchLoading(false);
        }
    }, [batchLoading, allBatchesLoaded, itemsPerPage, searchMode, searchParams, apiProvider, sortField, sortDirection, batchedProducts.length]);

    // Handle screen size detection for responsive design
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;

            if (width < 320) setScreenSize('xs');
            else if (width < 425) setScreenSize('sm');
            else if (width < 768) setScreenSize('md');
            else if (width < 1024) setScreenSize('lg');
            else setScreenSize('xl');
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Update the CSS for the loading animation
    useEffect(() => {
        // Add shimmer animation to global styles
        const style = document.createElement('style');

        style.textContent = `
            @keyframes shimmer {
                0% { background-position: 100% 0; }
                100% { background-position: 0 0; }
            }
            .animate-shimmer {
                animation: shimmer 1.5s infinite linear;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Use useEffect to load data from localStorage
    useEffect(() => {
        // Execute on client side only
        if (typeof window !== 'undefined') {
            const savedValue = localStorage.getItem('itemsPerPage');

            if (savedValue) {
                setItemsPerPage(parseInt(savedValue, 10));
            }
        }
    }, []);

    // Save to localStorage when itemsPerPage changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('itemsPerPage', itemsPerPage.toString());

            // update search parameters
            setSearchParams(prev => ({
                ...prev,
                page_size: 100 // Ensure API requests always use 100 as page size
            }));

            // reset batch loading status
            setBatchedProducts([]);
            setLoadedBatches(1);
            setAllBatchesLoaded(itemsPerPage <= 100);
        }
    }, [itemsPerPage]);

    // Rewrite initialization and data loading useEffect
    // After first load completes, if batch loading needed, start loading second batch
    useEffect(() => {
        // If in batch loading mode (itemsPerPage > 100) and initial data loaded (not loading)
        if (itemsPerPage > 100 && !loading && !batchLoading && batchedProducts.length === 0 && initialProducts.length > 0) {
            setBatchedProducts(initialProducts);

            // If initial load count reaches display count, set allBatchesLoaded to true
            if (initialProducts.length >= itemsPerPage) {
                setAllBatchesLoaded(true);
            } else {
                // Otherwise need to continue loading more data
                setAllBatchesLoaded(false);

                // Use setTimeout to avoid triggering status updates during render cycle
                const timer = setTimeout(() => {
                    loadNextBatch();
                }, 500);

                return () => clearTimeout(timer);
            }
        }
    }, [loading, batchLoading, itemsPerPage, initialProducts, batchedProducts.length, loadNextBatch]);

    // Animation variants for Framer Motion
    const listAnimation = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.05
            }
        }
    };

    const itemAnimation = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.3 }
        }
    };

    // Apply advanced search
    const applyAdvancedSearch = () => {
        // If search term or API source filter exists, apply filters
        if (searchTerm.trim() || apiProvider !== undefined) {
            setSearchParams(prev => ({
                ...prev,
                min_price: minPrice,
                max_price: maxPrice,
                min_discount: minDiscount,
                is_prime_only: isPrimeOnly,
                api_provider: apiProvider
            }));

            // Has search term, switch to search mode
            if (searchTerm.trim()) {
                setSearchMode('search');
            } else if (searchMode === 'browse') {
                // If no search term but has filter conditions, refresh data in browse mode
                if (mutateBrowseData && (minPrice !== undefined || maxPrice !== undefined ||
                    minDiscount !== undefined || isPrimeOnly !== undefined || apiProvider !== undefined)) {
                    mutateBrowseData();
                }
            } else {
                // Refresh data in search mode
                if (mutateSearchData) {
                    mutateSearchData();
                }
            }
        }
    };

    // Clear search, return to browse mode
    const clearSearch = () => {
        setSearchTerm('');
        setSearchMode('browse');
        setMinPrice(undefined);
        setMaxPrice(undefined);
        setMinDiscount(undefined);
        setIsPrimeOnly(undefined);
        setApiProvider(undefined);
    };

    // Handle search input change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;

        setSearchTerm(term);
        handleSearch(term);
    };

    // Handle API source change
    const handleApiProviderChange = (provider: string | undefined) => {
        setApiProvider(provider);

        // update search parameters
        setSearchParams(prev => ({
            ...prev,
            api_provider: provider
        }));

        // If in search mode, immediately apply filter; if in browse mode, refresh data directly
        if (searchMode === 'browse') {
            if (provider !== undefined) {
                // Specific API provider selected but remain in browse mode
                // Force data refresh using useProducts mutate function
                if (mutateBrowseData) {
                    mutateBrowseData();
                }
            }
        } else {
            // Already in search mode, refresh search results
            if (mutateSearchData) {
                mutateSearchData();
            }
        }
    };

    // update product filter logic, use only in browse mode
    const filteredProducts = searchMode === 'search'
        ? products
        : products.filter(product =>
            product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.asin?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // update sort logic, use local sort only in browse mode
    const sortedProducts = searchMode === 'search'
        ? products // In search mode, use sort result returned by API directly
        : [...filteredProducts].sort((a, b) => {
            if (!sortField) return 0;

            let valueA, valueB;

            switch (sortField) {
                case 'title':
                    valueA = a.title || '';
                    valueB = b.title || '';
                    break;
                case 'asin':
                    valueA = a.asin || '';
                    valueB = b.asin || '';
                    break;
                case 'price':
                    valueA = a.offers?.[0]?.price || 0;
                    valueB = b.offers?.[0]?.price || 0;
                    break;
                case 'discount':
                    valueA = a.offers?.[0]?.savings_percentage || 0;
                    valueB = b.offers?.[0]?.savings_percentage || 0;
                    break;
                default:
                    return 0;
            }

            if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
            if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;

            return 0;
        });

    // Modify page number handler function
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);

        // reset batch loading status
        setBatchedProducts([]);
        setLoadedBatches(1);
        setAllBatchesLoaded(itemsPerPage <= 100); // If page size <= 100, batch loading is not needed

        // Update search parameters in search modeto trigger API request
        if (searchMode === 'search') {
            setSearchParams(prev => ({
                ...prev,
                page: newPage
            }));
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle per-page count change
    const handleItemsPerPageChange = (newValue: number) => {
        // Calculate current page position under new pagination size
        const firstItemIndex = (currentPage - 1) * itemsPerPage;
        const newPage = Math.floor(firstItemIndex / newValue) + 1;

        setItemsPerPage(newValue);
        setCurrentPage(newPage);
        setRenderedRowCount(Math.min(100, sortedProducts.length)); // Reset render row count to 100

        // Update search parameters in search mode
        if (searchMode === 'search') {
            setSearchParams(prev => ({
                ...prev,
                page: newPage,
                page_size: 100 // Ensure API requests always use 100 as page size
            }));
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Modify sort handling function
    const handleSort = (field: string) => {
        const newDirection = sortField === field && sortDirection === 'desc' ? 'asc' : 'desc';

        setSortField(field);
        setSortDirection(newDirection);

        // reset batch loading status
        setBatchedProducts([]);
        setLoadedBatches(1);
        setAllBatchesLoaded(itemsPerPage <= 100);

        // Update search parameters in search modeto trigger API request
        if (searchMode === 'search') {
            setSearchParams(prev => ({
                ...prev,
                sort_by: field as 'relevance' | 'price' | 'discount' | 'created',
                sort_order: newDirection
            }));
        }

        // Scroll to top of table when sorting changes
        if (tableRef.current) {
            tableRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Modify logic for setting rendered row count
    useEffect(() => {
        if (sortedProducts.length > 0) {
            // Increase initial render row count to ensure more rows are shown
            if (renderedRowCount === 0 || renderedRowCount < Math.min(100, sortedProducts.length)) {
                setRenderedRowCount(Math.min(100, sortedProducts.length));
            }

            // create Intersection Observer instance
            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries[0]?.isIntersecting) {

                        if (renderedRowCount < sortedProducts.length) {
                            // Increase render row count when last row becomes visible
                            const newRowCount = Math.min(renderedRowCount + 20, sortedProducts.length);

                            setRenderedRowCount(newRowCount);
                        } else if (!allBatchesLoaded && itemsPerPage > 100 && batchedProducts.length < itemsPerPage) {
                            // If all currently loaded products are rendered but more batches remain
                            loadNextBatch();
                        } else {
                        }
                    }
                },
                {
                    threshold: 0.1,
                    rootMargin: '100px'  // Start observing 100px early to improve UX
                }
            );

            rowObserverRef.current = observer;

            // Ensure last row is observed to trigger loading
            if (lastRowRef.current) {
                rowObserverRef.current.observe(lastRowRef.current);
            }

            // Clean up and re-setup when list or observer changes
            return () => {
                if (rowObserverRef.current) {
                    rowObserverRef.current.disconnect();
                }
            };
        }
    }, [sortedProducts.length, renderedRowCount, loadNextBatch, allBatchesLoaded, itemsPerPage, batchedProducts.length]);

    // Get sort icon based on field and current sort state
    const getSortIcon = (field: string) => {
        if (sortField !== field) return <FaSort className="ml-1 text-gray-400" size={12} />;

        return sortDirection === 'desc' ?
            <FaSortDown className="ml-1 text-blue-500" size={12} /> :
            <FaSortUp className="ml-1 text-blue-500" size={12} />;
    };

    // Render animated loading skeleton
    const renderSkeleton = () => (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={listAnimation}
            className="p-6 space-y-4"
        >
            {SKELETON_KEYS.map((key) => (
                <motion.div
                    key={key}
                    variants={itemAnimation}
                    className="h-16 bg-gray-200 rounded w-full overflow-hidden"
                >
                    <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"
                        style={{ backgroundSize: '400% 100%' }} />
                </motion.div>
            ))}
        </motion.div>
    );

    const handleEditProduct = (asin: string) => {
        router.push(`/dashboard/products/edit/${asin}`);
    };

    const handleDeleteProduct = async (asin: string) => {
        try {
            const response = await fetch(`/api/products/batch-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    asins: [asin]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                let errorMsg = `Failed to delete product: ${response.status} ${response.statusText}`;

                if (errorData && errorData.detail) {
                    errorMsg = errorData.detail;
                }

                throw new Error(errorMsg);
            }

            // Refresh product list after successful deletion
            setShowDeleteConfirm(null);
            if (mutate) {
                await mutate();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error deleting product');
        }
    };

    // Render a responsive pagination display based on screen size
    const renderPagination = () => {
        // For extra small screens (xs), show minimal pagination
        if (screenSize === 'xs') {
            return (
                <div className="flex justify-between w-full">
                    <button
                        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className={`px-2 py-1 text-xs border rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700'}`}
                    >
                        Prev
                    </button>
                    <span className="px-2 py-1 text-xs">{currentPage} / {totalPages}</span>
                    <button
                        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`px-2 py-1 text-xs border rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700'}`}
                    >
                        Next
                    </button>
                </div>
            );
        }

        // For small screens (sm), show compact pagination
        if (screenSize === 'sm') {
            return (
                <div className="flex flex-col items-center space-y-2">
                    <div className="text-xs text-gray-500">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-2 py-1 text-xs border rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700'}`}
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-2 py-1 text-xs border rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700'}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            );
        }

        // For medium screens (md) and above
        const pageNumbers = [];
        const maxVisiblePages = screenSize === 'md' ? 5 : 10;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{totalProducts === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalProducts)}</span> of{' '}
                    <span className="font-medium">{totalProducts}</span> results
                </div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        Prev
                    </button>
                    {pageNumbers.map(pageNumber => (
                        <button
                            key={`page-${pageNumber}`}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${currentPage === pageNumber
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {pageNumber}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        Next
                    </button>
                </nav>
            </div>
        );
    };

    // Render "items per page" dropdown selector
    const renderItemsPerPageSelect = () => {
        const options = [10, 50, 100, 500, 1000];

        // Design different styles for different screen sizes
        if (screenSize === 'xs' || screenSize === 'sm') {
            return (
                <div className="flex items-center space-x-1 text-xs">
                    <span>Show:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                        className="border border-gray-300 rounded py-1 px-1 bg-white text-xs"
                    >
                        {options.map(option => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        return (
            <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">Show:</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="border border-gray-300 rounded py-1 px-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                    {options.map(option => (
                        <option key={option} value={option}>
                            {option} per page
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    // Stats cards at the top
    const renderStatsCards = () => {
        // For extra small and small screens, use 2-column grid with smaller text and padding
        if (screenSize === 'xs' || screenSize === 'sm') {
            return (
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="text-lg font-bold text-gray-800">{totalProducts}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-xs text-gray-500">Pages</div>
                        <div className="text-lg font-bold text-gray-800">{totalPages}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-xs text-gray-500">Page</div>
                        <div className="text-lg font-bold text-gray-800">{currentPage}</div>
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                        <div className="text-xs text-gray-500">Per Page</div>
                        <div className="text-lg font-bold text-gray-800">{itemsPerPage}</div>
                    </div>
                </div>
            );
        }

        // For medium screens and above, use the original layout
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500">Total Products</div>
                    <div className="text-2xl font-bold text-gray-800">{totalProducts}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500">Pages</div>
                    <div className="text-2xl font-bold text-gray-800">{totalPages}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500">Current Page</div>
                    <div className="text-2xl font-bold text-gray-800">{currentPage}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-sm text-gray-500">Items Per Page</div>
                    <div className="text-2xl font-bold text-gray-800">{itemsPerPage}</div>
                </div>
            </div>
        );
    };

    // Check user permissions
    if (!session?.user?.role || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
        return <div className="p-4 bg-red-50 text-red-600 rounded-lg">You don&apos;t have permission to access this page</div>;
    }

    // Render search status info
    const renderSearchStatus = () => {
        if (searchMode !== 'search' || !searchParams.keyword) return null;

        return (
            <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-lg p-2 mb-4 flex justify-between items-center">
                <div>
                    Search results for <span className="font-medium">&quot;{searchParams.keyword}&quot;</span>:
                    {totalProducts} products
                </div>
                <button
                    onClick={clearSearch}
                    className="text-sm bg-white border border-blue-200 rounded px-2 py-1 hover:bg-blue-100"
                >
                    View All Products
                </button>
            </div>
        );
    };

    // Render advanced search panel
    const renderAdvancedSearch = () => (
        <div className="mb-4">
            <button
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            >
                {showAdvancedSearch ? <FaChevronUp className="mr-1" /> : <FaChevronDown className="mr-1" />}
                Advanced Search Options
            </button>

            {showAdvancedSearch && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                >
                    {/* Price range */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Price Range</label>
                        <div className="flex space-x-2">
                            <input
                                type="number"
                                placeholder="Min"
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                                value={minPrice || ''}
                                onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                            />
                            <span className="text-gray-500 flex items-center">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                                value={maxPrice || ''}
                                onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                            />
                        </div>
                    </div>

                    {/* Minimum discount rate */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Minimum Discount (%)</label>
                        <input
                            type="number"
                            placeholder="e.g. 20"
                            className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                            value={minDiscount || ''}
                            onChange={(e) => setMinDiscount(e.target.value ? Number(e.target.value) : undefined)}
                        />
                    </div>

                    {/* Whether to show only Prime products */}
                    <div className="flex items-center">
                        <input
                            id="prime-only"
                            type="checkbox"
                            className="h-4 w-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                            checked={isPrimeOnly || false}
                            onChange={(e) => setIsPrimeOnly(e.target.checked)}
                        />
                        <label htmlFor="prime-only" className="ml-2 block text-sm text-gray-600">
                            Prime Products Only
                        </label>
                    </div>

                    {/* API source selection */}
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">API Source</label>
                        <div className="flex space-x-4">
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio h-4 w-4 text-blue-600"
                                    checked={apiProvider === undefined}
                                    onChange={() => setApiProvider(undefined)}
                                />
                                <span className="ml-2 text-sm text-gray-700">All Sources</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio h-4 w-4 text-blue-600"
                                    checked={apiProvider === 'pa-api'}
                                    onChange={() => setApiProvider('pa-api')}
                                />
                                <span className="ml-2 text-sm text-gray-700">Amazon API</span>
                            </label>
                            <label className="inline-flex items-center">
                                <input
                                    type="radio"
                                    className="form-radio h-4 w-4 text-blue-600"
                                    checked={apiProvider === 'cj-api'}
                                    onChange={() => setApiProvider('cj-api')}
                                />
                                <span className="ml-2 text-sm text-gray-700">CJ API</span>
                            </label>
                        </div>
                    </div>

                    {/* Apply button */}
                    <div className="col-span-full flex justify-end mt-2">
                        <button
                            onClick={applyAdvancedSearch}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-3 py-1 text-sm"
                        >
                            Apply Filters
                        </button>
                    </div>
                </motion.div>
            )}
        </div>
    );

    // Render API source quick filter buttons
    const renderApiProviderFilters = () => (
        <div className="flex flex-wrap gap-2 mb-4">
            <button
                onClick={() => handleApiProviderChange(undefined)}
                className={`px-3 py-1 text-sm rounded-full ${apiProvider === undefined
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
                All Sources
            </button>
            <button
                onClick={() => handleApiProviderChange('pa-api')}
                className={`px-3 py-1 text-sm rounded-full ${apiProvider === 'pa-api'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
                Amazon API
            </button>
            <button
                onClick={() => handleApiProviderChange('cj-api')}
                className={`px-3 py-1 text-sm rounded-full ${apiProvider === 'cj-api'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
                CJ API
            </button>
        </div>
    );

    // Render API source filter status indicator
    const renderApiProviderStatus = () => {
        if (!apiProvider) return null;

        return (
            <div className="bg-blue-50 border border-blue-100 text-blue-800 rounded-lg p-2 mb-4 flex justify-between items-center">
                <div>
                    {searchMode === 'browse' ? 'Browsing' : 'Searching'} products from: <span className="font-medium">{apiProvider === 'pa-api' ? 'Amazon API' : 'CJ API'}</span>
                </div>
                <button
                    onClick={() => handleApiProviderChange(undefined)}
                    className="text-sm bg-white border border-blue-200 rounded px-2 py-1 hover:bg-blue-100"
                >
                    Clear Filter
                </button>
            </div>
        );
    };

    // Render empty status
    const renderEmptyState = () => (
        <div className="p-6 text-center text-gray-500">
            {searchMode === 'search' ? (
                <>
                    <div className="text-lg mb-2">No matching products found</div>
                    <p>Try using different search terms or filters</p>
                    <button
                        onClick={clearSearch}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-sm"
                    >
                        View All Products
                    </button>
                </>
            ) : (
                'No product data available'
            )}
        </div>
    );

    // Handle different view layouts based on screen size
    const renderProductsList = () => {

        if (loading && !batchLoading) {
            return (
                <div className="animate-pulse p-6 space-y-4">
                    {SKELETON_KEYS.map((key) => (
                        <div key={key} className="h-16 bg-gray-200 rounded w-full" />
                    ))}
                </div>
            );
        }

        if (filteredProducts.length === 0 && !batchLoading) {
            return renderEmptyState();
        }

        return renderScreenSizeTable();
    };

    // Render corresponding table based on screen size
    const renderScreenSizeTable = () => {
        // Card view for XS and SM screens with animations
        if (screenSize === 'xs' || screenSize === 'sm') {
            return (
                <AnimatePresence mode="wait">
                    {loading ? (
                        renderSkeleton()
                    ) : filteredProducts.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-6"
                        >
                            {renderEmptyState()}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={listAnimation}
                            className="grid grid-cols-1 gap-4 p-4"
                        >
                            {sortedProducts.slice(0, renderedRowCount).map((product, index) => (
                                <motion.div
                                    layout
                                    key={product.asin}
                                    variants={itemAnimation}
                                    className="bg-white rounded-lg shadow-sm p-3 border border-gray-200 hover:shadow-md transition-shadow duration-300 relative cursor-pointer"
                                    ref={index === renderedRowCount - 1 ? lastRowRef : null}
                                >
                                    <div className="flex items-start space-x-2">
                                        <div className="flex-shrink-0">
                                            {product.main_image ? (
                                                <div className="overflow-hidden rounded-md">
                                                    <Image
                                                        src={product.main_image}
                                                        alt={product.title || 'Product Image'}
                                                        width={50}
                                                        height={50}
                                                        className="object-cover transition-transform duration-300 hover:scale-110"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-[50px] w-[50px] bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                                                    No img
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">{product.title}</h3>
                                            <div className="flex flex-col text-xs">
                                                <span className="text-gray-500">ASIN: {product.asin || '-'}</span>
                                                <div className="flex justify-between items-center mt-1">
                                                    <div className="flex items-center">
                                                        <span className="font-medium text-gray-900">
                                                            ${product.offers?.[0]?.price?.toFixed(2) || '0.00'}
                                                        </span>
                                                        {product.offers?.[0]?.savings_percentage && (
                                                            <span className="ml-2 text-xs font-medium text-green-600">
                                                                -{product.offers[0].savings_percentage}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <button
                                                            onClick={() => product.asin ? handleEditProduct(product.asin) : null}
                                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                                            aria-label="Edit product"
                                                        >
                                                            <FaEdit size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => product.asin ? setShowDeleteConfirm(product.asin) : null}
                                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                                            aria-label="Delete product"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {product.api_provider && (
                                            <div className="absolute top-1 right-1">
                                                {product.api_provider === 'pa-api' ? (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium bg-blue-100 text-blue-800">
                                                        Amazon
                                                    </span>
                                                ) : product.api_provider === 'cj-api' ? (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium bg-green-100 text-green-800">
                                                        CJ
                                                    </span>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {renderedRowCount < sortedProducts.length && (
                                <div className="flex justify-center items-center space-x-2 text-xs text-gray-500 py-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="w-4 h-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin" />
                                    <span>Loading more products...</span>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            );
        }

        // Table view for MD screens with animations
        if (screenSize === 'md') {
            return (
                <AnimatePresence mode="wait">
                    {loading ? (
                        renderSkeleton()
                    ) : filteredProducts.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-6"
                        >
                            {renderEmptyState()}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                            ref={tableRef}
                        >
                            <div className="border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr className="divide-x divide-gray-200">
                                            <th
                                                scope="col"
                                                className="py-3 pl-4 pr-2 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => handleSort('title')}
                                            >
                                                <div className="flex items-center">
                                                    Product
                                                    {getSortIcon('title')}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="py-3 px-2 text-right text-xs font-medium text-gray-500 uppercase w-20 cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => handleSort('price')}
                                            >
                                                <div className="flex items-center justify-end">
                                                    Price
                                                    {getSortIcon('price')}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="py-3 px-2 text-center text-xs font-medium text-gray-500 uppercase w-16"
                                            >
                                                Source
                                            </th>
                                            <th scope="col" className="py-3 pl-2 pr-4 text-right text-xs font-medium text-gray-500 uppercase w-24">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {sortedProducts.slice(0, renderedRowCount).map((product, index) => (
                                            <motion.tr
                                                key={product.asin}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: index * 0.03,
                                                }}
                                                className="hover:bg-gray-50 divide-x divide-gray-200 transition-colors"
                                                ref={index === renderedRowCount - 1 ? lastRowRef : null}
                                            >
                                                <td className="py-3 pl-4 pr-2 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md">
                                                            {product.main_image ? (
                                                                <Image
                                                                    src={product.main_image}
                                                                    alt={product.title || 'Product Image'}
                                                                    width={32}
                                                                    height={32}
                                                                    className="h-8 w-8 object-cover transition-transform duration-300 hover:scale-110"
                                                                />
                                                            ) : (
                                                                <div className="h-8 w-8 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                                                                    No
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 max-w-[120px]">
                                                            <div className="font-medium text-xs text-gray-900 line-clamp-1 cursor-pointer">{product.title}</div>
                                                            <div className="text-xs text-gray-500 truncate">{product.asin}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2 text-xs text-right">
                                                    <div className="font-medium text-gray-900">
                                                        ${product.offers?.[0]?.price?.toFixed(2) || '0.00'}
                                                    </div>
                                                    {product.offers?.[0]?.savings_percentage && (
                                                        <div className="text-xs text-green-600">-{product.offers[0].savings_percentage}%</div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-2 text-center">
                                                    {product.api_provider === 'pa-api' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            Amazon
                                                        </span>
                                                    ) : product.api_provider === 'cj-api' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            CJ
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="py-3 pl-2 pr-4 text-right">
                                                    <div className="flex items-center justify-end space-x-1">
                                                        <button
                                                            onClick={() => product.asin ? handleEditProduct(product.asin) : null}
                                                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                                            aria-label="Edit product"
                                                        >
                                                            <FaEdit size={12} />
                                                        </button>
                                                        <button
                                                            onClick={() => product.asin ? setShowDeleteConfirm(product.asin) : null}
                                                            className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                                                            aria-label="Delete product"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                        {renderedRowCount < sortedProducts.length && (
                                            <tr>
                                                <td colSpan={4} className="px-3 py-4 text-center">
                                                    <div className="flex justify-center items-center space-x-2 text-xs text-gray-500 py-2 bg-gray-50">
                                                        <div className="w-4 h-4 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin" />
                                                        <span>Loading more products...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            );
        }

        // Optimized table view for LG screens
        if (screenSize === 'lg') {
            return (
                <div className="overflow-hidden">
                    <div className="shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="sticky top-0 z-10 py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleSort('title')}>
                                            Product
                                        </th>
                                        <th scope="col" className="sticky top-0 z-10 px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleSort('asin')}>
                                            ASIN
                                        </th>
                                        <th scope="col" className="sticky top-0 z-10 px-3 py-3.5 text-right text-xs font-semibold text-gray-900 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                            onClick={() => handleSort('price')}>
                                            Price
                                        </th>
                                        <th scope="col" className="sticky top-0 z-10 px-3 py-3.5 text-center text-xs font-semibold text-gray-900 bg-gray-50">
                                            Source
                                        </th>
                                        <th scope="col" className="sticky top-0 z-10 px-3 py-3.5 text-right text-xs font-semibold text-gray-900 bg-gray-50">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {sortedProducts.slice(0, renderedRowCount).map((product, index) => (
                                        <tr
                                            key={product.asin}
                                            className="hover:bg-gray-50"
                                            ref={index === renderedRowCount - 1 ? lastRowRef : null}
                                        >
                                            <td className="py-4 pl-4 pr-3 text-sm">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        {product.main_image ? (
                                                            <Image
                                                                src={product.main_image}
                                                                alt={product.title || 'Product Image'}
                                                                width={40}
                                                                height={40}
                                                                className="h-10 w-10 object-cover rounded-md"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                                                                No img
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-3 max-w-[300px]">
                                                        <div className="font-medium text-gray-900 line-clamp-1 cursor-pointer">{product.title}</div>
                                                        {product.brand && (
                                                            <div className="text-xs text-gray-500 truncate">
                                                                {product.brand}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-4 text-sm text-gray-500">
                                                {product.asin || '-'}
                                            </td>
                                            <td className="px-3 py-4 text-sm text-right">
                                                <div className="font-medium text-gray-900">
                                                    ${product.offers?.[0]?.price?.toFixed(2) || '0.00'}
                                                </div>
                                                {product.offers?.[0]?.savings_percentage && (
                                                    <div className="text-xs text-green-600">-{product.offers[0].savings_percentage}%</div>
                                                )}
                                            </td>
                                            <td className="px-3 py-4 text-sm text-center">
                                                {product.api_provider === 'pa-api' ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        Amazon
                                                    </span>
                                                ) : product.api_provider === 'cj-api' ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                        CJ
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td className="px-3 py-4 text-sm text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => product.asin ? handleEditProduct(product.asin) : null}
                                                        className="inline-flex items-center text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                                    >
                                                        <FaEdit className="mr-1" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => product.asin ? setShowDeleteConfirm(product.asin) : null}
                                                        className="inline-flex items-center text-gray-400 hover:text-red-600 transition-colors duration-200"
                                                    >
                                                        <FaTrash className="mr-1" /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {renderedRowCount < sortedProducts.length && (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-4 text-center">
                                                <div className="flex justify-center items-center space-x-2 text-sm text-gray-500 py-2 bg-gray-50">
                                                    <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin" />
                                                    <span>Loading more products...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            );
        }

        // Full table view for XL screens with animations
        return (
            <AnimatePresence mode="wait">
                {loading ? (
                    renderSkeleton()
                ) : filteredProducts.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-6"
                    >
                        {renderEmptyState()}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                        ref={tableRef}
                    >
                        <div className="shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="sticky top-0 z-10 py-3.5 pl-4 pr-3 text-left text-xs font-semibold text-gray-900 bg-gray-50 w-[40%] cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => handleSort('title')}
                                            >
                                                <div className="flex items-center">
                                                    Product Name
                                                    {getSortIcon('title')}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="sticky top-0 z-10 px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-gray-50 w-[15%] cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => handleSort('asin')}
                                            >
                                                <div className="flex items-center">
                                                    ASIN
                                                    {getSortIcon('asin')}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="sticky top-0 z-10 px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-gray-50 w-[10%] cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => handleSort('price')}
                                            >
                                                <div className="flex items-center">
                                                    Price
                                                    {getSortIcon('price')}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="sticky top-0 z-10 px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-gray-50 w-[10%] cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => handleSort('discount')}
                                            >
                                                <div className="flex items-center">
                                                    Discount
                                                    {getSortIcon('discount')}
                                                </div>
                                            </th>
                                            <th
                                                scope="col"
                                                className="sticky top-0 z-10 px-3 py-3.5 text-left text-xs font-semibold text-gray-900 bg-gray-50 w-[10%]"
                                            >
                                                Source
                                            </th>
                                            <th scope="col" className="sticky top-0 z-10 px-3 py-3.5 text-right text-xs font-semibold text-gray-900 bg-gray-50 w-[15%]">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {sortedProducts.slice(0, renderedRowCount).map((product, index) => (
                                            <motion.tr
                                                key={product.asin}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    duration: 0.3,
                                                    delay: index * 0.02,
                                                }}
                                                className="hover:bg-gray-50 transition-colors duration-150"
                                                ref={index === renderedRowCount - 1 ? lastRowRef : null}
                                            >
                                                <td className="py-4 pl-4 pr-3 text-sm">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
                                                            {product.main_image ? (
                                                                <Image
                                                                    src={product.main_image}
                                                                    alt={product.title || 'Product Image'}
                                                                    width={40}
                                                                    height={40}
                                                                    className="h-10 w-10 object-cover transition-transform duration-300 hover:scale-110"
                                                                />
                                                            ) : (
                                                                <div className="h-10 w-10 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-xs">
                                                                    No img
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-3 min-w-0 max-w-[400px]">
                                                            <div className="font-medium text-gray-900 line-clamp-1 hover:text-blue-600 transition-colors duration-200 cursor-pointer">{product.title}</div>
                                                            {product.brand && (
                                                                <div className="text-sm text-gray-500 truncate">
                                                                    {product.brand}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500">
                                                    {product.asin || '-'}
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500">
                                                    ${product.offers?.[0]?.price?.toFixed(2) || '0.00'}
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500">
                                                    {product.offers?.[0]?.savings_percentage ? (
                                                        <span className="text-green-600">-{product.offers[0].savings_percentage}%</span>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500">
                                                    {product.api_provider === 'pa-api' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            Amazon
                                                        </span>
                                                    ) : product.api_provider === 'cj-api' ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            CJ
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="px-3 py-4 text-sm text-right">
                                                    <div className="flex items-center justify-end space-x-2">
                                                        <button
                                                            onClick={() => product.asin ? handleEditProduct(product.asin) : null}
                                                            className="inline-flex items-center text-gray-400 hover:text-blue-600 transition-colors duration-200"
                                                        >
                                                            <FaEdit className="mr-1" /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => product.asin ? setShowDeleteConfirm(product.asin) : null}
                                                            className="inline-flex items-center text-gray-400 hover:text-red-600 transition-colors duration-200"
                                                        >
                                                            <FaTrash className="mr-1" /> Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                        {renderedRowCount < sortedProducts.length && (
                                            <tr>
                                                <td colSpan={6} className="px-3 py-4 text-center">
                                                    <div className="flex justify-center items-center space-x-2 text-sm text-gray-500 py-2 bg-gray-50">
                                                        <div className="w-5 h-5 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin" />
                                                        <span>Loading more products...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Product Management</h1>
                <div className="flex items-center">
                    {renderItemsPerPageSelect()}
                </div>
            </motion.div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4"
                    >
                        <p>{error}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search bar */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="relative"
            >
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <FaSearch className={searchMode === 'search' ? "text-blue-500" : "text-gray-400"} />
                </div>
                <input
                    type="text"
                    className={`bg-gray-50 border ${searchMode === 'search' ? 'border-blue-300 ring-1 ring-blue-500' : 'border-gray-300'} text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 transition-shadow duration-200 hover:shadow-sm`}
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                {searchTerm && (
                    <button
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        onClick={clearSearch}
                    >
                        <span className="sr-only">Clear search</span>
                        <FaTimes />
                    </button>
                )}
            </motion.div>

            {/* Advanced search options */}
            {renderAdvancedSearch()}

            {/* API source quick filter buttons */}
            {renderApiProviderFilters()}

            {/* Search result status */}
            <AnimatePresence>
                {searchMode === 'search' && searchParams.keyword && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        {renderSearchStatus()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* API source filter status indicator */}
            <AnimatePresence>
                {apiProvider && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        {renderApiProviderStatus()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Statistics card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
            >
                {renderStatsCards()}
            </motion.div>

            {/* Product list */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200"
            >
                <div className={screenSize === 'xs' || screenSize === 'sm' || screenSize === 'md' ? '' : 'overflow-x-auto'}>
                    {renderProductsList()}
                </div>

                {/* Pagination control */}
                {!loading && products.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                        className="bg-white px-2 sm:px-4 py-3 border-t border-gray-200"
                    >
                        {renderPagination()}
                    </motion.div>
                )}
            </motion.div>

            {/* Delete confirmation popup */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-white rounded-lg shadow-xl p-5 w-full max-w-sm"
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-3">Confirm Delete</h3>
                            <p className="text-gray-600 mb-5">
                                Are you sure you want to delete this product? This action cannot be undone.
                            </p>
                            <div className="flex justify-end space-x-3">
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ y: 0 }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors duration-200"
                                    onClick={() => setShowDeleteConfirm(null)}
                                >
                                    Cancel
                                </motion.button>
                                <motion.button
                                    whileHover={{ y: -2 }}
                                    whileTap={{ y: 0 }}
                                    className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors duration-200"
                                    onClick={() => handleDeleteProduct(showDeleteConfirm)}
                                >
                                    Delete
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductsPageContent;