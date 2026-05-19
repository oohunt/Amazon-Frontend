'use client';

import {
    ChevronLeft,
    ChevronRight,
    Menu,
    BarChart3,
    Users,
    Package,
    Plus,
    Mail,
    FileText,
    Settings,
    LogOut
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef, createContext, useContext } from 'react';

import { UserRole } from '@/lib/models/UserRole';

// create a context for save button status
export const DashboardSaveContext = createContext<{
    saveButton: React.ReactNode | null;
    setSaveButton: (button: React.ReactNode | null) => void;
}>({
    saveButton: null,
    setSaveButton: () => { }
});

// create hook for child components
export const useDashboardSave = () => useContext(DashboardSaveContext);

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const { data: session } = useSession();
    const pathname = usePathname();
    const scrollPosition = useRef(0);
    const [saveButton, setSaveButton] = useState<React.ReactNode | null>(null);

    // Responsive handling
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth < 768;

            setIsMobile(newIsMobile);
            // Wide screens default to expanded, narrow screens default to collapsed
            if (newIsMobile !== isMobile) {
                setIsSidebarOpen(window.innerWidth >= 1024);
            }
        };

        // Prevent horizontal scrollbar
        document.documentElement.style.overflowX = 'hidden';
        document.body.style.overflowX = 'hidden';

        // reset dashboard page body padding-top
        const originalPaddingTop = document.body.style.paddingTop;

        document.body.style.paddingTop = '0';

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            // Restore defaults on cleanup
            document.documentElement.style.overflowX = '';
            document.body.style.overflowX = '';
            // Restore original padding-top
            document.body.style.paddingTop = originalPaddingTop;
        };
    }, [isMobile]);

    // Implement more robust scroll locking
    useEffect(() => {
        if (isMobile && isSidebarOpen) {
            // save current scroll position
            scrollPosition.current = window.scrollY;
            // Lock scroll — set fixed position and hide overflow
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollPosition.current}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';
        } else {
            // Restore scrolling
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            // Restore scrolling position
            if (scrollPosition.current > 0) {
                window.scrollTo(0, scrollPosition.current);
            }
        }

        return () => {
            // Restore scroll ability when component unmounts
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            // Restore scrolling position
            if (scrollPosition.current > 0) {
                window.scrollTo(0, scrollPosition.current);
            }
        };
    }, [isMobile, isSidebarOpen]);

    // Clean navigation configuration
    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'Products', href: '/dashboard/products', icon: Package },
        { name: 'Manual Add', href: '/dashboard/products/manual', icon: Plus },
        { name: 'Emails', href: '/dashboard/emails', icon: Mail },
        { name: 'CMS', href: '/dashboard/cms/pages', icon: FileText },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    ];

    if (!session?.user || !session.user.role ||
        (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
        return <div className="p-4">No access to dashboard</div>;
    }

    const closeSidebar = () => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    const handleSignOut = () => {
        signOut({ callbackUrl: '/' });
    };

    return (
        <DashboardSaveContext.Provider value={{ saveButton, setSaveButton }}>
            <div className="flex bg-gray-50 overflow-hidden" style={{ height: '100dvh', minHeight: '100vh' }}>
                {/* Mobile background overlay */}
                {isMobile && isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
                        onClick={closeSidebar}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                closeSidebar();
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label="Close sidebar"
                    />
                )}

                {/* Sidebar - clean light design */}
                <aside
                    className={`fixed md:sticky top-0 left-0 z-50 h-full flex-shrink-0 overflow-hidden
                        ${isSidebarOpen ? 'w-64' : isMobile ? 'w-0' : 'w-16'} 
                        ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
                        transition-all duration-300 ease-in-out`}
                >
                    <div className="flex flex-col h-full bg-white shadow-lg border-r border-gray-200 w-full">
                        {/* Sidebar header */}
                        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
                            {(isSidebarOpen || !isMobile) && (
                                <>
                                    <div className={`transition-all duration-300 overflow-hidden
                                        ${(!isSidebarOpen && !isMobile) ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
                                        <div className="flex items-center space-x-2 whitespace-nowrap">
                                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <span className="text-white font-bold text-sm">O</span>
                                            </div>
                                            {isSidebarOpen && <span className="text-gray-900 font-semibold text-lg">OOHUNT</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-gray-900 flex-shrink-0"
                                        aria-label={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
                                    >
                                        {isSidebarOpen
                                            ? <ChevronLeft size={20} />
                                            : <ChevronRight size={20} />
                                        }
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Navigation menu */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 min-h-0">
                            <nav className="space-y-1">
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href ||
                                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center rounded-lg group relative transition-all duration-200 w-full
                                                ${isActive
                                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                } ${(!isSidebarOpen && !isMobile) ? 'justify-center p-3' : 'px-3 py-2'}`}
                                            onClick={isMobile ? closeSidebar : undefined}
                                        >
                                            <Icon size={20} className={`${isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'} transition-colors flex-shrink-0`} />

                                            {(isSidebarOpen || isMobile) && (
                                                <span className="ml-3 whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {item.name}
                                                </span>
                                            )}

                                            {/* Active state indicator */}
                                            {isActive && (isSidebarOpen || isMobile) && (
                                                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-full" />
                                            )}

                                            {/* Tooltip — shown only when collapsed */}
                                            {!isSidebarOpen && !isMobile && (
                                                <div className="fixed left-20 z-[60] whitespace-nowrap bg-gray-900 text-white px-2 py-1 rounded 
                                                    opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none text-sm
                                                    transform group-hover:translate-x-0 -translate-x-2"
                                                    style={{
                                                        top: 'var(--mouse-y, 50%)',
                                                        transform: 'translateY(-50%)'
                                                    }}
                                                >
                                                    {item.name}
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Bottom user info */}
                        <div className="border-t border-gray-200 p-2 flex-shrink-0">
                            {(isSidebarOpen || isMobile) ? (
                                <div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-medium text-sm">
                                                {session.user.image ? (
                                                    <Image
                                                        src={session.user.image}
                                                        alt="Profile"
                                                        width={32}
                                                        height={32}
                                                        className="rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    session.user.name?.charAt(0) || 'U'
                                                )}
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {session.user.name || session.user.email}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {session.user.role}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Logout button */}
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full mt-2 flex items-center space-x-3 px-3 py-2 rounded-lg 
                                            text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 group"
                                    >
                                        <LogOut size={18} className="text-gray-500 group-hover:text-red-600 flex-shrink-0" />
                                        <span className="text-sm font-medium">Sign Out</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center space-y-2 w-full">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-medium text-sm hover:bg-blue-700 transition-colors">
                                            {session.user.image ? (
                                                <Image
                                                    src={session.user.image}
                                                    alt="Profile"
                                                    width={32}
                                                    height={32}
                                                    className="rounded-lg object-cover"
                                                />
                                            ) : (
                                                session.user.name?.charAt(0) || 'U'
                                            )}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />

                                        {/* Hover tooltip */}
                                        <div className="fixed left-20 z-[60] whitespace-nowrap bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform -translate-y-1/2 top-1/2">
                                            {session.user.name || session.user.email}
                                        </div>
                                    </div>

                                    {/* Logout button in collapsed state */}
                                    <button
                                        onClick={handleSignOut}
                                        className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group relative"
                                        title="Sign Out"
                                    >
                                        <LogOut size={16} />

                                        {/* Hover tooltip */}
                                        <div className="fixed left-20 z-[60] whitespace-nowrap bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none transform -translate-y-1/2 top-1/2">
                                            Sign Out
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main content area */}
                <div
                    className={`flex-1 flex flex-col min-w-0 min-h-0 transition-all duration-300 ${isMobile && isSidebarOpen ? 'opacity-50' : 'opacity-100'}`}
                >
                    {/* Top navbar */}
                    <header className="bg-white shadow-sm border-b border-gray-200 z-20 flex-shrink-0">
                        <div className="flex h-16 items-center justify-between px-4 md:px-6 min-w-0">
                            <div className="flex items-center min-w-0 flex-1">
                                {isMobile && (
                                    <button
                                        onClick={() => setIsSidebarOpen(true)}
                                        className="p-2 rounded-lg hover:bg-gray-100 mr-2 text-gray-600 hover:text-gray-900 
                                            transition-colors duration-200 flex-shrink-0"
                                        aria-label="Open Menu"
                                    >
                                        <Menu size={20} />
                                    </button>
                                )}
                                <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate">
                                    {navigation.find(item => pathname.startsWith(item.href))?.name || 'Dashboard'}
                                </h2>
                            </div>

                            <div className="flex items-center gap-4 flex-shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600 font-medium truncate max-w-32 md:max-w-none">
                                        {session.user.name || session.user.email}
                                    </span>
                                    <span className="hidden md:inline px-2 py-1 text-xs font-medium text-blue-700 
                                        bg-blue-100 rounded-full whitespace-nowrap">
                                        {session.user.role}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Breadcrumb navigation */}
                        <div className="px-4 md:px-6 py-2 border-t border-gray-100 bg-gray-50 flex justify-between items-center min-w-0">
                            <div className="text-sm text-gray-600 flex items-center space-x-2 min-w-0 flex-1">
                                <Link href="/" className="hover:text-blue-600 transition-colors whitespace-nowrap">Home</Link>
                                <span className="text-gray-400">/</span>
                                <span className="font-medium text-gray-900 truncate">
                                    {navigation.find(item => pathname.startsWith(item.href))?.name || 'Dashboard'}
                                </span>
                            </div>

                            {/* Save button area */}
                            <div className="flex-shrink-0 ml-4">
                                {saveButton}
                            </div>
                        </div>
                    </header>

                    {/* Content area */}
                    <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 min-w-0 min-h-0">
                        <div className="w-full max-w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div >
        </DashboardSaveContext.Provider >
    );
};

export default DashboardLayout;