'use client';

import { TrendingUp, TrendingDown, BarChart3, Users, Package, Heart, Clock, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useHealthStatus, useUserStats, useFavoriteStats } from '@/lib/hooks';
import { formatDate } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: number;
    change: number;
    icon: React.ReactNode;
    lastUpdate?: string;
    className?: string;
    loading?: boolean;
    color: string;
}

// Number counting animation component
const CountUpNumber: React.FC<{ end: number; duration?: number }> = ({ end, duration = 1000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        const startCount = 0;
        const difference = end - startCount;

        const updateCount = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            setCount(Math.floor(startCount + difference * progress));

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            }
        };

        requestAnimationFrame(updateCount);
    }, [end, duration]);

    return <span>{count.toLocaleString()}</span>;
};

// Progress bar component
const ProgressBar: React.FC<{ percentage: number; color: string }> = ({ percentage, color }) => {
    return (
        <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                    width: `${Math.min(Math.abs(percentage) * 10, 100)}%`,
                    backgroundColor: color
                }}
            />
        </div>
    );
};

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    change,
    icon,
    lastUpdate,
    className,
    loading = false,
    color
}) => {
    if (loading) {
        return (
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className || ''}`}>
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded-lg w-2/3" />
                    <div className="h-8 bg-gray-200 rounded-lg w-1/2" />
                    <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
                </div>
            </div>
        );
    }

    const isPositive = change >= 0;

    return (
        <div className={`group bg-white rounded-xl shadow-sm border border-gray-100 p-6 
            hover:shadow-lg hover:border-gray-200 transition-all duration-300 
            hover:transform hover:scale-[1.02] relative overflow-hidden ${className || ''}`}>

            {/* Subtle background decoration */}
            <div
                className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundColor: color }}
            />

            {/* Header */}
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 mb-3">
                        {title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 tracking-tight">
                        <CountUpNumber end={value} />
                    </p>
                </div>
                <div
                    className="p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ backgroundColor: `${color}15`, color: color }}
                >
                    {icon}
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <ProgressBar percentage={change} color={color} />
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm relative z-10">
                <div className="flex items-center space-x-2">
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-300
                        ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>{Math.abs(change).toFixed(1)}%</span>
                    </div>
                    <span className="text-gray-500">vs last month</span>
                </div>

                {lastUpdate && (
                    <div className="flex items-center space-x-1 text-gray-400">
                        <Clock size={12} className="animate-pulse" />
                        <span className="text-xs">{formatDate(new Date(lastUpdate)).split(' ')[0]}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const MetricCard: React.FC<{
    title: string;
    value: string;
    subtitle: string;
    loading?: boolean;
    delay?: number;
}> = ({ title, value, subtitle, loading = false, delay = 0 }) => {
    if (loading) {
        return (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
            </div>
        );
    }

    return (
        <div
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 
                hover:from-blue-50 hover:to-indigo-50 hover:border-blue-200 transition-all duration-500
                transform hover:scale-105 hover:shadow-md"
            style={{ animationDelay: `${delay}ms` }}
        >
            <p className="text-xs text-gray-600 mb-1 font-medium">{title}</p>
            <p className="text-lg font-bold text-gray-900 mb-1">
                <CountUpNumber end={parseInt(value.replace(/,/g, ''))} />
            </p>
            <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
    );
};

const DashboardOverview: React.FC = () => {
    const { data: healthData, isLoading: isLoadingHealth } = useHealthStatus();
    const { data: userData, isLoading: isLoadingUsers } = useUserStats();
    const { data: favoritesData, isLoading: isLoadingFavorites } = useFavoriteStats();

    const [stats, setStats] = useState({
        total_products: 0,
        discount_products: 0,
        coupon_products: 0,
        prime_products: 0,
        total_users: 0,
        total_favorites: 0,
        last_update: '',
        changes: {
            total: 0,
            discount: 0,
            coupon: 0,
            prime: 0,
            users: 0,
            favorites: 0
        }
    });

    useEffect(() => {
        if (healthData) {
            const dbData = healthData.database || healthData;

            if (dbData.total_products !== undefined) {
                setStats(prev => ({
                    ...prev,
                    total_products: dbData.total_products,
                    discount_products: dbData.discount_products,
                    coupon_products: dbData.coupon_products,
                    prime_products: dbData.prime_products,
                    last_update: dbData.last_update,
                    changes: {
                        ...prev.changes,
                        total: 5.2,
                        discount: 3.8,
                        coupon: 2.1,
                        prime: 4.7
                    }
                }));
            }
        }
    }, [healthData]);

    useEffect(() => {
        if (userData && userData.total_users !== undefined) {
            setStats(prev => ({
                ...prev,
                total_users: userData.total_users,
                changes: {
                    ...prev.changes,
                    users: ((userData.new_users_last_month / userData.total_users) * 100) || 0
                }
            }));
        }
    }, [userData]);

    useEffect(() => {
        if (favoritesData && favoritesData.total_favorites !== undefined) {
            setStats(prev => ({
                ...prev,
                total_favorites: favoritesData.total_favorites,
                changes: {
                    ...prev.changes,
                    favorites: ((favoritesData.last_month_favorites / favoritesData.total_favorites) * 100) || 0
                }
            }));
        }
    }, [favoritesData]);

    const productCards = [
        {
            title: "Total Products",
            value: stats.total_products,
            change: stats.changes.total,
            icon: <Package size={20} />,
            loading: isLoadingHealth,
            color: "#3B82F6"
        },
        {
            title: "Discount Products",
            value: stats.discount_products,
            change: stats.changes.discount,
            icon: <BarChart3 size={20} />,
            loading: isLoadingHealth,
            color: "#F59E0B"
        },
        {
            title: "Coupon Products",
            value: stats.coupon_products,
            change: stats.changes.coupon,
            icon: <Activity size={20} />,
            loading: isLoadingHealth,
            color: "#10B981"
        },
        {
            title: "Prime Products",
            value: stats.prime_products,
            change: stats.changes.prime,
            icon: <TrendingUp size={20} />,
            loading: isLoadingHealth,
            color: "#8B5CF6"
        }
    ];

    return (
        <div className="space-y-8 max-w-full relative">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full opacity-30 animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-green-100 to-blue-100 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between relative z-10">
                <div className="animate-fade-in-up">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
                    <p className="text-gray-600 flex items-center">
                        <Activity size={16} className="mr-2 text-blue-500" />
                        Real-time insights into your platform&#39;s performance
                    </p>
                </div>
                {stats.last_update && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mt-4 sm:mt-0 
                        animate-fade-in-up bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200">
                        <Clock size={16} />
                        <span>Last updated: {new Date(stats.last_update).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</span>
                    </div>
                )}
            </div>

            {/* Product Statistics */}
            <div className="relative z-10">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3" />
                    Product Statistics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {productCards.map((card, index) => (
                        <div
                            key={`product-card-${card.title.toLowerCase().replace(/\s+/g, '-')}`}
                            style={{ animationDelay: `${index * 150}ms` }}
                            className="animate-fade-in-up"
                        >
                            <StatsCard
                                title={card.title}
                                value={card.value}
                                change={card.change}
                                icon={card.icon}
                                lastUpdate={stats.last_update}
                                loading={card.loading}
                                color={card.color}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* User & Engagement Section */}
            <div className="relative z-10">
                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                    <div className="w-1 h-6 bg-gradient-to-b from-pink-500 to-red-500 rounded-full mr-3" />
                    Users & Favorites
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                        <StatsCard
                            title="Total Users"
                            value={stats.total_users}
                            change={stats.changes.users}
                            icon={<Users size={20} />}
                            lastUpdate={userData?.last_update || stats.last_update}
                            loading={isLoadingUsers}
                            color="#EC4899"
                        />
                    </div>
                    <div className="animate-fade-in-up" style={{ animationDelay: '750ms' }}>
                        <StatsCard
                            title="Total Favorites"
                            value={stats.total_favorites}
                            change={stats.changes.favorites}
                            icon={<Heart size={20} />}
                            lastUpdate={favoritesData?.last_update || stats.last_update}
                            loading={isLoadingFavorites}
                            color="#EF4444"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 relative z-10 animate-fade-in-up overflow-hidden" style={{ animationDelay: '900ms' }}>
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50" />

                <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center relative z-10">
                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full mr-3" />
                    Quick Summary
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
                    <MetricCard
                        title="Products"
                        value={stats.total_products.toLocaleString()}
                        subtitle="Total items"
                        loading={isLoadingHealth}
                        delay={0}
                    />
                    <MetricCard
                        title="Discounted"
                        value={stats.discount_products.toLocaleString()}
                        subtitle="On sale"
                        loading={isLoadingHealth}
                        delay={100}
                    />
                    <MetricCard
                        title="Active Users"
                        value={stats.total_users.toString()}
                        subtitle="Registered"
                        loading={isLoadingUsers}
                        delay={200}
                    />
                    <MetricCard
                        title="Favorites"
                        value={stats.total_favorites.toString()}
                        subtitle="Total likes"
                        loading={isLoadingFavorites}
                        delay={300}
                    />
                </div>

                <div className="border-t border-gray-200 pt-6 relative z-10">
                    <div className="prose max-w-none text-sm text-gray-600 leading-relaxed">
                        <p className="mb-3">
                            Your platform currently hosts <strong className="text-gray-900 font-semibold">{stats.total_products.toLocaleString()}</strong> products,
                            including <strong className="text-amber-600 font-semibold">{stats.discount_products.toLocaleString()}</strong> discounted items,
                            <strong className="text-green-600 font-semibold"> {stats.coupon_products.toLocaleString()}</strong> coupon products, and
                            <strong className="text-purple-600 font-semibold"> {stats.prime_products.toLocaleString()}</strong> prime products.
                        </p>
                        <p className="mb-4">
                            Community engagement shows <strong className="text-gray-900 font-semibold">{stats.total_users}</strong> registered users
                            with <strong className="text-gray-900 font-semibold">{stats.total_favorites}</strong> total favorites across the platform.
                        </p>
                        <div className="flex items-center text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />
                            All data is based on the last update time and statistics may have a delay.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardOverview; 