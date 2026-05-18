import { NextResponse } from "next/server";
import { getFeaturedProducts } from "@/lib/db/products";
import { isHaram } from "@/lib/haram-filter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || searchParams.get("page_size") || "8", 10);

        const products = await getFeaturedProducts(Math.min(50, limit * 3)); // over-fetch, then filter

        const filtered = products.filter(
            (p) => !isHaram(p.title || "", p.product_group || "")
        );

        return NextResponse.json({
            success: true,
            data: filtered.slice(0, limit),
        });
    } catch (err) {
        console.error("[products/featured] error:", err);
        return NextResponse.json(
            { success: false, error: "Failed to fetch featured products", data: [] },
            { status: 500 }
        );
    }
}
