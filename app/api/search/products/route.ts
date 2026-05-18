import { NextResponse } from "next/server";
import { listProducts } from "@/lib/db/products";
import { isHaram } from "@/lib/haram-filter";

export const dynamic = "force-dynamic";

function safeDecodeURIComponent(str: string): string {
    try {
        const decoded = decodeURIComponent(str);
        return decoded.includes("%") ? decodeURIComponent(decoded) : decoded;
    } catch {
        return str;
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const rawKeyword = searchParams.get("keyword") || "";
        const keyword = rawKeyword ? safeDecodeURIComponent(rawKeyword) : undefined;
        const page = parseInt(searchParams.get("page") || "1", 10);
        const page_size = parseInt(searchParams.get("page_size") || "20", 10);

        const result = await listProducts({ keyword, page, page_size });

        result.items = result.items.filter(
            (p) => !isHaram(p.title || "", p.product_group || "")
        );

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (err) {
        console.error("[search/products] error:", err);
        return NextResponse.json(
            {
                success: false,
                error: "Search failed",
                data: { items: [], total: 0, page: 1, page_size: 20 },
            },
            { status: 500 }
        );
    }
}
