import { NextResponse } from "next/server";
import { listProducts } from "@/lib/db/products";
import { isHaram } from "@/lib/haram-filter";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const product_groups = searchParams.get("product_groups") || undefined;
        const keyword = searchParams.get("keyword") || undefined;
        const page = parseInt(searchParams.get("page") || "1", 10);
        const page_size = parseInt(searchParams.get("page_size") || "20", 10);
        const min_discount = parseFloat(searchParams.get("min_discount") || "0");
        const coupon_only = searchParams.get("coupon_only") === "1" || searchParams.get("coupon_only") === "true";

        const result = await listProducts({
            product_groups,
            keyword,
            page,
            page_size,
            min_discount: min_discount > 0 ? min_discount : undefined,
            coupon_only: coupon_only || undefined,
        });

        // Apply haram filter to items
        result.items = result.items.filter(
            (p) => !isHaram(p.title || "", p.product_group || "")
        );

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (err) {
        console.error("[products/list] error:", err);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch products",
                data: { items: [], total: 0, page: 1, page_size: 20 },
            },
            { status: 500 }
        );
    }
}
