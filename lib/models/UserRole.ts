/**
 * User role enum
 */
export enum UserRole {
    USER = 'user',           // Regular user
    ADMIN = 'admin',         // Admin
    SUPER_ADMIN = 'super_admin'  // Super admin
}

/**
 * Role permission mapping
 */
export const RolePermissions = {
    [UserRole.USER]: {
        canAccessDashboard: false,
        canManageProducts: false,
        canManageUsers: false,
        canFilterAPI: false,
        canExportData: false,
    },
    [UserRole.ADMIN]: {
        canAccessDashboard: true,
        canManageProducts: true,
        canManageUsers: false,
        canFilterAPI: true,
        canExportData: true,
    },
    [UserRole.SUPER_ADMIN]: {
        canAccessDashboard: true,
        canManageProducts: true,
        canManageUsers: true,
        canFilterAPI: true,
        canExportData: true,
    }
} as const;

/**
 * User role interface
 */
export interface UserRoleData {
    userId: string;
    role: UserRole;
    updatedAt: Date;
}

/**
 * Check whether the user has a specific permission
 */
export function hasPermission(role: UserRole, permission: keyof typeof RolePermissions[UserRole.USER]): boolean {
    return RolePermissions[role][permission];
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole) {
    return RolePermissions[role];
}

/**
 * Check whether the user has admin role
 */
export function isAdminRole(role: UserRole): boolean {
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
}

/**
 * Check whether the user is a super admin
 */
export function isSuperAdmin(role: UserRole): boolean {
    return role === UserRole.SUPER_ADMIN;
}

/**
 * Predefined admin account list
 */
export const ADMIN_ACCOUNTS = [
    't2715481617@gmail.com',
    'a.aadil26@gmail.com',
    'oohuntofficial@gmail.com'
] as const;

/**
 * Predefined super admin account list
 */
export const SUPER_ADMIN_ACCOUNTS = [
    't2715481617@gmail.com',
    'a.aadil26@gmail.com',
    'oohuntofficial@gmail.com'
] as const;

/**
 * Check whether the email belongs to a predefined admin account
 */
export function isAdminAccount(email: string): boolean {
    // Compare after converting to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase();

    return ADMIN_ACCOUNTS.some(admin => admin.toLowerCase() === normalizedEmail);
}

/**
 * Check whether the email belongs to a predefined super-admin account
 */
export function isSuperAdminAccount(email: string): boolean {
    // Compare after converting to lowercase for case-insensitive comparison
    const normalizedEmail = email.toLowerCase();

    return SUPER_ADMIN_ACCOUNTS.some(admin => admin.toLowerCase() === normalizedEmail);
} 