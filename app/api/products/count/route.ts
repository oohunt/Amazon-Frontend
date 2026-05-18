import { NextResponse } from "next/server";
import { countProducts } from "@/lib/db/products";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const product_groups = searchParams.get("product_groups") || undefined;

        const total = await countProducts({ product_groups });

        return NextResponse.json({ success: true, data: { total } });
    } catch (err) {
        console.error("[products/count] error:", err);
        return NextResponse.json(
            { success: false, data: { total: 0 }, error: "Failed to count products" },
            { status: 500 }
        );
    }
}
