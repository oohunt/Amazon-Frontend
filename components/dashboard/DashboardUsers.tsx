'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { FaGoogle } from 'react-icons/fa';

import {
    AnimatedContainer,
    AnimatedItem,
    AnimatedCard,
    AnimatedModal
} from '@/components/ui/AnimatedElements';
import ModernButton, { ActionButton } from '@/components/ui/ModernButton';
import {
    UserTableSkeleton,
    UserCardSkeleton
} from '@/components/ui/ModernLoadingSpinner';
import { pageVariants, containerVariants, itemVariants, cardVariants } from '@/lib/animations';
import { useUserList } from '@/lib/hooks';
import { UserRole, isSuperAdmin } from '@/lib/models/UserRole';
import { showSuccessToast, showErrorToast, showWarningToast } from '@/lib/toast';
import type { UserItem } from '@/types/api';

interface UserFilterProps {
    searchTerm: string;
    setSearchTerm: (value: string) => void;
    roleFilter: string;
    setRoleFilter: (value: string) => void;
}

// User filter component — modern minimalist design
const UserFilter: React.FC<UserFilterProps> = ({
    searchTerm,
    setSearchTerm,
    roleFilter,
    setRoleFilter
}) => {
    return (
        <AnimatedItem className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100 p-6 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                {/* Search input */}
                <div className="flex-1 space-y-2">
                    <label htmlFor="search" className="text-sm font-medium text-gray-700">
                        Search Users
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="search"
                            className="w-full h-11 px-4 pr-10 text-sm bg-gray-50 border-0 rounded-lg 
                                     focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none 
                                     transition-all duration-200 placeholder:text-gray-400"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Role filter */}
                <div className="w-full lg:w-48 space-y-2">
                    <label htmlFor="role-filter" className="text-sm font-medium text-gray-700">
                        Filter by Role
                    </label>
                    <select
                        id="role-filter"
                        className="w-full h-11 px-4 text-sm bg-gray-50 border-0 rounded-lg 
                                 focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none 
                                 transition-all duration-200 appearance-none cursor-pointer"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="">All Roles</option>
                        <option value={UserRole.USER}>User</option>
                        <option value={UserRole.ADMIN}>Admin</option>
                        <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                    </select>
                </div>

                {/* Reset button */}
                <div className="w-full lg:w-auto">
                    <ModernButton
                        variant="ghost"
                        size="md"
                        onClick={() => {
                            setSearchTerm('');
                            setRoleFilter('');
                        }}
                        className="w-full lg:w-auto h-11 text-gray-600 border border-gray-200 hover:bg-gray-50"
                    >
                        Clear Filters
                    </ModernButton>
                </div>
            </div>

            {/* Search result hint */}
            {(searchTerm || roleFilter) && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-100"
                >
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                            Showing users {searchTerm && `containing "${searchTerm}"`}
                            {searchTerm && roleFilter && ' and '}
                            {roleFilter && `with role "${roleFilter === UserRole.USER ? 'User' :
                                roleFilter === UserRole.ADMIN ? 'Admin' : 'Super Admin'}"`}
                        </span>
                    </div>
                </motion.div>
            )}
        </AnimatedItem>
    );
};

interface UserActionsProps {
    user: UserItem;
    currentUserRole: UserRole;
    currentUserId?: string;
    onUpdateRole: (userId: string, newRole: UserRole) => void;
    onDeleteUser: (userId: string) => void;
}

