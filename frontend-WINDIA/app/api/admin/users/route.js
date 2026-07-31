import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse } from "@/src/lib/security";

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await isAdmin(user.id, supabaseAdmin))) return errorResponse("Admin access required", 403);

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, name, email, phone, role, city, state, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return errorResponse("Could not load users", 500);
  return successResponse({ users: data });
}
