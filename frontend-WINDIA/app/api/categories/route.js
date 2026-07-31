import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { errorResponse, successResponse } from "@/src/lib/security";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id, name, slug, description, image, parent_id, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return errorResponse("Could not load categories", 500);
  return successResponse({ categories: data });
}
