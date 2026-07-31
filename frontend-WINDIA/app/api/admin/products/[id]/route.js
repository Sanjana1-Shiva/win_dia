import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse, sanitizeObject } from "@/src/lib/security";

export async function PATCH(req, { params }) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await isAdmin(user.id, supabaseAdmin))) return errorResponse("Admin access required", 403);

  const body = sanitizeObject(await req.json().catch(() => ({})), 3000);
  const allowedFields = [
    "name", "description", "short_description", "price", "original_price", "image", "image_url",
    "flavor", "category_id", "count_in_stock", "is_low_gi", "is_gluten_free", "is_vegan", "gi_value", "net_weight", "variant_group",
    "is_bestseller", "is_active", "sku",
  ];
  const update = { updated_at: new Date().toISOString() };
  for (const key of allowedFields) if (body[key] !== undefined) update[key] = body[key];

  if (update.price !== undefined && (isNaN(update.price) || Number(update.price) <= 0)) return errorResponse("Invalid price", 400);
  if (update.count_in_stock !== undefined && (isNaN(update.count_in_stock) || Number(update.count_in_stock) < 0)) return errorResponse("Invalid stock quantity", 400);

  const { data, error } = await supabaseAdmin.from("products").update(update).eq("id", params.id).select().single();
  if (error) return errorResponse("Could not update product", 500);
  return successResponse({ product: data });
}

export async function DELETE(req, { params }) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await isAdmin(user.id, supabaseAdmin))) return errorResponse("Admin access required", 403);

  // Soft delete — deactivate instead of removing, so past orders referencing this product still display correctly.
  const { error } = await supabaseAdmin.from("products").update({ is_active: false }).eq("id", params.id);
  if (error) return errorResponse("Could not remove product", 500);
  return successResponse({ deactivated: true });
}
