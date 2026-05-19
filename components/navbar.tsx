"use client";

import {
  Navbar as HeroUINavbar,
  NavbarMenuToggle,
  NavbarBrand,
} from "@heroui/navbar";
import { Input, Button } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu } from "lucide-react";
import Image from "next/image";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

import AuthStatus from "@/components/auth/AuthStatus";
import { MobileSearch, MobileSearchButton } from "@/components/mobile";
import { MobileMenu } from "@/components/mobile/MobileMenu";
import { siteConfig } from "@/config/site";
import { useProductSearch } from "@/lib/hooks";
import { formatPrice } from "@/lib/utils";

// Animation variants
const navbarVariants = {
  initial: { opacity: 1 },
  scrolled: { opacity: 1 }
};

const _searchIconVariants = {
  initial: { rotate: 0 },
  animate: { rotate: 360 }
};

const _menuItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
    },
  }),
  hover: { scale: 1.05 }
};

// Search dropdown animation
const searchDropdownVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } }
};

// Add custom style to hide search box clear button
const searchInputStyles = `
  /* Hide search box clear button */
  input[type="search"]::-webkit-search-cancel-button {
    -webkit-appearance: none;
    display: none;
  }
  input[type="search"]::-ms-clear {
    display: none;
  }
`;

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [_isSearchFocused, _setIsSearchFocused] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [showSearchPreview, setShowSearchPreview] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTabletSearchOpen, setIsTabletSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Limit the number of search preview results
  const previewLimit = 5;

  // Use hook to search products
  const { data: searchResults, isLoading } = useProductSearch({
    keyword: searchKeyword,
    page: 1,
    page_size: previewLimit,
    sort_by: "relevance"
  });

  // Use useEffect to ensure component is mounted and delay enabling animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Listen for scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen for click events — close preview when clicking outside the search box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchPreview(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Listen for route changes — close all panels on route change
  useEffect(() => {
    closeAllPanels();
  }, [pathname]);

  // Listen for viewport size changes — close the relevant search panel on resize
  useEffect(() => {
    const handleResize = () => {
      // If desktop size and search panel is open, close the search panel
      if (window.innerWidth >= 1024) { // lg breakpoint in Tailwind is 1024px
        setIsSearchOpen(false);
        setIsTabletSearchOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    // Initial check
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Add ResizeObserver logic
  useEffect(() => {
    const navbar = document.querySelector('.navbar-container');

    if (!navbar) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const height = entry.borderBoxSize[0].blockSize;

        document.documentElement.style.setProperty('--navbar-height', `${height}px`);
      }
    });

    resizeObserver.observe(navbar);

    return () => resizeObserver.disconnect();
  }, []);

  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const keyword = e.target.value;

    setSearchKeyword(keyword);
    setShowSearchPreview(keyword.length > 0);
  };

  // Handle search form submission
  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (searchKeyword.trim()) {
      setShowSearchPreview(false);
      // Navigate to search results page with search params
      router.push(`/search?keyword=${encodeURIComponent(searchKeyword)}`);
    }
  };

  // Handle search preview item click
  const handlePreviewItemClick = (productId: string | undefined) => {
    if (!productId) return;
    setShowSearchPreview(false);
    router.push(`/product/${productId}`);
  };

  // Optimized function to show/hide the search box
  const toggleSearch = () => {
    // Determine if it is mobile or tablet
    const isTablet = window.matchMedia('(min-width: 768px) and (max-width: 1279px)').matches;

    if (isTablet) {
      setIsTabletSearchOpen(!isTabletSearchOpen);
    } else {
      setIsSearchOpen(!isSearchOpen);
    }

    // Auto-focus search box
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  // Check if nav item matches the current page
  const isCurrentPage = (href: string) => {
    // Special handling for home page
    if (href === "/" && pathname === "/") {
      return true;
    }

    // For other pages, check if path starts with href and is a complete path segment
    // e.g. /products should match /products and /products/ but not /products/123
    if (href !== "/") {
      return pathname === href || pathname === `${href}/`;
    }

    return false;
  };

  // Add function to close all panels
  const closeAllPanels = () => {
    setIsSearchOpen(false);
    setIsTabletSearchOpen(false);
    setIsMenuOpen(false);
  };

  // Handle navigation click
  const handleNavigation = () => {
    closeAllPanels();
  };

  return (
    <motion.div
      initial={false}
      animate={shouldAnimate && isScrolled ? "scrolled" : "initial"}
      variants={navbarVariants}
      transition={{ duration: 0.3 }}
      className="w-full fixed top-0 left-0 right-0 z-[9990] navbar-container"
    >
      {/* Add global styles */}
      <style jsx global>{searchInputStyles}</style>

      <HeroUINavbar
        maxWidth="full"
        className="bg-background/95 backdrop-blur-lg border-b shadow-md transition-all duration-300"
        position="sticky"
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
      >
        {/* Outer container */}
        <div className="w-full flex justify-center">
          {/* Content width-limit container */}
          <div className="w-full max-w-[1500px] relative z-[9991]">
            {/* Navbar body */}
            <div className="flex items-center justify-between w-full h-16 lg:h-16 lg:px-8">
              {/* Logo and Search Bar Content - Left Side */}
              <div className="flex items-center gap-4 flex-1 lg:max-w-[35%] xl:max-w-[40%]">
                {/* Mobile Menu */}
                <div className="flex items-center gap-2 lg:hidden">
                  <NavbarMenuToggle
                    icon={<Menu size={20} />}
                    className="w-8 h-8 p-1.5 text-white bg-gradient-to-r from-[#1B5479] to-[#287EB7] hover:opacity-90 rounded-lg"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                  />
                </div>

                {/* Mobile centered logo */}
                <div className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 lg:hidden">
                  <NavbarBrand as="li" className="flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <NextLink className="flex justify-start items-center gap-1" href="/">
                        <Image
                          src="/logo.svg"
                          alt="Oohunt Logo"
                          width={80}
                          height={32}
                          className="object-contain inline-block"
                        />
                      </NextLink>
                    </motion.div>
                  </NavbarBrand>
                </div>

                <div className="hidden lg:flex items-center gap-2 lg:gap-3">
                  {/* Desktop logo */}
                  <NavbarBrand as="li" className="flex-shrink-0">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <NextLink className="flex justify-start items-center gap-1" href="/">
                        <Image
                          src="/logo.svg"
                          alt="Oohunt Logo"
                          width={120}
                          height={32}
                          className="object-contain inline-block"
                        />
                      </NextLink>
                    </motion.div>
                  </NavbarBrand>
                </div>
              </div>

              {/* Navigation Menu Content - Right Side */}
              <div className="hidden lg:flex items-center justify-end gap-3 lg:gap-4 xl:gap-6 flex-1">
                {/* Search bar added here — left of navigation menu */}
                <div className="hidden lg:block w-full lg:w-[280px] xl:w-[350px] 2xl:w-[400px]" ref={searchContainerRef}>
                  <form onSubmit={handleSearchSubmit} className="w-full relative group">
                    <Input
                      ref={searchInputRef}
                      aria-label="Search"
                      classNames={{
                        base: "w-full",
                        inputWrapper: "bg-white shadow-sm border border-gray-200 hover:border-gray-300 rounded-full h-10 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all duration-200",
                        input: "text-sm text-gray-900 border-0 outline-none focus:outline-none focus:ring-0 pr-[90px] h-full bg-transparent",
                        innerWrapper: "bg-transparent",
                        mainWrapper: "bg-transparent"
                      }}
                      placeholder="Search deals..."
                      size="sm"
                      type="search"
                      value={searchKeyword}
                      onChange={handleSearchInputChange}
                      onFocus={() => setShowSearchPreview(searchKeyword.length > 0)}
                      endContent={
                        <Button
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-[#F39C12] hover:bg-[#E67E22] text-white font-medium rounded-full h-8 px-4 text-sm transition-colors duration-200 flex items-center justify-center min-w-[80px]"
                          size="sm"
                          type="submit"
                        >
                          Hunt
                        </Button>
                      }
                    />
                  </form>

                  {/* Desktop Search Preview */}
                  <AnimatePresence>
                    {showSearchPreview && searchKeyword.length > 0 && (
                      <motion.div
                        variants={searchDropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute z-[9995] mt-1 bg-white rounded-lg shadow-lg overflow-hidden max-h-[400px] overflow-y-auto left-0 right-0"
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
                              {searchResults.items.slice(0, previewLimit).map((product) => (
                                <div
                                  key={product.asin || `product-${Math.random()}`}
                                  className="flex items-center p-1.5 sm:p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
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
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 mr-2 relative">
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
                                      {product.title.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                                    </p>
                                    <div className="flex items-center mt-0.5">
                                      {product.offers && product.offers[0] && (
                                        <span className="text-xs sm:text-sm font-bold text-green-600">
                                          {formatPrice(product.offers[0].price)}
                                        </span>
                                      )}
                                      {product.offers && product.offers[0]?.savings_percentage && (
                                        <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs bg-red-50 text-red-600 px-1 sm:px-1.5 py-0.5 rounded-full">
                                          {product.offers[0].savings_percentage}% OFF
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div
                              className="p-2 sm:p-3 bg-gray-50 text-left hover:bg-gray-100 cursor-pointer border-t border-gray-100"
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

                {/* Desktop Navigation */}
                <nav className="flex items-center gap-2 lg:gap-3 xl:gap-4">
                  {siteConfig.navItems.map((item) => (
                    <NextLink
                      key={item.href}
                      href={item.href}
                      className={`text-xs lg:text-sm font-medium whitespace-nowrap px-1 lg:px-2 transition-colors ${isCurrentPage(item.href)
                        ? "text-primary font-semibold border-b-2 border-primary"
                        : "text-gray-700 hover:text-primary"
                        }`}
                    >
                      {item.label}
                    </NextLink>
                  ))}
                </nav>

                {/* Auth Status - Desktop */}
                <div className="flex-shrink-0">
                  <AuthStatus />
                </div>
              </div>

              {/* Mobile Search Button - Right Side */}
              <div className="flex items-center lg:hidden">
                <MobileSearchButton toggleSearch={toggleSearch} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <MobileMenu
          isMenuOpen={isMenuOpen}
          isCurrentPage={isCurrentPage}
          handleNavigation={handleNavigation}
        />
      </HeroUINavbar>

      {/* Mobile Search */}
      <MobileSearch
        isSearchOpen={isSearchOpen}
        isTabletSearchOpen={isTabletSearchOpen}
        searchKeyword={searchKeyword}
        searchInputRef={searchInputRef}
        handleSearchSubmit={handleSearchSubmit}
        handleSearchInputChange={handleSearchInputChange}
        showSearchPreview={showSearchPreview}
        setShowSearchPreview={setShowSearchPreview}
        searchResults={searchResults}
        isLoading={isLoading}
        previewLimit={previewLimit}
        handlePreviewItemClick={handlePreviewItemClick}
      />
    </motion.div>
  );
};