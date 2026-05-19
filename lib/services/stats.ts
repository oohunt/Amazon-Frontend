import type { Collection } from "mongodb";

import type { User } from "@/lib/models/User";
import type { UserFavorite } from "@/lib/models/UserFavorite";
import clientPromise from "@/lib/mongodb";

/**
 * Get users collection
 */
async function getUsersCollection(): Promise<Collection<User>> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "oohunt");

    return db.collection<User>("users");
}

/**
 * Get favorites collection
 */
async function getFavoritesCollection(): Promise<Collection<UserFavorite>> {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "oohunt");

    return db.collection<UserFavorite>("favorites");
}

/**
 * Get user statistics
 */
export async function getUserStats() {
    try {
        const collection = await getUsersCollection();

        // Get total user count
        const totalUsers = await collection.countDocuments();

        // Get number of active users in the past 30 days
        const thirtyDaysAgo = new Date();

        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUsers = await collection.countDocuments({
            updatedAt: { $gte: thirtyDaysAgo }
        });

        // Get number of new users in the past 30 days
        const newUsersLastMonth = await collection.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        return {
            total_users: totalUsers,
            active_users: activeUsers,
            new_users_last_month: newUsersLastMonth,
            last_update: new Date().toISOString()
        };
    } catch {

        return {
            total_users: 0,
            active_users: 0,
            new_users_last_month: 0,
            last_update: new Date().toISOString()
        };
    }
}

/**
 * Get favorites statistics
 */
export async function getFavoriteStats() {
    try {
        const collection = await getFavoritesCollection();

        // Get total favorites count
        const totalFavorites = await collection.countDocuments();

        // Get unique user count with favorites
        const uniqueUsers = (await collection.distinct("userId")).length;

        // Get number of favorites in the past 30 days
        const thirtyDaysAgo = new Date();

        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const lastMonthFavorites = await collection.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        return {
            total_favorites: totalFavorites,
            unique_users: uniqueUsers,
            last_month_favorites: lastMonthFavorites,
            last_update: new Date().toISOString()
        };
    } catch {
        return {
            total_favorites: 0,
            unique_users: 0,
            last_month_favorites: 0,
            last_update: new Date().toISOString()
        };
    }
}
