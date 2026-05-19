/**
 * Server-side favorites utility
 * Handle server-side favorites logic
 */

import fs from 'fs';
import path from 'path';

import type { NextApiRequest } from 'next';


// Data storage path
const DATA_DIR = path.join(process.cwd(), '.data');
const FAVORITES_DIR = path.join(DATA_DIR, 'favorites');

// initialize data directory
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(FAVORITES_DIR)) {
    fs.mkdirSync(FAVORITES_DIR, { recursive: true });
}

/**
 * Get client ID from request
 * @param req NextApiRequest object
 * @returns Client ID or null
 */
export function getClientIdFromRequest(req: NextApiRequest): string | null {
    const clientId = req.headers['x-client-id'];

    if (!clientId || typeof clientId !== 'string' || clientId.trim() === '') {
        return null;
    }

    return clientId;
}

/**
 * Validate whether client ID is valid
 * @param clientId Client ID
 * @returns Whether it is valid
 */
export function validateClientId(clientId: string): boolean {
    // Simple validation: ensure clientId is a string starting with client_
    return Boolean(clientId && typeof clientId === 'string' && clientId.startsWith('client_'));
}

/**
 * Get client favorites list file path
 * @param clientId Client ID
 * @returns File path
 */
function getClientFavoritesPath(clientId: string): string {
    return path.join(FAVORITES_DIR, `${clientId}.json`);
}

/**
 * Get client's favorited product ID list
 * @param clientId Client ID
 * @returns Array of favorited product IDs
 */
export function getClientFavoriteIds(clientId: string): string[] {
    const filePath = getClientFavoritesPath(clientId);

    if (!fs.existsSync(filePath)) {
        return [];
    }

    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(data);

        if (Array.isArray(parsed)) {
            return parsed.filter(id => typeof id === 'string' && id.trim() !== '');
        }

        return [];
    } catch {
        return [];
    }
}

/**
 * Save client's favorited product ID list
 * @param clientId Client ID
 * @param productIds Array of favorited product IDs
 */
export function saveClientFavoriteIds(clientId: string, productIds: string[]): void {
    const filePath = getClientFavoritesPath(clientId);

    try {
        // Ensure data directory exists
        if (!fs.existsSync(FAVORITES_DIR)) {
            fs.mkdirSync(FAVORITES_DIR, { recursive: true });
        }

        // save data
        fs.writeFileSync(filePath, JSON.stringify(productIds), 'utf-8');
    } catch {
        return;
    }
}

/**
 * Add product to client favorites list
 * @param clientId Client ID
 * @param productId Product ID
 * @returns Updated array of favorited product IDs
 */
export function addToClientFavorites(clientId: string, productId: string): string[] {
    if (!productId || typeof productId !== 'string') {
        throw new Error('Invalid product ID');
    }

    const favoriteIds = getClientFavoriteIds(clientId);

    if (!favoriteIds.includes(productId)) {
        favoriteIds.push(productId);
        saveClientFavoriteIds(clientId, favoriteIds);
    }

    return favoriteIds;
}

/**
 * Remove product from client favorites list
 * @param clientId Client ID
 * @param productId Product ID
 * @returns Updated array of favorited product IDs
 */
export function removeFromClientFavorites(clientId: string, productId: string): string[] {
    if (!productId || typeof productId !== 'string') {
        throw new Error('Invalid product ID');
    }

    let favoriteIds = getClientFavoriteIds(clientId);

    if (favoriteIds.includes(productId)) {
        favoriteIds = favoriteIds.filter(id => id !== productId);
        saveClientFavoriteIds(clientId, favoriteIds);
    }

    return favoriteIds;
}

/**
 * Sync client favorites list
 * @param clientId Client ID
 * @param productIds Array of product IDs
 * @returns Updated array of favorited product IDs
 */
export function syncClientFavorites(clientId: string, productIds: string[]): string[] {
    if (!Array.isArray(productIds)) {
        throw new Error('Invalid product ID array');
    }

    // Filter out invalid IDs
    const validProductIds = productIds.filter(id => typeof id === 'string' && id.trim() !== '');

    // save data
    saveClientFavoriteIds(clientId, validProductIds);

    return validProductIds;
} 