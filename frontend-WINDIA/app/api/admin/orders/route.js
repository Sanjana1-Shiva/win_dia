import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse } from "@/src/lib/security";

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await isAdmin(user.id, supabaseAdmin))) return errorResponse("Admin access required", 403);

  const status = new URL(req.url).searchParams.get("status");

  let query = supabaseAdmin.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(200);
  if (status) query = query.eq("order_status", status);

  const { data, error } = await query;
  if (error) return errorResponse("Could not load orders", 500);
  return successResponse({ orders: data });
}
