import { Input, Button } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import { formatPrice } from "@/lib/utils";

interface SearchResult {
    asin?: string;
    title: string;
    main_image?: string;
    offers?: Array<{
        price: number;
        savings_percentage?: number | null;
    }>;
}

// Search dropdown animation
const searchDropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.15 } }
};

interface MobileSearchProps {
    isSearchOpen: boolean;
    isTabletSearchOpen?: boolean;
    searchKeyword: string;
    searchInputRef: React.RefObject<HTMLInputElement | null>;
    handleSearchSubmit: (e?: React.FormEvent) => void;
    handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    showSearchPreview: boolean;
    setShowSearchPreview: (show: boolean) => void;
    searchResults?: {
        items: SearchResult[];
        total?: number;
    };
    isLoading: boolean;
    previewLimit: number;
    handlePreviewItemClick: (productId: string | undefined) => void;
}

export const MobileSearch: React.FC<MobileSearchProps> = ({
    isSearchOpen,
    isTabletSearchOpen,
    searchKeyword,
    searchInputRef,
    handleSearchSubmit,
    handleSearchInputChange,
    showSearchPreview,
    setShowSearchPreview,
    searchResults,
    isLoading,
    previewLimit,
    handlePreviewItemClick
}) => {
    const shouldShow = isSearchOpen || isTabletSearchOpen;

    return (
        <div
            className="w-full px-0 py-3 bg-white shadow-sm xl:hidden"
            style={{
                display: shouldShow ? 'block' : 'none',
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 50
            }}
        >
            <form onSubmit={handleSearchSubmit} className="relative w-full max-w-[1400px] mx-auto px-4">
                <Input
                    ref={searchInputRef}
                    aria-label="Search"
                    classNames={{
                        base: "w-full",
                        inputWrapper: "bg-white/90 shadow-sm border border-gray-200 rounded-full h-11 px-3 md:px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary group-data-[focus=true]:bg-white",
                        input: "text-sm pr-12 focus:outline-none focus:ring-0 focus-visible:outline-none search-input h-full"
                    }}
                    placeholder="Search deals..."
                    size="sm"
                    type="search"
                    value={searchKeyword}
                    onChange={handleSearchInputChange}
                    onFocus={() => setShowSearchPreview(searchKeyword.length > 0)}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pr-1">
                    <Button
                        className="bg-[#F39C12] hover:bg-[#E67E22] text-white font-medium rounded-full h-9 px-6 text-sm flex items-center justify-center min-w-[70px]"
                        size="sm"
                        type="submit"
                    >
                        Hunt
                    </Button>
                </div>
            </form>

            {/* Mobile search preview */}
            <AnimatePresence>
                {showSearchPreview && searchKeyword.length > 0 && (
                    <motion.div
                        variants={searchDropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="mt-2 bg-white rounded-lg border border-gray-100 overflow-hidden max-h-[60vh] overflow-y-auto absolute left-4 right-4 z-[9995] shadow-md"
                    >
                        {isLoading ? (
                            <div className="p-2 sm:p-3 text-left text-gray-500 text-xs sm:text-sm">
                                Searching...
                            </div>
                        ) : !searchResults?.items?.length ? (
                            <div className="p-2 sm:p-3 text-left text-gray-500 text-xs sm:text-sm">
                                No matching products found
                            </div>
                        ) : (
                            <>
                                <div className="p-1 sm:p-2">
                                    {searchResults.items.slice(0, previewLimit).map((product: SearchResult) => (
                                        <div
                                            key={product.asin || `product-${Math.random()}`}
                                            className="flex items-center p-1.5 sm:p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                                            onClick={() => handlePreviewItemClick(product.asin)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handlePreviewItemClick(product.asin);
                                                }
                                            }}
                                            tabIndex={0}
                                            role="button"
                                            aria-label={`View details for ${product.title}`}
                                        >
                                            {product.main_image && (
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md overflow-hidden bg-gray-200 flex-shrink-0 mr-2 relative">
                                                    <Image
                                                        src={product.main_image}
                                                        alt={product.title}
                                                        fill
                                                        sizes="(max-width: 640px) 32px, (max-width: 768px) 40px, 48px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                    {product.title}
                                                </p>
                                                <div className="flex items-center mt-0.5">
                                                    {product.offers && product.offers[0] && (
                                                        <span className="text-xs sm:text-sm font-bold text-green-600">
                                                            {formatPrice(product.offers[0].price)}
                                                        </span>
                                                    )}
                                                    {product.offers && product.offers[0]?.savings_percentage && (
                                                        <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs bg-red-100 text-red-600 px-1 sm:px-1.5 py-0.5 rounded-full">
                                                            {product.offers[0].savings_percentage}% OFF
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div
                                    className="p-2 sm:p-3 bg-gray-50 text-left hover:bg-gray-100 cursor-pointer border-t"
                                    onClick={() => handleSearchSubmit()}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleSearchSubmit();
                                        }
                                    }}
                                    tabIndex={0}
                                    role="button"
                                    aria-label="View all search results"
                                >
                                    <span className="text-xs sm:text-sm font-medium text-blue-600 text-left">
                                        View all {searchResults?.total || 0} results
                                    </span>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}; 