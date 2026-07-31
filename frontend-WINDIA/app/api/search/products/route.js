import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { errorResponse, successResponse } from "@/src/lib/security";

export async function GET(req) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (!q || q.length < 2) return successResponse({ products: [] });

  const term = q.replace(/[%,]/g, " ");

  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, name, price, image, image_url, flavor")
    .eq("is_active", true)
    .or(`name.ilike.%${term}%,flavor.ilike.%${term}%,short_description.ilike.%${term}%`)
    .limit(8);

  if (error) {
    console.error("Search error:", error.message);
    return errorResponse("Search failed", 500);
  }

  return successResponse({ products: data || [] });
}
