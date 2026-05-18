import { NextResponse } from "next/server";
import { getCategoryStats } from "@/lib/db/products";
import type { CategoryStats } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const product_groups = await getCategoryStats();

        const stats: CategoryStats = {
            browse_nodes: {},
            browse_tree: {},
            bindings: {},
            product_groups,
        };

        return NextResponse.json(stats);
    } catch (err) {
        console.error("[categories/stats] error:", err);
        const empty: CategoryStats = {
            browse_nodes: {},
            browse_tree: {},
            bindings: {},
            product_groups: {},
        };
        return NextResponse.json(empty, { status: 500 });
    }
}
