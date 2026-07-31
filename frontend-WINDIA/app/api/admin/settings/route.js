import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse } from "@/src/lib/security";

export async function GET(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await isAdmin(user.id, supabaseAdmin))) return errorResponse("Admin access required", 403);

  const { data, error } = await supabaseAdmin.from("settings").select("*");
  if (error) return errorResponse("Could not load settings", 500);

  return successResponse({ settings: Object.fromEntries((data || []).map((s) => [s.key, s.value])) });
}

export async function PATCH(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return errorResponse("Please sign in", 401);
  if (!(await isAdmin(user.id, supabaseAdmin))) return errorResponse("Admin access required", 403);

  const body = await req.json().catch(() => ({}));
  if (!body.key || body.value === undefined) return errorResponse("key and value are required", 400);

  if (body.key === "tax_rate_percent") {
    const num = Number(body.value);
    if (Number.isNaN(num) || num < 0 || num > 100) return errorResponse("Tax rate must be a number between 0 and 100", 400);
  }

  const { data, error } = await supabaseAdmin
    .from("settings")
    .upsert({ key: body.key, value: String(body.value), updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return errorResponse("Could not update setting", 500);
  return successResponse({ setting: data });
}