// User actions component — modern design
const UserActions: React.FC<UserActionsProps> = ({
    user,
    currentUserRole,
    currentUserId,
    onUpdateRole,
    onDeleteUser
}) => {
    const isSelf = user.id === currentUserId;

    // Modify permission check logic
    // Only super admins can modify roles, or admins can modify regular user roles
    const canUpdateRole = (isSuperAdmin(currentUserRole) ||
        (currentUserRole === UserRole.ADMIN && user.role === UserRole.USER)) && !isSelf;

    // Admins cannot delete super admins; admins can only delete regular users
    const canDelete = (isSuperAdmin(currentUserRole) ||
        (currentUserRole === UserRole.ADMIN && user.role === UserRole.USER)) && !isSelf;

    return (
        <div className="flex items-center gap-2">
            {/* View button */}
            <Link href={`/dashboard/users/${user.id}`}>
                <ActionButton
                    variant="view"
                    className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 px-3 py-1.5 text-sm border-0"
                >
                    View
                </ActionButton>
            </Link>

            {/* Change Role button */}
            {canUpdateRole && (
                <ActionButton
                    variant="edit"
                    onClick={() => {
                        const newRole = user.role === UserRole.USER
                            ? UserRole.ADMIN
                            : UserRole.USER;

                        onUpdateRole(user.id, newRole);
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 text-sm border border-blue-200 hover:border-blue-300"
                >
                    {user.role === UserRole.USER ? 'Promote' : 'Demote'}
                </ActionButton>
            )}

            {/* Delete button */}
            {canDelete && (
                <ActionButton
                    variant="delete"
                    onClick={() => onDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 text-sm border border-red-200 hover:border-red-300"
                >
                    Delete
                </ActionButton>
            )}

            {/* Self indicator */}
            {isSelf && (
                <span className="px-2 py-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md">
                    Current User
                </span>
            )}
        </div>
    );
};

const DashboardUsers: React.FC = () => {
    const { data: userList = [], isLoading, isError, mutate = () => { } } = useUserList();
    const { data: session } = useSession();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // User role update
    const handleUpdateRole = async (userId: string, newRole: UserRole) => {
        // Check if modifying own role
        if (userId === session?.user?.id) {
            showWarningToast({
                title: "Cannot Modify",
                description: "You cannot modify your own role.",
            });

            return;
        }

        // Get user role info
        const targetUser = userList.find(user => user.id === userId);

        // Check permission: regular admins cannot modify super admin or other admin roles
        if (targetUser &&
            session?.user?.role === UserRole.ADMIN &&
            (targetUser.role === UserRole.SUPER_ADMIN || targetUser.role === UserRole.ADMIN)) {
            showErrorToast({
                title: "Permission Denied",
                description: "You don't have permission to change this user's role.",
            });

            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);

                throw new Error(errorData?.error || 'Failed to update user role');
            }

            // Addsuccess toast notification
            showSuccessToast({
                title: "Role Updated",
                description: `User role has been changed to ${newRole}.`,
            });

            mutate(); // Refresh user list
        } catch (error) {
            // Adderror toast notification
            showErrorToast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Failed to update user role',
            });

        }
    };

    // Delete user
    const handleDeleteUser = (userId: string) => {
        // Check if trying to delete self
        if (userId === session?.user?.id) {
            showWarningToast({
                title: "Cannot Delete",
                description: "You cannot delete your own account.",
            });

            return;
        }

        // Get user role info
        const targetUser = userList.find(user => user.id === userId);

        // Check permission: regular admins cannot delete super admins or other admins
        if (targetUser &&
            session?.user?.role === UserRole.ADMIN &&
            (targetUser.role === UserRole.SUPER_ADMIN || targetUser.role === UserRole.ADMIN)) {
            showErrorToast({
                title: "Permission Denied",
                description: "You don't have permission to delete this user.",
            });

            return;
        }

        setConfirmDelete(userId);
    };

    const confirmUserDelete = async () => {
        if (!confirmDelete) return;
        setErrorMessage(null);

        try {
            const response = await fetch(`/api/users/${confirmDelete}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                setErrorMessage(data.error || 'Failed to delete user');

                // add delete failed toast notification
                showErrorToast({
                    title: "Error",
                    description: data.error || 'Failed to delete user',
                });

                return;
            }

            // add deleted successfully toast notification
            showSuccessToast({
                title: "User Deleted",
                description: "User has been successfully deleted.",
            });

            setConfirmDelete(null);
            mutate(); // Refresh user list
        } catch {
            setErrorMessage('Failed to delete user. Please check your network connection.');

            // Adderror toast notification
            showErrorToast({
                title: "Error",
                description: 'Failed to delete user. Please check your network connection.',
            });
        }
    };

    // Filter users by search and filter conditions
    const filteredUsers = userList.filter((user: UserItem) => {
        const matchesSearch = searchTerm === '' ||
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === '' || user.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    // Used when rendering mobile device list
    const checkCanUpdateRole = (user: UserItem) => {
        if (user.id === session?.user?.id) return false;

        // Only super admins can modify any user's role
        // Regular admins can only modify regular user roles
        return isSuperAdmin(session?.user?.role as UserRole) ||
            (session?.user?.role === UserRole.ADMIN && user.role === UserRole.USER);
    };

    const checkCanDelete = (user: UserItem) => {
        if (user.id === session?.user?.id) return false;

        // Super admin can delete any user
        // Regular admins can only delete regular users
        return isSuperAdmin(session?.user?.role as UserRole) ||
            (session?.user?.role === UserRole.ADMIN && user.role === UserRole.USER);
    };

    if (isLoading) {
        return (
            <motion.div
                className="space-y-6 max-w-full"
                variants={pageVariants}
                initial="initial"
                animate="animate"
            >
                {/* Page title skeleton */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between mb-6">
                    <motion.div
                        className="bg-gray-200 rounded h-8 w-48"
                        variants={itemVariants}
                        initial="initial"
                        animate="animate"
                    />
                    <motion.div
                        className="bg-gray-200 rounded h-6 w-32"
                        variants={itemVariants}
                        initial="initial"
                        animate="animate"
                        transition={{ delay: 0.1 }}
                    />
                </div>

                {/* Filter skeleton */}
                <motion.div
                    className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-100 p-6 mb-6"
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex flex-col lg:flex-row lg:items-end gap-6">
                        <div className="flex-1 space-y-2">
                            <div className="bg-gray-200 rounded h-4 w-16 mb-2" />
                            <div className="bg-gray-200 rounded h-11 w-full" />
                        </div>
                        <div className="w-full lg:w-48 space-y-2">
                            <div className="bg-gray-200 rounded h-4 w-16 mb-2" />
                            <div className="bg-gray-200 rounded h-11 w-full" />
                        </div>
                        <div className="w-full lg:w-auto">
                            <div className="bg-gray-200 rounded h-11 w-24" />
                        </div>
                    </div>
                </motion.div>

                {/* Desktop table skeleton */}
                <motion.div
                    className="hidden md:block"
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.3 }}
                >
                    <UserTableSkeleton />
                </motion.div>

                {/* Mobile card skeleton */}
                <motion.div
                    className="md:hidden"
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.3 }}
                >
                    <UserCardSkeleton />
                </motion.div>
            </motion.div>
        );
    }

    if (isError) {
        return (
            <motion.div
                className="space-y-6 max-w-full"
                variants={pageVariants}
                initial="initial"
                animate="animate"
            >
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                </div>

                <motion.div
                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-red-100 p-8 text-center"
                    variants={itemVariants}
                >
                    <div className="w-16 h-16 mx-auto mb-4 text-red-300">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Failed</h3>
                    <p className="text-gray-600 mb-4">Unable to load user data. Please check your network connection and try again.</p>
                    <ModernButton
                        variant="primary"
                        onClick={() => mutate()}
                        className="mx-auto"
                    >
                        Reload
                    </ModernButton>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="space-y-6 max-w-full"
            variants={pageVariants}
            initial="initial"
            animate="animate"
        >
            {/* Page title — modern design */}
            <motion.div
                className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-8"
                variants={itemVariants}
            >
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">User Management</h1>
                    <p className="text-gray-600 text-sm">
                        Manage all user accounts and permission settings in the system
                    </p>
                </div>
                <motion.div
                    className="flex items-center gap-3"
                    variants={itemVariants}
                    transition={{ delay: 0.1 }}
                >
                    <div className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {userList.length} {userList.length === 1 ? 'User' : 'Users'}
                    </div>
                    {/* Can add export or other action buttons */}
                </motion.div>
            </motion.div>

            {/* Filter component */}
            <motion.div variants={itemVariants}>
                <UserFilter
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    roleFilter={roleFilter}
                    setRoleFilter={setRoleFilter}
                />
            </motion.div>

            {/* User list — large screen table version — Notion style */}
            <AnimatedContainer className="hidden md:block">
                <motion.div
                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 overflow-hidden shadow-sm"
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                >
                    {/* Table header */}
                    <div className="border-b border-gray-50 bg-gray-50/50">
                        <div className="grid grid-cols-12 gap-4 px-6 py-4">
                            <div className="col-span-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                User Information
                            </div>
                            <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Role
                            </div>
                            <div className="col-span-2 hidden lg:block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Registration Date
                            </div>
                            <div className="col-span-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Status
                            </div>
                            <div className="col-span-1 hidden lg:block text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Sign-in Method
                            </div>
                            <div className="col-span-2 lg:col-span-2 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                                Actions
                            </div>
                        </div>
                    </div>

                    {/* Table content */}
                    <motion.div
                        className="divide-y divide-gray-50"
                        variants={containerVariants}
                        initial="initial"
                        animate="animate"
                    >
                        {filteredUsers?.length === 0 ? (
                            <motion.div
                                className="px-6 py-12 text-center"
                                variants={itemVariants}
                            >
                                <div className="w-12 h-12 mx-auto mb-4 text-gray-300">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <p className="text-gray-500 text-sm">No users found matching your criteria</p>
                            </motion.div>
                        ) : (
                            filteredUsers?.map((user, _) => (
                                <motion.div
                                    key={user.id}
                                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors duration-150 group"
                                    variants={itemVariants}
                                >
                                    {/* User info */}
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                                            {user.image ? (
                                                <Image
                                                    src={user.image}
                                                    alt={`${user.name}'s avatar`}
                                                    width={40}
                                                    height={40}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600 font-medium text-sm">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {user.name}
                                                </p>
                                                {user.provider === 'google' && (
                                                    <FaGoogle className="w-3 h-3 text-red-500 flex-shrink-0" title="Google Account" />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Role */}
                                    <div className="col-span-2 flex items-center">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border
                                            ${user.role === UserRole.SUPER_ADMIN
                                                ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                user.role === UserRole.ADMIN
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                            {user.role === UserRole.SUPER_ADMIN ? 'Super Admin' :
                                                user.role === UserRole.ADMIN ? 'Admin' : 'User'}
                                        </span>
                                    </div>

                                    {/* Registration time */}
                                    <div className="col-span-2 hidden lg:flex items-center">
                                        <span className="text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-1 flex items-center">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full 
                                                ${user.status === 'active' ? 'bg-green-400' :
                                                    user.status === 'inactive' ? 'bg-yellow-400' : 'bg-red-400'}`}
                                            />
                                            <span className="text-xs text-gray-600">
                                                {user.status === 'active' ? 'Active' :
                                                    user.status === 'inactive' ? 'Inactive' : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Login method */}
                                    <div className="col-span-1 hidden lg:flex items-center">
                                        {user.provider === 'google' ? (
                                            <div className="flex items-center gap-1.5">
                                                <FaGoogle className="w-3 h-3 text-red-500" />
                                                <span className="text-xs text-gray-600">Google</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-600">Email</span>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    <div className="col-span-2 lg:col-span-2 flex items-center justify-end">
                                        <UserActions
                                            user={user}
                                            currentUserRole={session?.user?.role as UserRole}
                                            currentUserId={session?.user?.id}
                                            onUpdateRole={handleUpdateRole}
                                            onDeleteUser={handleDeleteUser}
                                        />
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </motion.div>
            </AnimatedContainer>

            {/* User list — mobile card version — modern design */}
            <AnimatedContainer className="md:hidden space-y-4">
                {filteredUsers?.length === 0 ? (
                    <motion.div
                        className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-8 text-center"
                        variants={itemVariants}
                    >
                        <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-500">No users found matching your criteria</p>
                    </motion.div>
                ) : (
                    filteredUsers?.map((user, _) => (
                        <AnimatedCard
                            key={user.id}
                            className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 p-5 shadow-sm"
                            hover={true}
                        >
                            {/* User header info */}
                            <div className="flex items-start gap-4 mb-4">
                                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0">
                                    {user.image ? (
                                        <Image
                                            src={user.image}
                                            alt={`${user.name}'s avatar`}
                                            width={48}
                                            height={48}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-medium">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-base font-semibold text-gray-900 truncate">
                                            {user.name}
                                        </h3>
                                        {user.provider === 'google' && (
                                            <FaGoogle className="w-4 h-4 text-red-500 flex-shrink-0" title="Google Account" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {user.email}
                                    </p>
                                </div>

                                {/* Status indicator */}
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2.5 h-2.5 rounded-full 
                                        ${user.status === 'active' ? 'bg-green-400' :
                                            user.status === 'inactive' ? 'bg-yellow-400' : 'bg-red-400'}`}
                                    />
                                    <span className="text-xs text-gray-600 font-medium">
                                        {user.status === 'active' ? 'Active' :
                                            user.status === 'inactive' ? 'Inactive' : 'Disabled'}
                                    </span>
                                </div>
                            </div>

                            {/* Details grid */}
                            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50/50 rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Role</p>
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border
                                        ${user.role === UserRole.SUPER_ADMIN
                                            ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                            user.role === UserRole.ADMIN
                                                ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                        {user.role === UserRole.SUPER_ADMIN ? 'Super Admin' :
                                            user.role === UserRole.ADMIN ? 'Admin' : 'User'}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Sign-in Method</p>
                                    {user.provider === 'google' ? (
                                        <div className="flex items-center gap-1.5">
                                            <FaGoogle className="w-3 h-3 text-red-500" />
                                            <span className="text-xs text-gray-700 font-medium">Google</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-700 font-medium">Email</span>
                                    )}
                                </div>

                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 mb-1">Registration Date</p>
                                    <span className="text-xs text-gray-700 font-medium">
                                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Action buttons area */}
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    {checkCanUpdateRole(user) && (
                                        <ActionButton
                                            variant="edit"
                                            onClick={() => {
                                                const newRole = user.role === UserRole.USER
                                                    ? UserRole.ADMIN
                                                    : UserRole.USER;

                                                handleUpdateRole(user.id, newRole);
                                            }}
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 text-sm border border-blue-200"
                                        >
                                            {user.role === UserRole.USER ? 'Promote' : 'Demote'}
                                        </ActionButton>
                                    )}

                                    {checkCanDelete(user) && (
                                        <ActionButton
                                            variant="delete"
                                            onClick={() => handleDeleteUser(user.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 text-sm border border-red-200"
                                        >
                                            Delete
                                        </ActionButton>
                                    )}
                                </div>

                                <Link href={`/dashboard/users/${user.id}`}>
                                    <ActionButton
                                        variant="view"
                                        className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 px-4 py-1.5 text-sm border border-gray-200"
                                    >
                                        View
                                    </ActionButton>
                                </Link>
                            </div>

                            {/* Current user indicator */}
                            {user.id === session?.user?.id && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                        Current User
                                    </span>
                                </div>
                            )}
                        </AnimatedCard>
                    ))
                )}
            </AnimatedContainer>

            {/* Delete confirmation popup - modern design */}
            <AnimatedModal
                isOpen={!!confirmDelete}
                onClose={() => {
                    setConfirmDelete(null);
                    setErrorMessage(null);
                }}
                className="max-w-md"
            >
                <div className="p-6">
                    {/* Modal header */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Confirm User Deletion</h3>
                            <p className="text-sm text-gray-500">This action cannot be undone</p>
                        </div>
                    </div>

                    {/* Error message */}
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <p className="text-sm text-red-700">{errorMessage}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* Warning content */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700 text-sm leading-relaxed">
                            Are you sure you want to delete this user? This action will permanently remove all user data, including:
                        </p>
                        <ul className="mt-2 text-sm text-gray-600 space-y-1">
                            <li className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                User personal information and settings
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                All activity records related to this user
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                                User access permissions and sessions
                            </li>
                        </ul>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <ModernButton
                            variant="ghost"
                            onClick={() => {
                                setConfirmDelete(null);
                                setErrorMessage(null);
                            }}
                            className="flex-1 justify-center border border-gray-300 hover:bg-gray-50"
                        >
                            Cancel
                        </ModernButton>

                        <ModernButton
                            variant="danger"
                            onClick={confirmUserDelete}
                            className="flex-1 justify-center"
                            loading={false} // Can add loading status as needed
                        >
                            Delete User
                        </ModernButton>
                    </div>
                </div>
            </AnimatedModal>
        </motion.div>
    );
};

export default DashboardUsers; 