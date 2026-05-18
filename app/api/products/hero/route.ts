import { NextResponse } from "next/server";
import { getFeaturedProducts } from "@/lib/db/products";
import { isHaram } from "@/lib/haram-filter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "3", 10);

        // Fetch a larger pool, filter haram, then pick randomly
        const products = await getFeaturedProducts(Math.min(50, limit * 5));
        const clean = products.filter((p) => !isHaram(p.title || "", p.product_group || ""));

        // Shuffle using time-based seed for variety without full randomness
        const now = new Date();
        const minuteSeed =
            now.getFullYear() * 10000000 +
            (now.getMonth() + 1) * 100000 +
            now.getDate() * 1000 +
            now.getHours() * 100 +
            now.getMinutes();

        const seedRandom = (seed: number) => {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        };

        const shuffled = [...clean];
        let s = minuteSeed;
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(seedRandom(s++) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        const selected = shuffled.slice(0, limit);

        // Build promo cards for HeroSection
        const promoCards = selected.map((product, index) => {
            const offer = product.offers?.[0];
            const isCoupon = offer?.coupon_type && offer?.coupon_value;
            let discountText = "";
            if (isCoupon) {
                discountText =
                    offer!.coupon_type === "fixed"
                        ? `$${offer!.coupon_value} Coupon`
                        : `${offer!.coupon_value}% Coupon`;
            } else if (offer?.savings_percentage) {
                discountText = `${Math.round(offer.savings_percentage)}% OFF`;
            } else if (product.discount_rate && product.discount_rate > 0) {
                discountText = `${Math.round(product.discount_rate)}% OFF`;
            }

            return {
                id: index + 1,
                title: product.title,
                description: product.brand || "",
                discount: discountText,
                ctaText: isCoupon ? "Get Coupon" : "Shop Now",
                link: product.url || "",
                image: product.main_image || product.image_url || "",
                brand: product.brand,
                productId: product.asin || product.id,
            };
        });

        return NextResponse.json({
            success: true,
            products: selected,
            promoCards,
        });
    } catch (err) {
        console.error("[products/hero] error:", err);
        return NextResponse.json({
            success: false,
            products: [],
            promoCards: [],
            error: "Failed to fetch hero products",
        });
    }
}
