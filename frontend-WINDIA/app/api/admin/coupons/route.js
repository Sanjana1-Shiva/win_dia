import { supabase } from "@/src/lib/supabase";
import { supabaseAdmin } from "@/src/lib/supabase-admin";
import { getAuthedUser, isAdmin, errorResponse, successResponse, sanitizeObject } from "@/src/lib/security";

async function requireAdmin(req) {
  const user = await getAuthedUser(req, supabase);
  if (!user) return { error: errorResponse("Please sign in", 401) };
  if (!(await isAdmin(user.id, supabaseAdmin))) return { error: errorResponse("Admin access required", 403) };
  return { user };
}

export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { data, error: dbErr } = await supabaseAdmin
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbErr) return errorResponse("Could not load coupons", 500);
  return successResponse({ coupons: data });
}

export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = sanitizeObject(await req.json().catch(() => ({})), 300);
  const code = (body.code || "").trim().toUpperCase();
  const discountPercent = Number(body.discountPercent);
  const minOrderValue = Number(body.minOrderValue) || 0;

  if (!code || code.length < 3) return errorResponse("Enter a valid coupon code (min 3 characters)", 400);
  if (!discountPercent || discountPercent <= 0 || discountPercent > 100) {
    return errorResponse("Discount must be between 1 and 100 percent", 400);
  }

  const { data, error: dbErr } = await supabaseAdmin
    .from("coupons")
    .insert({
      code,
      discount_percent: discountPercent,
      min_order_value: minOrderValue,
      active: true,
      expires_at: body.expiresAt || null,
      usage_limit: body.usageLimit ? Number(body.usageLimit) : null,
    })
    .select()
    .single();

  if (dbErr) {
    if (dbErr.code === "23505") return errorResponse("A coupon with that code already exists", 409);
    return errorResponse("Could not create coupon", 500);
  }
  return successResponse({ coupon: data }, 201);
}

export async function PATCH(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = sanitizeObject(await req.json().catch(() => ({})), 300);
  if (!body.id) return errorResponse("Coupon id is required", 400);

  const { data, error: dbErr } = await supabaseAdmin
    .from("coupons")
    .update({ active: Boolean(body.active) })
    .eq("id", body.id)
    .select()
    .single();

  if (dbErr) return errorResponse("Could not update coupon", 500);
  return successResponse({ coupon: data });
}
