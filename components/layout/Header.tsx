import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import { useCategoryStats } from '@/lib/hooks';
import { useUserStore } from '@/store';


interface Category {
    id: string;
    name: string;
    count?: number;
}

interface BrowseNode {
    name?: string;
    count?: number;
}

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const { theme, toggleTheme } = useUserStore();
    const { data: categoryStats } = useCategoryStats();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Extract category list from browse_nodes
    const categories: Category[] = categoryStats?.browse_nodes ?
        Object.entries(categoryStats.browse_nodes).map(([id, data]: [string, BrowseNode]) => ({
            id,
            name: data.name || id,
            count: data.count || 0
        })) : [];

    // Listen for scroll
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-md shadow-lg' : 'bg-transparent'
                }`}
        >
            <nav className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-bold bg-gradient-primary text-transparent bg-clip-text">
                        AmazonDeals
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/deals" className="nav-link">
                            Limited-time Deals
                        </Link>
                        <div className="relative group">
                            <button className="nav-link">Categories</button>
                            <div className="absolute top-full left-0 hidden group-hover:block">
                                <div className="bg-background shadow-xl rounded-lg p-4 mt-2 min-w-[200px]">
                                    {categories?.map((category: Category) => (
                                        <Link
                                            key={category.id}
                                            href={`/category/${category.id}`}
                                            className="block py-2 px-4 hover:bg-primary/10 rounded-lg"
                                        >
                                            {category.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Link href="/favorites" className="nav-link">
                            Favorites
                        </Link>
                        <Link href="/about-us" className="nav-link">
                            About Us
                        </Link>
                    </div>

                    {/* Theme Toggle & Mobile Menu */}
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                        >
                            {theme === 'light' ? '🌙' : '☀️'}
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            className="md:hidden p-2"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <span className="sr-only">Menu</span>
                            <div className="w-6 h-6 flex flex-col justify-around">
                                <span className={`block w-full h-0.5 bg-text transition-all ${isMenuOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
                                <span className={`block w-full h-0.5 bg-text transition-all ${isMenuOpen ? 'opacity-0' : ''}`} />
                                <span className={`block w-full h-0.5 bg-text transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden mt-4"
                        >
                            <div className="flex flex-col space-y-4 py-4">
                                <Link href="/deals" className="nav-link">
                                    Limited-time Deals
                                </Link>
                                <Link href="/favorites" className="nav-link">
                                    Favorites
                                </Link>
                                <Link href="/about-us" className="nav-link">
                                    About Us
                                </Link>
                                <div className="border-t border-text/10 pt-4">
                                    <div className="font-medium mb-2">Categories</div>
                                    <div className="space-y-2">
                                        {categories?.map((category: Category) => (
                                            <Link
                                                key={category.id}
                                                href={`/category/${category.id}`}
                                                className="block py-2 hover:bg-primary/10 rounded-lg"
                                            >
                                                {category.name}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
};

export default Header; 