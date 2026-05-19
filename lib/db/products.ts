/**
 * MongoDB product queries for the Amazon-Frontend.
 * Transforms raw pipeline documents into the Product type used by the UI.
 */

import type { Collection } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type { Product, ProductOffer } from "@/types/api";

const DB_NAME = process.env.MONGODB_DB || "oohunt";
const COLLECTION = "products";

// Reverse map: slug -> raw category display name used in product_group
const SLUG_TO_CATEGORY: Record<string, string> = {
    electronics: "Electronics",
    clothing: "Clothing, Shoes & Jewelry",
    "home-kitchen": "Home & Kitchen",
    sports: "Sports & Outdoors",
    beauty: "Beauty & Personal Care",
    toys: "Toys & Games",
    books: "Books",
    automotive: "Automotive",
    health: "Health & Household",
    tools: "Tools & Home Improvement",
    pets: "Pet Supplies",
    garden: "Patio, Lawn & Garden",
    baby: "Baby",
    office: "Office Products",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCollection(): Promise<Collection<any>> {
    const client = await clientPromise;
    return client.db(DB_NAME).collection(COLLECTION);
}

/** Convert a raw MongoDB pipeline document into a frontend Product object */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toProduct(doc: Record<string, any>): Product {
    const price = parseFloat(doc.discount_price) || 0;
    const originalPrice = parseFloat(doc.original_price) || price;
    const discountRate = parseFloat(doc.discount) || 0;

    const offers: ProductOffer[] = [];
    if (price > 0) {
        offers.push({
            condition: "New",
            price,
            currency: "USD",
            savings: originalPrice > price ? originalPrice - price : null,
            savings_percentage: discountRate || null,
            coupon_type: doc.coupon_type || null,
            coupon_value: doc.coupon_value || null,
            is_prime: false,
        });
    }

    return {
        id: doc.product_id || doc._id?.toString() || "",
        asin: doc.asin || doc.product_id || "",
        title: doc.product_name || "",
        brand: doc.brand_name || "",
        price,
        original_price: originalPrice,
        discount_rate: discountRate,
        main_image: doc.image || "",
        image_url: doc.image || "",
        product_group: doc.category_raw || SLUG_TO_CATEGORY[doc.category] || doc.category || "",
        rating: doc.rating ? parseFloat(doc.rating) : undefined,
        rating_count: doc.reviews || 0,
        reviews: doc.reviews || 0,
        availability: doc.availability || "In Stock",
        url: doc.url || "",
        offers,
        source: doc.source || "cj_crawler",
        api_provider: "partnerboost",
    };
}

export interface ProductQueryOptions {
    product_groups?: string;    // raw category name, e.g. "Electronics"
    keyword?: string;
    page?: number;
    page_size?: number;
    min_discount?: number;
    coupon_only?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFilter(opts: ProductQueryOptions): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (opts.product_groups) {
        // product_groups is the raw category name — matches category_raw in MongoDB
        // Also try matching the slug in case the caller uses it
        const raw = opts.product_groups;
        const asSlug = SLUG_TO_CATEGORY[raw];
        if (asSlug) {
            // caller passed a slug — match by category field
            filter.category = raw;
        } else {
            // caller passed a display name like "Electronics"
            filter.category_raw = raw;
        }
    }

    if (opts.coupon_only) {
        filter.coupon_type = { $exists: true, $ne: null };
    }

    if (opts.min_discount && opts.min_discount > 0) {
        // discount is stored as a numeric string, use $where would be slow;
        // instead filter using a regex range — simpler: just cast with $expr
        filter.$expr = { $gte: [{ $toDouble: { $ifNull: ["$discount", "0"] } }, opts.min_discount] };
    }

    if (opts.keyword) {
        filter.$or = [
            { product_name: { $regex: opts.keyword, $options: "i" } },
            { brand_name: { $regex: opts.keyword, $options: "i" } },
        ];
    }

    return filter;
}

export async function listProducts(opts: ProductQueryOptions = {}): Promise<{
    items: Product[];
    total: number;
    page: number;
    page_size: number;
}> {
    const col = await getCollection();
    const page = Math.max(1, opts.page || 1);
    const page_size = Math.min(100, Math.max(1, opts.page_size || 20));
    const skip = (page - 1) * page_size;
    const filter = buildFilter(opts);

    // Count unique ASINs — $group without $sort avoids the Atlas 32 MB memory limit
    const [countResult] = await col.aggregate([
        { $match: filter },
        { $group: { _id: { $ifNull: ["$asin", "$product_id"] } } },
        { $count: "count" },
    ]).toArray();
    const total = countResult?.count ?? 0;

    // Fetch enough docs to fill the page after JS-level dedup.
    // With ~46 dupes in 24 k docs the over-fetch of 3× is more than sufficient.
    const fetchLimit = page_size * 3 + skip;
    const rawDocs = await col
        .find(filter)
        .sort({ fetched_at: -1 })
        .limit(fetchLimit)
        .toArray();

    // Deduplicate in JS — keep first occurrence (most recent after sort)
    const seen = new Set<string>();
    const deduped: typeof rawDocs = [];
    for (const doc of rawDocs) {
        const key: string = doc.asin || doc.product_id || String(doc._id);
        if (!seen.has(key)) {
            seen.add(key);
            deduped.push(doc);
        }
    }

    return {
        items: deduped.slice(skip, skip + page_size).map(toProduct),
        total,
        page,
        page_size,
    };
}

export async function countProducts(opts: Omit<ProductQueryOptions, "page" | "page_size"> = {}): Promise<number> {
    const col = await getCollection();
    const filter = buildFilter(opts);
    return col.countDocuments(filter);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
    const col = await getCollection();
    // Sample generously, then deduplicate by both ASIN and brand in JS.
    // This prevents the same brand appearing multiple times on the homepage.
    const raw = await col.aggregate([
        { $match: { discount: { $nin: ["", "0", null] } } },
        { $sample: { size: limit * 8 } },
    ]).toArray();

    const seenAsins = new Set<string>();
    const seenBrands = new Set<string>();
    const deduped: typeof raw = [];

    for (const doc of raw) {
        const asinKey: string = doc.asin || doc.product_id || String(doc._id);
        const brandKey: string = (doc.brand_name || "").toLowerCase().trim();

        // Skip if same ASIN already included, or same brand already included
        if (seenAsins.has(asinKey)) continue;
        if (brandKey && seenBrands.has(brandKey)) continue;

        seenAsins.add(asinKey);
        if (brandKey) seenBrands.add(brandKey);
        deduped.push(doc);

        if (deduped.length >= limit) break;
    }

    return deduped.map(toProduct);
}

/** Return every DB record for a given ASIN — used by the product detail page. */
export async function getProductsByAsin(asin: string): Promise<Product[]> {
    const col = await getCollection();
    const docs = await col
        .find({ $or: [{ asin }, { product_id: asin }] })
        .sort({ discount: -1, fetched_at: -1 })
        .toArray();
    return docs.map(toProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
    const col = await getCollection();
    const doc = await col.findOne({
        $or: [{ product_id: id }, { asin: id }],
    });
    return doc ? toProduct(doc) : null;
}

export async function getCategoryStats(): Promise<Record<string, number>> {
    const col = await getCollection();
    const agg = await col.aggregate([
        { $match: { category_raw: { $exists: true, $ne: "" } } },
        { $group: { _id: "$category_raw", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
    ]).toArray();

    const stats: Record<string, number> = {};
    for (const row of agg) {
        if (row._id) stats[row._id] = row.count;
    }
    return stats;
}
