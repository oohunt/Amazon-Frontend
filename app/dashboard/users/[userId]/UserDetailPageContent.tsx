'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { FaGoogle } from 'react-icons/fa';

import { UserRole, isSuperAdmin } from '@/lib/models/UserRole';
import { showSuccessToast, showErrorToast } from '@/lib/toast';
import type { UserItem } from '@/types/api';

export function UserDetailPageContent({ userId }: { userId: string }) {
    const router = useRouter();
    const { data: session } = useSession();
    const [user, setUser] = useState<UserItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/users/${userId}`);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => null);

                    throw new Error(errorData?.error || `Failed to fetch user details: ${response.statusText}`);
                }

                const data = await response.json();

                // Use the returned data directly, as the API returns the user object directly
                setUser(data);
                setSelectedRole(data.role);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error fetching user data');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUserDetails();
        }
    }, [userId]);

    const handleDeleteUser = async () => {
        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // Attempt to parse the JSON response
                const errorData = await response.json().catch(() => null);

                // Extract error message
                let errorMsg = `Failed to delete user: ${response.status} ${response.statusText}`;

                if (errorData && errorData.error) {
                    errorMsg = errorData.error;
                    if (errorData.details) {
                        errorMsg += `: ${errorData.details}`;
                    }
                }

                throw new Error(errorMsg);
            }

            // Show success toast notification
            showSuccessToast({
                title: "User Deleted",
                description: "The user has been successfully deleted.",
            });

            // Return to the user list page after successful deletion
            router.push('/dashboard/users');
        } catch (err) {
            // Show error toast notification
            showErrorToast({
                title: "Error",
                description: err instanceof Error ? err.message : 'Failed to delete user',
            });

            setError(err instanceof Error ? err.message : 'Error deleting user');
        }
    };

    const handleRoleChange = async () => {
        if (!selectedRole || selectedRole === user?.role) {
            setShowRoleModal(false);

            return;
        }

        try {
            const response = await fetch(`/api/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: selectedRole }),
            });

            if (!response.ok) {
                throw new Error(`Failed to update user role: ${response.statusText}`);
            }

            // AddRoleUpdatesuccess toast notification
            showSuccessToast({
                title: "Role Updated",
                description: `User role has been changed to ${selectedRole}.`,
            });

            // update local user data
            setUser(prev => prev ? { ...prev, role: selectedRole } : null);
            setShowRoleModal(false);
        } catch (err) {
            // Adderror toast notification
            showErrorToast({
                title: "Error",
                description: err instanceof Error ? err.message : 'Failed to update user role',
            });
            setError(err instanceof Error ? err.message : 'Error updating user role');
        }
    };

    const openRoleModal = () => {
        setSelectedRole(user?.role || null);
        setShowRoleModal(true);
    };

    const canModifyRole = session?.user?.role === UserRole.SUPER_ADMIN;
    const canDeleteUser = isSuperAdmin(session?.user?.role as UserRole) ||
        (session?.user?.role === UserRole.ADMIN && user?.role === UserRole.USER);
    const isSelf = session?.user?.id === userId;

    if (loading) {
        return (
            <div className="animate-pulse space-y-4 max-w-full">
                <div className="h-8 bg-gray-200 rounded w-1/4" />
                <div className="h-64 bg-gray-200 rounded w-full" />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6 max-w-full">
                <p>{error || 'User not found'}</p>
                <Link href="/dashboard/users" className="text-blue-600 underline mt-2 inline-block">
                    Back to Users List
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Users Detail</h1>
                <Link
                    href="/dashboard/users"
                    className="text-blue-600 hover:text-blue-800"
                >
                    Back to Users List
                </Link>
            </div>

            {/* User basic info card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-semibold overflow-hidden">
                        {user.image ? (
                            <Image
                                src={user.image}
                                alt={`${user.name}'s avatar`}
                                width={64}
                                height={64}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            user.name.charAt(0)
                        )}
                    </div>
                    <div>
                        <div className="flex items-center">
                            <h2 className="text-xl font-bold">{user.name}</h2>
                            {user.provider === 'google' && (
                                <FaGoogle className="ml-2 text-red-500" title="Google account" />
                            )}
                        </div>
                        <p className="text-gray-600">{user.email}</p>
                        <div className="mt-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                                ${user.role === UserRole.SUPER_ADMIN ? 'bg-purple-100 text-purple-800' :
                                    user.role === UserRole.ADMIN ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'}`}>
                                {user.role === UserRole.SUPER_ADMIN ? 'Super Admin' :
                                    user.role === UserRole.ADMIN ? 'Admin' : 'User'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Registration Time</p>
                        <p className="font-medium">{new Date(user.createdAt).toLocaleString('en-US')}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Last Login</p>
                        <p className="font-medium">
                            {user.lastLogin
                                ? new Date(user.lastLogin).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: false
                                })
                                : 'Never logged in'
                            }
                        </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">User Role</p>
                        <p className="font-medium">{user.role}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">Account Status</p>
                        <p className="font-medium">{user.status === 'active' ? 'Active' : user.status === 'inactive' ? 'Inactive' : 'Disabled'}</p>
                    </div>
                    {user.provider && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">Authentication Provider</p>
                            <p className="font-medium flex items-center">
                                {user.provider === 'google' ? (
                                    <>
                                        <FaGoogle className="mr-1 text-red-500" />
                                        Google
                                    </>
                                ) : user.provider === 'credentials' ? 'Password' : user.provider}
                            </p>
                        </div>
                    )}
                </div>

                {/* User action area */}
                <div className="border-t pt-4 flex flex-col md:flex-row md:justify-end space-y-2 md:space-y-0 md:space-x-2">
                    {canModifyRole && !isSelf && (
                        <button
                            onClick={openRoleModal}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Change Role
                        </button>
                    )}

                    {canDeleteUser && !isSelf && (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ml-auto md:ml-0"
                        >
                            Delete User
                        </button>
                    )}
                </div>
            </div>

            {/* Change Role modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Change User Role</h3>
                        <p className="text-gray-600 mb-4">
                            Change the role for user <span className="font-semibold">{user.name}</span>
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Role:
                            </label>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="role-user"
                                        type="radio"
                                        name="role"
                                        value={UserRole.USER}
                                        checked={selectedRole === UserRole.USER}
                                        onChange={() => setSelectedRole(UserRole.USER)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="role-user" className="ml-2 text-gray-700">
                                        User - Regular user with basic access
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="role-admin"
                                        type="radio"
                                        name="role"
                                        value={UserRole.ADMIN}
                                        checked={selectedRole === UserRole.ADMIN}
                                        onChange={() => setSelectedRole(UserRole.ADMIN)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="role-admin" className="ml-2 text-gray-700">
                                        Admin - Can manage most features except users
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="role-super-admin"
                                        type="radio"
                                        name="role"
                                        value={UserRole.SUPER_ADMIN}
                                        checked={selectedRole === UserRole.SUPER_ADMIN}
                                        onChange={() => setSelectedRole(UserRole.SUPER_ADMIN)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="role-super-admin" className="ml-2 text-gray-700">
                                        Super Admin - Full access to all features
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <button
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 w-full sm:w-auto"
                                onClick={() => setShowRoleModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 w-full sm:w-auto"
                                onClick={handleRoleChange}
                                disabled={selectedRole === user.role}
                            >
                                Update Role
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirmation popup */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-sm md:max-w-md">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete User</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete user <span className="font-semibold">{user.name}</span>? This action cannot be undone.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <button
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 w-full sm:w-auto"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 w-full sm:w-auto"
                                onClick={handleDeleteUser}
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}