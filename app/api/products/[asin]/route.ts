import { NextResponse, type NextRequest } from "next/server";
import { isHaram } from "@/lib/haram-filter";
import { getProductById } from "@/lib/db/products";

export const dynamic = "force-dynamic";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ asin: string }> }
) {
    try {
        const { asin } = await params;
        if (!asin) {
            return NextResponse.json(
                { success: false, error: "Product ID is required" },
                { status: 400 }
            );
        }

        const product = await getProductById(asin);
        if (!product) {
            return NextResponse.json(
                { success: false, error: "Product not found" },
                { status: 404 }
            );
        }

        if (isHaram(product.title || "", product.product_group || "")) {
            return NextResponse.json(
                { success: false, error: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: product });
    } catch (err) {
        console.error("[products/[asin]] error:", err);
        return NextResponse.json(
            { success: false, error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}
