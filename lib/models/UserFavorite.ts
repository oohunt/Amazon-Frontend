import type { ObjectId } from "mongodb";

/**
 * User favorites data model
 */
export interface UserFavorite {
    _id?: ObjectId;
    userId: string;           // User ID
    productId: string;        // Product ID
    createdAt: Date;         // Created time
    updatedAt: Date;         // Update timestamp
}

/**
 * User favorites list response type
 */
export interface UserFavoritesResponse {
    favorites: UserFavorite[];
    total: number;
}

/**
 * Request type for creating a favorite
 */
export interface CreateFavoriteRequest {
    userId: string;
    productId: string;
}

/**
 * Request type for deleting a favorite
 */
export interface DeleteFavoriteRequest {
    userId: string;
    productId: string;
} 