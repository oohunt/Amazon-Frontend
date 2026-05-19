import type { Collection } from "mongodb";

import type { UserFavorite, UserFavoritesResponse } from "@/lib/models/UserFavorite";
import clientPromise from "@/lib/mongodb";

/**
 * Get favorites collection
 */
async function getFavoritesCollection(): Promise<Collection<UserFavorite>> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "oohunt");

    return db.collection<UserFavorite>("favorites");
}

/**
 * Get user's favorites list
 */
export async function getUserFavorites(userId: string): Promise<UserFavoritesResponse> {
    const collection = await getFavoritesCollection();
    const favorites = await collection
        .find({ userId })
        .sort({ createdAt: -1 })
        .toArray();

    return {
        favorites,
        total: favorites.length
    };
}

/**
 * Add to favorites
 */
export async function addFavorite(userId: string, productId: string): Promise<UserFavorite> {
    const collection = await getFavoritesCollection();

    const favorite: UserFavorite = {
        userId,
        productId,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    await collection.insertOne(favorite);

    return favorite;
}

/**
 * Delete favorite
 */
export async function removeFavorite(userId: string, productId: string): Promise<boolean> {
    const collection = await getFavoritesCollection();
    const result = await collection.deleteOne({ userId, productId });

    return result.deletedCount > 0;
}

/**
 * Check whether a product is favorited
 */
export async function isFavorited(userId: string, productId: string): Promise<boolean> {
    const collection = await getFavoritesCollection();
    const favorite = await collection.findOne({ userId, productId });

    return !!favorite;
}

/**
 * Batch-sync favorites
 */
export async function syncFavorites(userId: string, productIds: string[]): Promise<UserFavorite[]> {
    const collection = await getFavoritesCollection();

    // delete all existing favorites
    await collection.deleteMany({ userId });

    if (productIds.length === 0) {
        return [];
    }

    // Bulk insert new favorites
    const favorites: UserFavorite[] = productIds.map(productId => ({
        userId,
        productId,
        createdAt: new Date(),
        updatedAt: new Date()
    }));

    await collection.insertMany(favorites);

    return favorites;
} 