import type { ObjectId } from "mongodb";

import type { UserRole } from "./UserRole";

/**
 * User model interface
 */
export interface User {
    _id?: ObjectId;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * User registration request interface
 */
export interface RegisterUserRequest {
    name: string;
    email: string;
    password: string;
}

/**
 * User response interface (excluding sensitive information)
 */
export interface UserResponse {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image?: string;
}

/**
 * Convert user data to a safe response format
 */
export function toUserResponse(user: User): UserResponse {
    return {
        id: user._id?.toString() || '',
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image
    };
} 