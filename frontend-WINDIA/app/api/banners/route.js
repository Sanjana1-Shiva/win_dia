import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { errorResponse, successResponse } from "@/src/lib/security";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const position = searchParams.get("position") || "homepage";
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("banners")
    .select("id, title, image_url, link_url, position")
    .eq("position", position)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("sort_order", { ascending: true });

  if (error) return errorResponse("Could not load banners", 500);
  return successResponse({ banners: data });
}
