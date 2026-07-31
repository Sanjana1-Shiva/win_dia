import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse } from "@/src/lib/security";

async function requireAdmin(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return { error: errorResponse("Please sign in", 401) };
  if (!(await isAdmin(user.id, supabaseAdmin))) return { error: errorResponse("Admin access required", 403) };
  return { user };
}

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { data: reviews, error: dbErr } = await supabaseAdmin
    .from("reviews")
    .select("id, rating, title, comment, is_verified_purchase, created_at, product_id, user_id, products(name)")
    .order("created_at", { ascending: false });

  if (dbErr) return errorResponse("Could not load reviews", 500);

  // reviews.user_id points at auth.users, not profiles, so it can't be
  // auto-embedded by PostgREST — fetch names separately and map them in.
  const userIds = [...new Set((reviews || []).map((r) => r.user_id).filter(Boolean))];
  let profileMap = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, name, email").in("id", userIds);
    profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
  }

  const enriched = (reviews || []).map((r) => ({ ...r, reviewer: profileMap[r.user_id] || null }));
  return successResponse({ reviews: enriched });
}

export async function DELETE(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return errorResponse("Review id is required", 400);

  // Deleting triggers the same rating-aggregate trigger as a normal delete
  // (005_product_rating_aggregate.sql), so the product's star rating stays accurate.
  const { error: dbErr } = await supabaseAdmin.from("reviews").delete().eq("id", id);
  if (dbErr) return errorResponse("Could not delete review", 500);
  return successResponse({ deleted: true });
}
